// /functions/register-download.js
// Función simplificada para registrar descargas en Google Sheets

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { email, timestamp, source } = data;

    // Validación básica
    if (!email) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Email es requerido' })
      };
    }

    // === PARTE 1: REGISTRAR EN GOOGLE SHEETS ===
    try {
      const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
      await doc.loadInfo();
      
      // Buscar la hoja - puedes cambiar el nombre aquí
      const sheet = doc.sheetsByTitle['Descargas'] || doc.sheetsByTitle['Prueba'];
      
      if (!sheet) {
        console.error('⚠️ No se encontró la hoja "Prueba" en Google Sheets');
        throw new Error('Hoja "Prueba" no encontrada');
      }
      
      // Agregar nueva fila con los datos
      await sheet.addRow({
        'Email': email,
        'Fecha': new Date().toLocaleString('es-ES'),
        'Timestamp': timestamp,
        'Fuente': source || 'web',
        'IP': event.headers['x-forwarded-for'] || 'N/A'
      });
      
      console.log(`✅ Registrado en Sheets: ${email}`);
    } catch (sheetsError) {
      // Si falla Sheets, no detenemos el proceso
      console.error('Error con Google Sheets:', sheetsError);
    }

    // === PARTE 2: ENVIAR EMAIL DE CONFIRMACIÓN (OPCIONAL) ===
    try {
      const transporter = nodemailer.createTransporter({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.HOSTINGER_EMAIL,
          pass: process.env.HOSTINGER_PASSWORD
        }
      });

      // Email al usuario con el enlace de descarga
      const mailToUser = {
        from: `"CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: email,
        subject: '✅ Tu descarga de CostePro está lista',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); 
                        color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 30px; 
                       background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); 
                       color: white; text-decoration: none; border-radius: 50px; 
                       font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>CostePro</h1>
              </div>
              <div class="content">
                <h2>¡Gracias por tu interés en CostePro!</h2>
                <p>Hola,</p>
                <p>Aquí está tu enlace de descarga directa:</p>
                <div style="text-align: center;">
                  <a href="https://www.dropbox.com/scl/fi/ikjpnocha7qesd07mmq46/CostePro.zip?rlkey=7r7s2i86s6v1y4q8x6a4rvq8h&dl=1" 
                     class="button">Descargar CostePro</a>
                </div>
                <p>Este enlace es permanente y puedes usarlo cuando lo necesites.</p>
                <p><strong>¿Necesitas ayuda?</strong> Simplemente responde a este email.</p>
              </div>
              <div class="footer">
                <p>© 2025 CostePro. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await transporter.sendMail(mailToUser);
      console.log(`✅ Email enviado a: ${email}`);

      // Notificación para ti (opcional)
      const mailToOwner = {
        from: `"CostePro System" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL,
        subject: `🔔 Nueva descarga: ${email}`,
        html: `
          <p><strong>Nuevo usuario ha descargado CostePro:</strong></p>
          <p>Email: ${email}</p>
          <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
          <p>IP: ${event.headers['x-forwarded-for'] || 'N/A'}</p>
        `
      };

      await transporter.sendMail(mailToOwner);
      
    } catch (emailError) {
      // Si falla el email, no es crítico
      console.error('Error enviando email:', emailError);
    }

    // Respuesta exitosa
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Descarga registrada correctamente'
      })
    };

  } catch (error) {
    console.error('Error general:', error);
    
    // Incluso si hay error, devolvemos 200 para no bloquear la descarga
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        message: 'Error en el registro, pero descarga permitida'
      })
    };
  }
};
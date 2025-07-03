// /functions/send-email.js
const nodemailer = require('nodemailer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const crypto = require('crypto');

async function appendToSheet(email, token, fingerprint) {
  try {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey || !rawKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      console.error('Error Crítico: La variable de entorno GOOGLE_PRIVATE_KEY no está configurada correctamente.');
      throw new Error('La clave privada de Google no está configurada.');
    }
    const privateKey = rawKey.replace(/\\n/g, '\n');

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Prueba'];
    if (!sheet) {
      console.error('Error: No se encontró la hoja "Prueba" en el documento de Google Sheets.');
      throw new Error('No se encontró la hoja de cálculo "Prueba".');
    }

    const timestampISO = new Date().toISOString();
    
    await sheet.addRow({ 
      'Email': email, 
      'Fecha de Solicitud': timestampISO,
      'Fingerprint': fingerprint,
      'TokenUnico': token, 
    });
    
    console.log(`Registro exitoso en Google Sheets para el email: ${email}`);

  } catch (error) {
    console.error('Error al escribir en Google Sheets:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    
    // --- CORRECCIÓN CLAVE ---
    // El nombre correcto de la función es createTransport (sin la 'er' al final).
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      }
    });

    if (data.formType === 'trial') {
      if (!data.email) {
        return { statusCode: 400, body: 'El correo electrónico es requerido.' };
      }

      const token = crypto.randomBytes(16).toString('hex');
      const fingerprint = data.fingerprint || 'no-fingerprint';
      
      await appendToSheet(data.email, token, fingerprint);

      const downloadLink = `${process.env.URL}/.netlify/functions/descargar-prueba?token=${token}`;

      const mailToCustomer = {
        from: `"CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: data.email,
        subject: '✅ Tu enlace de descarga para CostePro (expira en 12 horas)',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
              .header { background-color: #264653; color: #ffffff; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { padding: 30px 25px; color: #1f2937; line-height: 1.7; }
              .content p { margin: 0 0 15px; }
              .button-container { text-align: center; margin: 30px 0; }
              .button { background: linear-gradient(135deg, #2a9d8f, #264653); color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>CostePro</h1></div>
              <div class="content">
                <h2>¡Tu prueba gratuita está lista!</h2>
                <p>Hola,</p>
                <p>¡Muchas gracias por tu interés en <strong>CostePro</strong>! Haz clic en el botón de abajo para descargar tu versión de prueba.</p>
                <p style="font-weight: bold; color: #e76f51;">Importante: Este enlace de descarga caducará automáticamente en 12 horas.</p>
                <div class="button-container">
                  <a href="${downloadLink}" class="button">Descargar mi Prueba Gratis</a>
                </div>
                <p>Si tienes cualquier duda, simplemente responde a este correo. ¡Estaremos encantados de ayudarte!</p>
                <p>Un saludo,<br><strong>El equipo de CostePro</strong></p>
              </div>
              <div class="footer"><p>&copy; 2025 CostePro. Todos los derechos reservados.</p></div>
            </div>
          </body>
          </html>
        `
      };
      await transporter.sendMail(mailToCustomer);

    } else if (data.formType === 'contact') {
        const mailFromContactForm = {
            from: `"Web CostePro" <${process.env.HOSTINGER_EMAIL}>`,
            to: process.env.HOSTINGER_EMAIL,
            subject: `📬 Nuevo mensaje de contacto de: ${data.name}`,
            replyTo: data.email,
            html: `<p>Nombre: ${data.name}</p><p>Email: ${data.email}</p><p>Mensaje: ${data.message}</p>`
        };
        await transporter.sendMail(mailFromContactForm);
    } else {
        return { statusCode: 400, body: 'Tipo de formulario no reconocido.' };
    }

    transporter.close();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '¡Listo! Revisa tu bandeja de entrada.' }),
    };

  } catch (error) {
    console.error('--- ERROR GENERAL EN LA FUNCIÓN ---', error);
    return { statusCode: 500, body: 'Error al procesar la solicitud. Revisa los logs del servidor.' };
  }
};

// /functions/send-email.js
// Versión FINAL - Coincide con tus columnas actuales

// Importaciones con verificación
let nodemailer, GoogleSpreadsheet, JWT, crypto;

try {
  nodemailer = require('nodemailer');
  const googleSpreadsheet = require('google-spreadsheet');
  GoogleSpreadsheet = googleSpreadsheet.GoogleSpreadsheet;
  const googleAuth = require('google-auth-library');
  JWT = googleAuth.JWT;
  crypto = require('crypto');
} catch (error) {
  console.error('Error al cargar dependencias:', error);
}

// --- Función para escribir en Google Sheets ---
async function appendToSheet(email, token, fingerprint) {
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error('Error: Faltan variables de entorno de Google');
      throw new Error('Configuración de Google incompleta');
    }

    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Prueba'];
    if (!sheet) {
      console.error('No se encontró la hoja "Prueba" en el documento de Google Sheets');
      throw new Error('Hoja "Prueba" no encontrada');
    }

    const timestampISO = new Date().toISOString();
    
    // IMPORTANTE: Usar los nombres EXACTOS de las columnas (sin espacios)
    await sheet.addRow({ 
      'Email': email, 
      'FechadeSolicitud': timestampISO,  // Sin espacios
      'Fingerprint': fingerprint,
      'TokenUnico': token  // Ahora sí tienes esta columna
    });
    
    console.log(`✅ Email ${email} y token añadidos exitosamente a Google Sheets.`);
    return true;

  } catch (error) {
    console.error('❌ Error al escribir en Google Sheets:', error.message);
    throw error;
  }
}

// --- Handler principal ---
exports.handler = async (event) => {
  // Habilitar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('📨 Procesando solicitud...');
    const data = JSON.parse(event.body);
    
    if (!data.email) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'El correo electrónico es requerido.' })
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Formato de email inválido.' })
      };
    }

    console.log(`📧 Procesando solicitud para: ${data.email}`);

    // Configuración del transportador de Nodemailer
    const transporter = nodemailer.createTransporter({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // --- Lógica para PRUEBA GRATUITA ---
    if (data.formType === 'trial') {
      const token = crypto.randomBytes(32).toString('hex');
      const fingerprint = data.fingerprint || 'no-fingerprint';
      
      console.log(`🔑 Token generado: ${token.substring(0, 10)}...`);
      
      // Guardar en Google Sheets
      try {
        await appendToSheet(data.email, token, fingerprint);
      } catch (sheetError) {
        console.error('❌ Error al guardar en Sheets:', sheetError.message);
        // Continuar con el envío del email aunque falle Sheets
      }

      const downloadLink = `https://costepro.top/.netlify/functions/descargar-prueba?token=${token}`;

      // Email al cliente
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
                <p style="font-weight: bold; color: #e76f51;">⏰ Importante: Este enlace de descarga caduca en 12 horas.</p>
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

      console.log('📤 Enviando email al cliente...');
      await transporter.sendMail(mailToCustomer);
      console.log(`✅ Email enviado exitosamente a ${data.email}`);

      // Notificación al propietario
      try {
        const notificationToOwner = {
          from: `"Notificación Web" <${process.env.HOSTINGER_EMAIL}>`,
          to: process.env.HOSTINGER_EMAIL,
          subject: '🚀 Nuevo usuario ha solicitado la prueba',
          html: `
            <p>El usuario <strong>${data.email}</strong> ha recibido su enlace de descarga temporal.</p>
            <p><strong>Fingerprint:</strong> ${fingerprint}</p>
            <p><strong>Token:</strong> ${token.substring(0, 10)}...</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          `
        };
        await transporter.sendMail(notificationToOwner);
        console.log('✅ Notificación enviada al propietario');
      } catch (notifError) {
        console.error('⚠️ Error al enviar notificación:', notifError.message);
      }

    // --- Lógica para FORMULARIO DE CONTACTO ---
    } else {
      const mailFromContactForm = {
        from: `"Web CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL,
        subject: `📬 Nuevo mensaje de: ${data.name}`,
        replyTo: data.email,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Nuevo Mensaje de Contacto</h2>
            <p><strong>Nombre:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <hr>
            <p><strong>Mensaje:</strong></p>
            <p>${data.message}</p>
          </div>
        `
      };
      await transporter.sendMail(mailFromContactForm);
      console.log('✅ Mensaje de contacto enviado');
    }

    transporter.close();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: '¡Listo! Revisa tu bandeja de entrada. El enlace caduca en 12 horas.' 
      }),
    };

  } catch (error) {
    console.error('❌ ERROR EN LA FUNCIÓN:', error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: 'Error al procesar la solicitud.',
        details: error.message
      })
    };
  }
};

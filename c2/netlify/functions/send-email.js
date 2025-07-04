// /functions/send-email.js
const nodemailer = require('nodemailer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const crypto = require('crypto');

async function appendToSheet(email, token, fingerprint) {
  try {
    // Validar que la clave privada de Google esté configurada correctamente
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey || !rawKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
      console.error('Error Crítico: La variable de entorno GOOGLE_PRIVATE_KEY no está configurada correctamente.');
      throw new Error('La clave privada de Google no está configurada.');
    }
    const privateKey = rawKey.replace(/\\n/g, '\n');

    // Autenticación con la cuenta de servicio de Google
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

    const requestTimestampISO = new Date().toISOString();
    
    // Añadir la nueva fila con los datos. La fecha de solicitud se usará para la validación de 12h.
    await sheet.addRow({ 
      'Email': email, 
      'Fecha de Solicitud': requestTimestampISO,
      'Fingerprint': fingerprint,
      'TokenUnico': token, 
    });
    
    console.log(`Registro exitoso en Google Sheets para el email: ${email}`);

  } catch (error) {
    console.error('Error al escribir en Google Sheets:', error);
    // Lanzamos el error para que la función principal lo capture y devuelva un error 500
    throw error; 
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { formType, email, name, message, fingerprint } = data;

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      }
    });

    if (formType === 'trial') {
      if (!email) {
        return { statusCode: 400, body: JSON.stringify({ message: 'El correo electrónico es requerido.' }) };
      }

      const token = crypto.randomBytes(16).toString('hex');
      const safeFingerprint = fingerprint || 'no-fingerprint';
      
      // Intentar escribir en la hoja de cálculo. Si falla, la función se detendrá aquí.
      await appendToSheet(email, token, safeFingerprint);

      // Usar la variable de entorno de Netlify para la URL base, que es más robusto.
      const downloadLink = `${process.env.URL}/.netlify/functions/descargar-prueba?token=${token}`;

      const mailToCustomer = {
        from: `"CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: email,
        subject: '✅ Tu enlace de descarga para CostePro',
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
            subject: `📬 Nuevo mensaje de contacto de: ${name}`,
            replyTo: email,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Nuevo Mensaje de Contacto</h2>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr>
                <p><strong>Mensaje:</strong></p>
                <p>${message}</p>
              </div>
            `
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
    return { statusCode: 500, body: JSON.stringify({ message: 'Error al procesar la solicitud. Revisa los logs del servidor.' }) };
  }
};

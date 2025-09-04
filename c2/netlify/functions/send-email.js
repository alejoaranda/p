// /functions/send-email.js
// Versión completa con lógica de enlace temporal de 12 horas y registro en Google Sheets.

const nodemailer = require('nodemailer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const crypto = require('crypto');

// --- Función para escribir en Google Sheets ---
// Esta función se conecta a tu hoja de cálculo y añade una nueva fila con los datos del solicitante.
async function appendToSheet(email, token, fingerprint) {
  try {
    // Autenticación con Google usando las variables de entorno que configurarás en tu servidor.
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Formato correcto para la clave privada.
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); // Carga la información del documento.
    
    // Buscar la hoja llamada "Prueba"
    const sheet = doc.sheetsByTitle['Prueba'];
    if (!sheet) {
      console.error('No se encontró la hoja "Prueba" en el documento de Google Sheets');
      return;
    }

    // Guarda la fecha en formato ISO, que es el estándar universal para fechas y horas.
    const timestampISO = new Date().toISOString();
    
    // Añade la nueva fila con los datos en las columnas especificadas:
    // Columna A: Email
    // Columna B: Fecha de solicitud
    // Columna C: Fingerprint del dispositivo
    await sheet.addRow({ 
      Email: email, 
      'Fecha de Solicitud': timestampISO,
      'Fingerprint': fingerprint,
      TokenUnico: token, 
      FechaDeSolicitud: timestampISO 
    });
    
    console.log(`Email ${email}, fingerprint ${fingerprint} y token han sido añadidos a Google Sheets.`);

  } catch (error) {
    // Si falla, solo lo mostramos en la consola del servidor para no detener el envío del email al cliente.
    console.error('Error al escribir en Google Sheets:', error);
  }
}

// --- Handler principal de la función ---
// Esta es la función principal que se ejecuta cuando el formulario es enviado.
exports.handler = async (event) => {
  // Solo permitir peticiones de tipo POST.
  if (event.httpMethod !== 'POST' ) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    if (!data.email) {
      return { statusCode: 400, body: 'El correo electrónico es requerido.' };
    }

    // Configuración del transportador de Nodemailer para Hostinger.
    const transporter = nodemailer.createTransporter({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.HOSTINGER_EMAIL,
        pass: process.env.HOSTINGER_PASSWORD
      }
    });

    // --- Lógica para la PRUEBA GRATUITA ---
    if (data.formType === 'trial') {
      // 1. Generar un token único y seguro.
      const token = crypto.randomBytes(16).toString('hex');
      
      // 2. Obtener el fingerprint del dispositivo (enviado desde el frontend)
      const fingerprint = data.fingerprint || 'no-fingerprint';
      
      // 3. Guardar la información en Google Sheets.
      await appendToSheet(data.email, token, fingerprint);

      // 4. Construir el enlace de descarga especial que apunta a nuestra otra función.
      // ¡IMPORTANTE! Reemplaza "TU_DOMINIO.com" por tu dominio real.
      const downloadLink = `https://costepro.top/.netlify/functions/descargar-prueba?token=${token}`;

      // 5. Enviar el email al cliente con la plantilla elegante y el enlace temporal.
      const mailToCustomer = {
        from: `"CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: data.email,
        subject: '✅ Tu enlace de descarga para CostePro (expira en 12 horas )',
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

      // 6. Notificación para ti (opcional pero recomendado).
      const notificationToOwner = {
        from: `"Notificación Web" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL,
        subject: '🚀 Nuevo usuario ha solicitado la prueba de 3 días',
        html: `
          <p>El usuario <strong>${data.email}</strong> ha recibido su enlace de descarga temporal.</p>
          <p><strong>Fingerprint del dispositivo:</strong> ${fingerprint}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
        `
      };
      await transporter.sendMail(notificationToOwner);

    // --- Lógica para el FORMULARIO DE CONTACTO (sin cambios) ---
    } else {
      const mailFromContactForm = {
        from: `"Web CostePro" <${process.env.HOSTINGER_EMAIL}>`,
        to: process.env.HOSTINGER_EMAIL,
        subject: `📬 Nuevo mensaje de contacto de: ${data.name}`,
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
    }

    transporter.close();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '¡Listo! Revisa tu bandeja de entrada. El enlace caduca en 12 horas.' }),
    };

  } catch (error) {
    console.error('--- ERROR EN LA FUNCIÓN ---', error);
    return { statusCode: 500, body: 'Error al procesar la solicitud.' };
  }
};

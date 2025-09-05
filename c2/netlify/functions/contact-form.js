// /functions/contact-form.js
// Función para manejar el envío del formulario de contacto

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { name, email, message } = data;

    // Validación básica de los campos
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Todos los campos son requeridos' })
      };
    }

    // Configurar el transportador de Nodemailer con tus credenciales
    const transporter = nodemailer.createTransporter({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // true para el puerto 465
      auth: {
        user: process.env.HOSTINGER_EMAIL, // Variable de entorno para tu email
        pass: process.env.HOSTINGER_PASSWORD // Variable de entorno para tu contraseña
      }
    });

    // Contenido del email que recibirás
    const mailToOwner = {
      from: `"Formulario CostePro" <${process.env.HOSTINGER_EMAIL}>`,
      to: process.env.HOSTINGER_EMAIL, // El email se envía a ti mismo
      replyTo: email, // Permite responder directamente al usuario
      subject: `🔔 Nuevo mensaje de contacto de: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background-color: #264653; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Nuevo Mensaje desde tu Web</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 25px;">Mensaje:</h3>
            <p style="background-color: #f9f9f9; border-left: 4px solid #2a9d8f; padding: 15px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          <div style="text-align: center; font-size: 12px; color: #888; padding: 20px; border-top: 1px solid #eee;">
            <p>Enviado el ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>
      `
    };

    // Enviar el correo electrónico
    await transporter.sendMail(mailToOwner);
    console.log(`✅ Mensaje de contacto de ${email} enviado correctamente.`);

    // Respuesta de éxito para el frontend
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Mensaje enviado correctamente'
      })
    };

  } catch (error) {
    console.error('Error en la función contact-form:', error);

    // Respuesta de error para el frontend
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor al enviar el mensaje.'
      })
    };
  }
};

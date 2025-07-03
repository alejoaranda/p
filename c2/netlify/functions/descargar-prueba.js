// /functions/descargar-prueba.js
// Este es el "portero" que valida el token y la fecha de caducidad.

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// URL de descarga directa de tu archivo en Google Drive.
// He modificado tu enlace para forzar la descarga en lugar de la vista previa.
const GOOGLE_DRIVE_DIRECT_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1pwhZu0_7JvXkxvlVK9Rk1Kmj2WcNfMjk";
const EXPIRATION_HOURS = 12; // Horas de validez del enlace.

exports.handler = async (event ) => {
  // Obtiene el token de la URL (ej: ?token=XXXX).
  const token = event.queryStringParameters.token;

  if (!token) {
    return { statusCode: 400, body: "Error: El enlace no es válido o está incompleto." };
  }

  try {
    // 1. Conectar con Google Sheets.
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    } );
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // 2. Buscar la fila que coincide con el token.
    const targetRow = rows.find(row => row.get('TokenUnico') === token);

    if (!targetRow) {
      return { statusCode: 404, body: "Error: Enlace de descarga no válido o caducado." };
    }

    // 3. Verificar si el enlace ha caducado.
    const requestDate = new Date(targetRow.get('FechaDeSolicitud'));
    const expirationDate = new Date(requestDate.getTime() + EXPIRATION_HOURS * 60 * 60 * 1000);
    const now = new Date();

    if (now > expirationDate) {
      return { 
        statusCode: 403, 
        body: `Lo sentimos, este enlace de descarga ha caducado. Era válido durante ${EXPIRATION_HOURS} horas.` 
      };
    }

    // 4. ¡Éxito! Redirigir al usuario a la descarga real.
    return {
      statusCode: 302, // Código de redirección.
      headers: {
        'Location': GOOGLE_DRIVE_DIRECT_DOWNLOAD_URL
      }
    };

  } catch (error) {
    console.error("Error en la función de descarga:", error);
    return { statusCode: 500, body: "Ha ocurrido un error en el servidor." };
  }
};

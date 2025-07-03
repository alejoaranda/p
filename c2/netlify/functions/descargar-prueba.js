// /functions/descargar-prueba.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const GOOGLE_DRIVE_DIRECT_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1pwhZu0_7JvXkxvlVK9Rk1Kmj2WcNfMjk";
const EXPIRATION_HOURS = 12;

exports.handler = async (event) => {
  const token = event.queryStringParameters.token;

  if (!token) {
    return { statusCode: 400, body: "Error: El enlace no es válido o está incompleto." };
  }

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
        throw new Error('No se encontró la hoja "Prueba"');
    }
    
    const rows = await sheet.getRows();

    // Buscamos la fila que coincide con el token.
    const targetRow = rows.find(row => row.get('TokenUnico') === token);

    if (!targetRow) {
      return { statusCode: 404, body: "Error: Enlace de descarga no válido o ya utilizado." };
    }

    // --- CORRECCIÓN CLAVE ---
    // Leemos la fecha desde la columna 'Fecha de Solicitud' para que coincida
    // con lo que escribe la otra función.
    const requestDate = new Date(targetRow.get('Fecha de Solicitud'));
    const expirationDate = new Date(requestDate.getTime() + EXPIRATION_HOURS * 60 * 60 * 1000);
    const now = new Date();

    if (now > expirationDate) {
      return { 
        statusCode: 403, 
        body: `Lo sentimos, este enlace de descarga ha caducado. Era válido durante ${EXPIRATION_HOURS} horas.` 
      };
    }

    // ¡Éxito! Redirigir al usuario a la descarga.
    return {
      statusCode: 302,
      headers: {
        'Location': GOOGLE_DRIVE_DIRECT_DOWNLOAD_URL
      }
    };

  } catch (error) {
    console.error("Error en la función de descarga:", error);
    return { statusCode: 500, body: "Ha ocurrido un error en el servidor al validar el enlace." };
  }
};

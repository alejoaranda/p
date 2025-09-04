// /functions/descargar-prueba.js
// Versión FINAL - Coincide con tus columnas actuales

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const GOOGLE_DRIVE_DIRECT_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1pwhZu0_7JvXkxvlVK9Rk1Kmj2WcNfMjk";
const EXPIRATION_HOURS = 12;

exports.handler = async (event) => {
  // Headers para CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Validar que existe el parámetro token
  const token = event.queryStringParameters?.token;

  if (!token) {
    console.log('❌ No se proporcionó token');
    return { 
      statusCode: 400, 
      headers,
      body: JSON.stringify({ 
        error: "Error: El enlace no es válido o está incompleto." 
      })
    };
  }

  console.log(`🔍 Validando token: ${token.substring(0, 10)}...`);

  try {
    // Validar y procesar la clave privada
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawKey) {
      console.error('❌ La variable GOOGLE_PRIVATE_KEY no está configurada.');
      throw new Error('La clave privada de Google no está configurada.');
    }

    let privateKey = rawKey.replace(/\\n/g, '\n');
    
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Formato de clave privada incorrecto');
      throw new Error('Formato de clave privada de Google incorrecto.');
    }

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_SHEET_ID) {
      console.error('❌ Faltan variables de entorno de Google');
      throw new Error('Configuración de Google incompleta');
    }

    // Configurar autenticación
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('📊 Conectando a Google Sheets...');
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Prueba']; 
    if (!sheet) {
      console.error('❌ No se encontró la hoja "Prueba"');
      throw new Error('No se encontró la hoja "Prueba" en el documento');
    }
    
    console.log('📋 Obteniendo filas de la hoja...');
    const rows = await sheet.getRows();
    console.log(`✅ Se encontraron ${rows.length} filas en total`);

    // Buscar la fila que coincide con el token
    // IMPORTANTE: Ahora buscamos en la columna "TokenUnico"
    const targetRow = rows.find(row => {
      const rowToken = row.get('TokenUnico');
      return rowToken === token;
    });

    if (!targetRow) {
      console.log(`❌ Token no encontrado: ${token.substring(0, 20)}...`);
      return { 
        statusCode: 404, 
        headers,
        body: JSON.stringify({ 
          error: "Error: Enlace de descarga no válido o ya utilizado." 
        })
      };
    }

    console.log('✅ Token válido encontrado, verificando expiración...');

    // IMPORTANTE: Usar "FechadeSolicitud" sin espacios
    const dateString = targetRow.get('FechadeSolicitud');
    
    if (!dateString) {
      console.error('❌ No se encontró fecha de solicitud para el token');
      throw new Error('Fecha de solicitud no encontrada');
    }

    const requestDate = new Date(dateString);
    
    // Verificar que la fecha sea válida
    if (isNaN(requestDate.getTime())) {
      console.error(`❌ Fecha inválida: ${dateString}`);
      throw new Error('Fecha de solicitud inválida');
    }

    const expirationDate = new Date(requestDate.getTime() + EXPIRATION_HOURS * 60 * 60 * 1000);
    const now = new Date();

    console.log('📅 Fechas:');
    console.log('  - Solicitud:', requestDate.toISOString());
    console.log('  - Expiración:', expirationDate.toISOString());
    console.log('  - Actual:', now.toISOString());

    if (now > expirationDate) {
      const hoursElapsed = Math.floor((now - requestDate) / (1000 * 60 * 60));
      console.log(`❌ Token expirado. Han pasado ${hoursElapsed} horas`);
      return { 
        statusCode: 403, 
        headers,
        body: JSON.stringify({ 
          error: `Lo sentimos, este enlace ha caducado. Era válido durante ${EXPIRATION_HOURS} horas y han pasado ${hoursElapsed} horas desde su creación.` 
        })
      };
    }

    // Opcional: Marcar el token como usado
    try {
      targetRow.set('UltimoAcceso', new Date().toISOString());
      const accessCount = parseInt(targetRow.get('ContadorAccesos') || '0') + 1;
      targetRow.set('ContadorAccesos', accessCount.toString());
      await targetRow.save();
      console.log('✅ Registro de acceso actualizado');
    } catch (updateError) {
      console.error('⚠️ Error al actualizar registro de acceso:', updateError.message);
      // No fallar si no se puede actualizar
    }

    console.log('🎉 ¡Token válido y no expirado! Redirigiendo a la descarga...');

    // ¡Éxito! Redirigir al usuario a la descarga
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': GOOGLE_DRIVE_DIRECT_DOWNLOAD_URL,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    };

  } catch (error) {
    console.error("❌ Error detallado en la función de descarga:", error);
    console.error("Stack trace:", error.stack);
    
    let errorMessage = "Ha ocurrido un error en el servidor al validar el enlace.";
    
    if (error.message.includes('Google')) {
      errorMessage = "Error de configuración del servidor. Por favor, contacta al administrador.";
    } else if (error.message.includes('hoja')) {
      errorMessage = "Error al acceder a la base de datos. Por favor, intenta más tarde.";
    }
    
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message
      })
    };
  }
};

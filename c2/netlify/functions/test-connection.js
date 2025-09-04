// /functions/test-connection.js
// Función de diagnóstico para verificar la conexión

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: []
  };

  try {
    // 1. Verificar variables de entorno
    diagnostics.checks.envVars = {
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      HOSTINGER_EMAIL: !!process.env.HOSTINGER_EMAIL,
      HOSTINGER_PASSWORD: !!process.env.HOSTINGER_PASSWORD
    };

    // Mostrar parcialmente los valores para debug
    diagnostics.checks.partialValues = {
      EMAIL: process.env.GOOGLE_CLIENT_EMAIL ? process.env.GOOGLE_CLIENT_EMAIL.substring(0, 10) + '...' : 'NOT SET',
      SHEET_ID: process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID.substring(0, 10) + '...' : 'NOT SET',
      PRIVATE_KEY_START: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0, 50) + '...' : 'NOT SET'
    };

    // 2. Verificar formato de clave privada
    if (process.env.GOOGLE_PRIVATE_KEY) {
      const key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
      diagnostics.checks.privateKeyFormat = {
        hasBeginHeader: key.includes('-----BEGIN PRIVATE KEY-----'),
        hasEndHeader: key.includes('-----END PRIVATE KEY-----'),
        approximateLength: key.length
      };
    }

    // 3. Intentar conectar a Google Sheets
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID) {
      try {
        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        const serviceAccountAuth = new JWT({
          email: process.env.GOOGLE_CLIENT_EMAIL,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        diagnostics.checks.authCreated = true;

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        diagnostics.checks.sheetConnection = {
          connected: true,
          title: doc.title,
          sheetCount: doc.sheetCount,
          sheets: doc.sheetsByIndex.map(s => ({
            title: s.title,
            index: s.index,
            rowCount: s.rowCount,
            columnCount: s.columnCount
          }))
        };

        // Buscar hoja "Prueba"
        const sheet = doc.sheetsByTitle['Prueba'];
        if (sheet) {
          diagnostics.checks.pruebaSheet = {
            found: true,
            title: sheet.title,
            rowCount: sheet.rowCount,
            columnCount: sheet.columnCount
          };

          // Intentar leer headers
          try {
            await sheet.loadHeaderRow();
            diagnostics.checks.headers = sheet.headerValues;
          } catch (headerError) {
            diagnostics.errors.push({
              step: 'loadHeaders',
              message: headerError.message
            });
          }

          // Intentar leer filas
          try {
            const rows = await sheet.getRows();
            diagnostics.checks.rowData = {
              totalRows: rows.length,
              firstRowData: rows.length > 0 ? {
                email: rows[0].get('Email'),
                fecha: rows[0].get('Fecha de Solicitud'),
                fingerprint: rows[0].get('Fingerprint'),
                expiracion: rows[0].get('Fecha de expiración')
              } : 'No rows found'
            };
          } catch (rowError) {
            diagnostics.errors.push({
              step: 'readRows',
              message: rowError.message
            });
          }
        } else {
          diagnostics.checks.pruebaSheet = {
            found: false,
            availableSheets: Object.keys(doc.sheetsByTitle)
          };
        }

      } catch (connectionError) {
        diagnostics.errors.push({
          step: 'googleConnection',
          message: connectionError.message,
          stack: connectionError.stack
        });
      }
    } else {
      diagnostics.checks.sheetConnection = {
        connected: false,
        reason: 'Missing required environment variables'
      };
    }

    // 4. Test de escritura (si todo está bien hasta aquí)
    if (diagnostics.checks.pruebaSheet?.found && event.queryStringParameters?.testWrite === 'true') {
      try {
        const sheet = doc.sheetsByTitle['Prueba'];
        const testToken = 'TEST_' + Date.now();
        await sheet.addRow({
          'Email': 'test@example.com',
          'Fecha de Solicitud': new Date().toISOString(),
          'Fingerprint': 'TEST',
          'Fecha de expiración': testToken
        });
        diagnostics.checks.writeTest = {
          success: true,
          token: testToken
        };
      } catch (writeError) {
        diagnostics.errors.push({
          step: 'writeTest',
          message: writeError.message
        });
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(diagnostics, null, 2)
    };

  } catch (error) {
    diagnostics.errors.push({
      step: 'general',
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(diagnostics, null, 2)
    };
  }
};

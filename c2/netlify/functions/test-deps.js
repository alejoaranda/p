// /netlify/functions/test-deps.js
// Verificar qué módulos están disponibles

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const results = {
    currentDir: __dirname,
    nodeVersion: process.version,
    platform: process.platform,
    modules: {},
    requires: {},
    paths: module.paths
  };

  // Intentar cargar cada módulo
  const modulesToTest = [
    'nodemailer',
    'google-spreadsheet', 
    'google-auth-library',
    'crypto'
  ];

  for (const mod of modulesToTest) {
    try {
      if (mod === 'crypto') {
        // crypto es built-in
        results.modules[mod] = 'built-in';
        require(mod);
        results.requires[mod] = 'success';
      } else {
        const loaded = require(mod);
        results.modules[mod] = 'found';
        results.requires[mod] = typeof loaded;
        
        // Para nodemailer, verificar específicamente
        if (mod === 'nodemailer' && loaded.createTransporter) {
          results.requires[mod] = 'createTransporter exists';
        }
      }
    } catch (error) {
      results.modules[mod] = 'not found';
      results.requires[mod] = error.message;
    }
  }

  // Verificar estructura de archivos
  const fs = require('fs');
  const path = require('path');
  
  try {
    const dir = path.dirname(__dirname);
    results.parentDir = dir;
    results.files = fs.readdirSync(__dirname).slice(0, 20);
    
    // Buscar package.json
    const possiblePaths = [
      path.join(__dirname, 'package.json'),
      path.join(dir, 'package.json'),
      path.join(dir, 'netlify', 'functions', 'package.json'),
      '/var/task/package.json',
      '/var/task/netlify/functions/package.json'
    ];
    
    results.packageJsonSearch = {};
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          const pkg = JSON.parse(content);
          results.packageJsonSearch[p] = {
            exists: true,
            dependencies: pkg.dependencies || {}
          };
        } else {
          results.packageJsonSearch[p] = { exists: false };
        }
      } catch (e) {
        results.packageJsonSearch[p] = { error: e.message };
      }
    }
    
  } catch (error) {
    results.fileError = error.message;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(results, null, 2)
  };
};

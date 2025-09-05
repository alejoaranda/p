<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CostePro - Prueba Gratuita</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            display: none;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .info {
            background: #cff4fc;
            color: #055160;
            border: 1px solid #b6effb;
            margin-bottom: 20px;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>CostePro</h1>
        <p class="subtitle">Solicita tu prueba gratuita de 3 días</p>
        
        <div class="info message" style="display: block;">
            📧 Recibirás un enlace de descarga en tu email que será válido por 12 horas
        </div>
        
        <form id="trialForm">
            <!-- Clave de Web3Forms -->
            <input type="hidden" name="access_key" value="d2d0b856-106e-4aef-80be-7e66206f4c13">
            
            <!-- Campos ocultos para personalizar el email -->
            <input type="hidden" name="subject" value="Nueva solicitud de prueba CostePro">
            <input type="hidden" name="from_name" value="CostePro Web">
            
            <div class="form-group">
                <label for="email">Tu correo electrónico:</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="ejemplo@gmail.com"
                >
            </div>
            
            <!-- Campo oculto con el mensaje personalizado -->
            <input type="hidden" name="message" id="messageField">
            
            <button type="submit" id="submitBtn">
                Solicitar Prueba Gratuita
            </button>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p style="margin-top: 10px;">Procesando tu solicitud...</p>
        </div>
        
        <div id="successMsg" class="message success">
            ✅ ¡Listo! Revisa tu bandeja de entrada. Te hemos enviado las instrucciones de descarga.
        </div>
        
        <div id="errorMsg" class="message error">
            ❌ Hubo un error. Por favor, intenta nuevamente o escribe a contacto@costepro.top
        </div>
    </div>

    <script>
        // Generar un ID único para cada solicitud
        function generateUniqueId() {
            return 'ID_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        document.getElementById('trialForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const form = e.target;
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const email = document.getElementById('email').value;
            const uniqueId = generateUniqueId();
            
            // Ocultar mensajes anteriores
            document.getElementById('successMsg').style.display = 'none';
            document.getElementById('errorMsg').style.display = 'none';
            
            // Mostrar loading
            submitBtn.disabled = true;
            loading.style.display = 'block';
            
            // Crear el mensaje personalizado con el enlace
            const downloadLink = 'https://drive.google.com/uc?export=download&id=1pwhZu0_7JvXkxvlVK9Rk1Kmj2WcNfMjk';
            const message = `
                Nueva solicitud de prueba:
                
                Email: ${email}
                ID de solicitud: ${uniqueId}
                Fecha y hora: ${new Date().toLocaleString('es-ES')}
                
                Enlace de descarga para enviar al usuario:
                ${downloadLink}
                
                IMPORTANTE: Este enlace es temporal y expira en 12 horas.
                
                Instrucciones para el usuario:
                1. Descarga el archivo desde el enlace
                2. Descomprime el archivo ZIP
                3. Ejecuta CostePro.exe
                4. La prueba gratuita dura 3 días desde la primera ejecución
            `;
            
            document.getElementById('messageField').value = message;
            
            // Preparar los datos del formulario
            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);
            
            try {
                // Enviar a Web3Forms
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: json
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Mostrar mensaje de éxito
                    document.getElementById('successMsg').style.display = 'block';
                    form.reset();
                    
                    // Guardar en localStorage para referencia
                    const requests = JSON.parse(localStorage.getItem('costepro_requests') || '[]');
                    requests.push({
                        email: email,
                        id: uniqueId,
                        timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('costepro_requests', JSON.stringify(requests));
                } else {
                    throw new Error('Error en el envío');
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('errorMsg').style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>

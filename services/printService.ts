import { Recipe, Settings, Ingredient, Employee, Shift, FullSchedule, ServiceReportData, AppccRecord } from '../types';
import { getCurrencySymbol } from './currencyService';

type Theme = 'light' | 'dark' | 'oceanic' | 'vintage';

const ALL_ALLERGENS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacauetes', 'Soja', 'Lácteos', 
  'Frutos de cáscara', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
];

export const generateAllEscandallosHtml = (recipesToPrint: Recipe[], allIngredients: Ingredient[], settings: Settings): string => {
    const currencySymbol = getCurrencySymbol(settings.currency);
    const bodyContent = recipesToPrint.map((recipe, index) => {
        const getIngredientDetails = (id: string) => allIngredients.find(ing => ing.id === id || ing.name.toLowerCase() === id.toLowerCase());

        const ingredientsWithDetails = recipe.ingredients.map(recipeIng => {
            const details = getIngredientDetails(recipeIng.ingredientId);
            const netQuantityG = recipeIng.quantity;
            const wastePercentage = recipeIng.wastePercentage;
            const wasteFactor = 1 - (wastePercentage / 100);
            const grossQuantityG = wasteFactor > 0 ? netQuantityG / wasteFactor : 0;
            const pricePerUnit = details?.price || 0;
            const cost = (grossQuantityG / 1000) * pricePerUnit;
            return { name: details?.name || recipeIng.ingredientId, netQuantityG, wastePercentage, grossQuantityG, pricePerUnit, unit: details?.unit || 'kg', cost };
        });

        const totalCost = ingredientsWithDetails.reduce((acc, ing) => acc + ing.cost, 0);
        const costPerServing = totalCost > 0 && recipe.servings > 0 ? totalCost / recipe.servings : 0;
        const taxRate = recipe.taxRate || 0;
        const taxDivisor = 1 + (taxRate / 100);
        const pvp = recipe.pvp || 0;
        const pvpSinTax = taxDivisor !== 0 ? pvp / taxDivisor : pvp;
        const netBenefitPerServing = pvpSinTax - costPerServing;
        const foodCostPercentage = pvpSinTax > 0 ? (costPerServing / pvpSinTax) * 100 : 0;
        const coefficient = recipe.coefficient || settings.defaultCoefficient || 3;
        const pvpRecomendadoSinTax = costPerServing * coefficient;
        const pvpRecomendadoConTax = pvpRecomendadoSinTax * taxDivisor;
        
        const ingredientsTableRows = ingredientsWithDetails.map(ing => `
            <tr class="border-b border-gray-300 odd:bg-white even:bg-gray-50">
                <td class="p-1.5 text-left font-medium">${ing.name}</td>
                <td class="p-1.5">${ing.netQuantityG.toFixed(0)} g</td>
                <td class="p-1.5">${ing.wastePercentage}%</td>
                <td class="p-1.5">${ing.grossQuantityG.toFixed(0)} g</td>
                <td class="p-1.5">${ing.pricePerUnit.toFixed(2)} ${currencySymbol}/${ing.unit}</td>
                <td class="p-1.5 font-semibold">${ing.cost.toFixed(2)} ${currencySymbol}</td>
            </tr>
        `).join('');
        
        const fichaIngredientsRows = ingredientsWithDetails.map(ing => `
            <tr class="border-b border-gray-200">
                <td class="py-0.5 font-medium">${ing.name}</td>
                <td class="py-0.5 text-right">${ing.netQuantityG.toFixed(0)} g</td>
            </tr>
        `).join('');

        const preparationStepsList = recipe.preparationSteps.map(step => `<li>${step}</li>`).join('');

        const allergensGrid = ALL_ALLERGENS.map(allergen => {
            const isActive = recipe.allergens.includes(allergen);
            return `<div class="p-2 border rounded ${isActive ? 'bg-yellow-400 border-yellow-600 font-bold' : 'bg-gray-100 border-gray-300'}">${allergen}</div>`;
        }).join('');

        return `
            <div class="${index > 0 ? 'print-break-before' : ''}">
                <div class="p-8 w-[210mm] h-[297mm] flex flex-col">
                    <header class="flex justify-between items-start pb-2 border-b-4 border-primary">
                        <div class="flex items-center space-x-4">
                            ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="h-16 w-auto max-w-[150px] object-contain" />` : ''}
                            <h2 class="text-xl font-bold text-gray-600">${settings.restaurantName}</h2>
                        </div>
                        <h2 class="text-xl font-bold text-primary text-right">ESCANDALLO DE COSTES</h2>
                    </header>
                    <section class="flex my-6">
                        <div class="w-2/3 pr-4">
                            <h1 class="text-4xl font-extrabold text-gray-800 uppercase tracking-tight">${recipe.name}</h1>
                            <p class="text-lg text-gray-500 font-medium">${recipe.category}</p>
                            <p class="text-sm text-gray-500 mt-2">Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}</p>
                        </div>
                        <div class="w-1/3 h-32 bg-gray-200 border-2 border-gray-300 flex-shrink-0">
                            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="w-full h-full object-cover"/>` : ''}
                        </div>
                    </section>
                    <section class="grid grid-cols-4 gap-x-4 mb-6 text-sm">
                        <div class="bg-gray-100 p-2 rounded text-center"><div class="font-bold text-gray-500 text-xs">COSTE POR RACIÓN</div><div class="text-xl font-bold text-primary">${costPerServing.toFixed(2)} ${currencySymbol}</div></div>
                        <div class="bg-gray-100 p-2 rounded text-center"><div class="font-bold text-gray-500 text-xs">PVP SIN IMPUESTOS</div><div class="text-xl font-bold text-gray-800">${pvpSinTax.toFixed(2)} ${currencySymbol}</div></div>
                        <div class="bg-gray-100 p-2 rounded text-center"><div class="font-bold text-gray-500 text-xs">FOOD COST / RATIO</div><div class="text-xl font-bold text-gray-800">${foodCostPercentage.toFixed(1)}%</div></div>
                        <div class="bg-gray-100 p-2 rounded text-center"><div class="font-bold text-gray-500 text-xs">BENEFICIO NETO</div><div class="text-xl font-bold ${netBenefitPerServing >= 0 ? 'text-green-600' : 'text-red-600'}">${netBenefitPerServing.toFixed(2)} ${currencySymbol}</div></div>
                    </section>
                    <h3 class="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2 mt-4">Desglose de Ingredientes</h3>
                    <table class="w-full border-collapse text-center"><thead class="bg-gray-800 text-white font-bold text-xs"><tr><th class="p-2 text-left w-1/3">INGREDIENTE</th><th class="p-2">CANT. NETA</th><th class="p-2">MERMA</th><th class="p-2">CANT. BRUTA</th><th class="p-2">PRECIO/UNIDAD</th><th class="p-2">COSTE</th></tr></thead><tbody>${ingredientsTableRows}</tbody><tfoot><tr class="bg-gray-200 font-extrabold text-base"><td colspan="5" class="text-right p-2">COSTE TOTAL MATERIA PRIMA</td><td class="p-2">${totalCost.toFixed(2)} ${currencySymbol}</td></tr><tr class="bg-gray-200 font-extrabold text-base"><td colspan="5" class="text-right p-2">COSTE POR RACIÓN (${recipe.servings} raciones)</td><td class="p-2">${costPerServing.toFixed(2)} ${currencySymbol}</td></tr></tfoot></table>
                    <section class="mt-4 border-t-2 border-gray-300 pt-2 text-xs"><div class="font-bold">PVP Recomendado (Coeficiente: ${coefficient.toFixed(1)}x): <span class="text-primary">${pvpRecomendadoConTax.toFixed(2)} ${currencySymbol}</span></div></section>
                    <footer class="text-center text-xs text-gray-500 border-t pt-2 mt-auto">Documento generado por CostePro &copy; ${new Date().getFullYear()}</footer>
                </div>
            </div>
            <div class="print-break-before p-8 w-[210mm] h-[297mm] flex flex-col">
                <header class="flex justify-between items-start pb-2 border-b-4 border-primary"><div class="flex items-center space-x-4">${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" class="h-16 w-auto max-w-[150px] object-contain" />` : ''}<h2 class="text-xl font-bold text-gray-600">${settings.restaurantName}</h2></div><h2 class="text-xl font-bold text-primary text-right">FICHA TÉCNICA DE PRODUCCIÓN</h2></header>
                <section class="flex my-6"><div class="w-2/3 pr-4"><h1 class="text-4xl font-extrabold text-gray-800 uppercase tracking-tight">${recipe.name}</h1><p class="text-lg text-gray-500 font-medium">${recipe.category}</p></div><div class="w-1/3 h-32 bg-gray-200 border-2 border-gray-300 flex-shrink-0">${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="w-full h-full object-cover"/>` : ''}</div></section>
                <div class="grid grid-cols-4 gap-4 mb-6 text-center"><div class="bg-gray-100 p-2 rounded"><div class="font-bold text-gray-500 text-xs">T. PREPARACIÓN</div><div class="text-lg font-bold">${recipe.prepTime} min</div></div><div class="bg-gray-100 p-2 rounded"><div class="font-bold text-gray-500 text-xs">T. COCCIÓN</div><div class="text-lg font-bold">${recipe.cookTime} min</div></div><div class="bg-gray-100 p-2 rounded"><div class="font-bold text-gray-500 text-xs">Nº RACIONES</div><div class="text-lg font-bold">${recipe.servings}</div></div><div class="bg-gray-100 p-2 rounded"><div class="font-bold text-gray-500 text-xs">PESO PORCIÓN</div><div class="text-lg font-bold">${recipe.portionSize || 0} g</div></div></div>
                <div class="grid grid-cols-5 gap-6 flex-grow">
                    <div class="col-span-2 flex flex-col">
                        <h3 class="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2">Ingredientes</h3>
                        <div class="overflow-hidden">
                            <table class="w-full text-left text-xs leading-snug"><tbody>${fichaIngredientsRows}</tbody></table>
                        </div>
                    </div>
                    <div class="col-span-3 flex flex-col">
                        <h3 class="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2">Preparación</h3>
                        <ol class="list-decimal list-inside text-xs leading-snug overflow-hidden">${preparationStepsList}</ol>
                    </div>
                </div>
                <div class="mt-6"><h3 class="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2">Información de Alérgenos</h3><div class="grid grid-cols-7 gap-1 text-center text-xs">${allergensGrid}</div></div>
                <footer class="text-center text-xs text-gray-500 border-t pt-2 mt-auto">Documento generado por CostePro &copy; ${new Date().getFullYear()}</footer>
            </div>
        `;
    }).join('');

    const tailwindCdn = '<script src="https://cdn.tailwindcss.com"><\/script>';
    const tailwindConfig = `<script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'primary': '#f97316',
            },
          },
        },
      }
    <\/script>`;
    const printStyles = `
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4; margin: 0; }
            .print-break-before { page-break-before: always; }
          }
        </style>
    `;
    
    return `
      <html>
        <head>
          <title>Escandallos y Fichas Técnicas - ${settings.restaurantName}</title>
          ${tailwindCdn}
          ${tailwindConfig}
          ${printStyles}
        </head>
        <body class="bg-white text-gray-900 text-xs font-sans">
          ${bodyContent}
          <script type="text/javascript">
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          <\/script>
        </body>
      </html>
    `;
};

export const generateServiceReportHtml = (reportData: ServiceReportData[], settings: Settings): string => {
    const bodyContent = reportData.map((dish, index) => `
        <div class="dish-card ${index > 0 ? 'print-break-before' : ''}">
            <div class="dish-header">
                <h2 class="dish-name">${dish.dishName}</h2>
                ${dish.imageUrl ? `<img src="${dish.imageUrl}" alt="${dish.dishName}" class="dish-image"/>` : '<div class="dish-image-placeholder">Sin Imagen</div>'}
            </div>
            <div class="dish-body">
                <div class="section key-points">
                    <h3 class="section-title">Puntos Clave y FAQs</h3>
                    ${dish.keyPoints.map(point => `
                        <div class="key-point">
                            <h4 class="key-point-title">${point.title}</h4>
                            <p class="key-point-content">${point.content.replace(/\n/g, '<br>')}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="section ingredients">
                    <h3 class="section-title">Ingredientes Principales</h3>
                    <ul>
                        ${dish.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
                <div class="section allergen-management">
                    <h3 class="section-title">Gestión de Alérgenos</h3>
                    <table class="allergen-table">
                        <thead>
                            <tr>
                                <th>Alérgeno</th>
                                <th>Estado</th>
                                <th>Justificación y Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dish.allergenManagement.map(allergen => `
                                <tr>
                                    <td>${allergen.allergenName}</td>
                                    <td>${allergen.status}</td>
                                    <td>${allergen.justification}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `).join('');

    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
            @page { size: A4; margin: 1.5cm; }
            body { 
                font-family: 'Roboto', sans-serif; 
                font-size: 10pt; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                color: #333;
            }
            .print-container { width: 100%; }
            .main-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 0.5rem; margin-bottom: 1rem; }
            .restaurant-info { display: flex; align-items: center; gap: 1rem; }
            .main-header h1 { font-size: 16pt; margin: 0; }
            .main-header h2 { font-size: 12pt; font-weight: normal; margin: 0; color: #555; }
            .main-header img { max-height: 50px; max-width: 150px; object-fit: contain; }
            .print-break-before { page-break-before: always; }

            .dish-card {
                border: 1px solid #ccc;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 1.5rem;
                page-break-inside: avoid;
            }
            .dish-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: #f2f2f2;
                padding: 0.75rem;
                border-bottom: 1px solid #ccc;
            }
            .dish-name {
                font-size: 1.5rem;
                font-weight: bold;
                margin: 0;
            }
            .dish-image, .dish-image-placeholder {
                width: 120px;
                height: 80px;
                object-fit: cover;
                border-radius: 4px;
                background-color: #e0e0e0;
                border: 1px solid #ccc;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                color: #777;
            }
            .dish-body {
                padding: 0.75rem;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            .section {
                grid-column: span 2;
            }
            .key-points { grid-column: span 1; }
            .ingredients { grid-column: span 1; }
            .section-title {
                font-size: 1.1rem;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
                padding-bottom: 0.25rem;
                margin-top: 0;
                margin-bottom: 0.5rem;
            }
            .key-point { margin-bottom: 0.5rem; }
            .key-point-title { font-weight: bold; margin-bottom: 0.1rem; }
            .key-point-content { margin: 0; white-space: pre-wrap; }
            .ingredients ul {
                list-style-position: inside;
                padding-left: 0;
                margin: 0;
            }
            .allergen-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }
            .allergen-table th, .allergen-table td {
                border: 1px solid #ddd;
                padding: 0.4rem;
                text-align: left;
                vertical-align: top;
            }
            .allergen-table th { background-color: #f9f9f9; font-weight: bold; }
            .allergen-table td:nth-child(1) { width: 20%; font-weight: bold; }
            .allergen-table td:nth-child(2) { width: 20%; }
            .allergen-table td:nth-child(3) { width: 60%; }

            .footer { text-align: center; font-size: 8pt; color: #888; margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 0.5rem; }
        </style>
    `;

    return `
      <html>
        <head>
          <title>Informe para Servicio - ${settings.restaurantName}</title>
          ${styles}
        </head>
        <body class="bg-white text-gray-900 text-xs font-sans">
            <div class="print-container">
                <header class="main-header">
                    <div class="restaurant-info">
                        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo">` : ''}
                        <h1>${settings.restaurantName}</h1>
                    </div>
                    <h2>Informe para Servicio</h2>
                </header>
                <main>
                    ${bodyContent}
                </main>
                <footer class="footer">
                    Documento generado por CostePro &copy; ${new Date().getFullYear()}
                </footer>
            </div>
          <script type="text/javascript">
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          <\/script>
        </body>
      </html>
    `;
};

export const generateMenuHtml = (
    menuRecipes: { [category: string]: Recipe[] },
    settings: Settings,
    theme: Theme,
    title?: string,
    menuPrice?: number
): string => {
    const allergenSymbols: { [key: string]: string } = {
        'Gluten': 'G', 'Crustáceos': 'Cr', 'Huevos': 'H', 'Pescado': 'P', 'Cacauetes': 'C', 'Soja': 'S', 'Lácteos': 'L',
        'Frutos de cáscara': 'Fc', 'Apio': 'A', 'Mostaza': 'M', 'Sésamo': 'Se', 'Sulfitos': 'Su', 'Altramuces': 'Al', 'Moluscos': 'Mo'
    };
    
    const themes = {
        light: { bg: '#F8F5F2', text: '#2C2C2C', title: '#1A1A1A', accent: '#C0A062', subtle: '#666666', dots: '#B0B0B0', border: '#EAEAEA', tagBg: '#EAEAEA', tagText: '#555', tagBorder: '#D0D0D0', logoFilter: 'none' },
        dark: { bg: '#222222', text: '#EAEAEA', title: '#FFFFFF', accent: '#D4AF37', subtle: '#AAAAAA', dots: '#666666', border: '#333333', tagBg: '#333333', tagText: '#EAEAEA', tagBorder: '#555555', logoFilter: 'invert(0.9) saturate(0.5) hue-rotate(180deg)' },
        oceanic: { bg: '#0A2647', text: '#E0F7FA', title: '#FFFFFF', accent: '#20B2AA', subtle: '#ADD8E6', dots: '#144272', border: '#144272', tagBg: '#144272', tagText: '#E0F7FA', tagBorder: '#20B2AA', logoFilter: 'invert(0.9) saturate(0.5) hue-rotate(180deg)' },
        vintage: { bg: '#FDF6E3', text: '#583E23', title: '#3D2B1F', accent: '#9A3412', subtle: '#8C7853', dots: '#B4A082', border: '#EAE0C8', tagBg: '#EAE0C8', tagText: '#583E23', tagBorder: '#DCD0B3', logoFilter: 'none' }
    };

    const colors = themes[theme];
    
    let bodyContent = '';
    const currencySymbol = getCurrencySymbol(settings.currency);

    if (menuPrice && menuPrice > 0) {
        bodyContent += `
            <div class="menu-price-box">
                <p class="menu-price-label">Precio del Menú</p>
                <p class="menu-price-value">${menuPrice.toFixed(2)}${currencySymbol}</p>
            </div>
        `;
    }

    for (const category in menuRecipes) {
        if (menuRecipes[category].length > 0) {
            bodyContent += `<h2 class="category-title"><span>${category}</span></h2>`;
            bodyContent += `<div class="category-items">`;
            menuRecipes[category].forEach(recipe => {
                const allergensHtml = (recipe.allergens || [])
                    .map(allergen => `<span class="allergen-tag" title="${allergen}">${allergenSymbols[allergen] || '?'}</span>`)
                    .join(' ');

                const priceHtml = (!menuPrice || menuPrice <= 0)
                    ? `<p class="item-price">${(recipe.pvp || 0).toFixed(2)}${currencySymbol}</p>`
                    : '';
                const dotsHtml = (!menuPrice || menuPrice <= 0) ? '<div class="item-dots"></div>' : '';

                bodyContent += `
                  <div class="menu-item">
                    <div class="item-header">
                      <h3 class="item-name">${recipe.name}</h3>
                      ${dotsHtml}
                      ${priceHtml}
                    </div>
                    <p class="item-description">${recipe.description || ''}</p>
                    <div class="item-allergens">${allergensHtml}</div>
                  </div>
                `;
            });
            bodyContent += `</div>`;
        }
    }

    const allergenLegend = Object.entries(allergenSymbols).map(([name, symbol]) => `<span><b>${symbol}</b>: ${name}</span>`).join('');
    const headerTitle = title || settings.restaurantName;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Carta - ${settings.restaurantName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;700&display=swap');
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Lato', sans-serif; background-color: ${colors.bg}; color: ${colors.text}; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: 300; }
          .menu-container { width: 100%; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 2rem; border-bottom: 1px solid ${colors.accent}; padding-bottom: 1rem; }
          .header img { max-height: 80px; margin-bottom: 0.5rem; filter: ${colors.logoFilter}; }
          .header h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0; color: ${colors.title}; }
          .menu-price-box { text-align: center; margin: 2rem 0; padding: 1rem; border: 2px solid ${colors.accent}; }
          .menu-price-label { font-family: 'Lato', sans-serif; font-size: 1.2rem; margin: 0; color: ${colors.text}; }
          .menu-price-value { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; margin: 0.5rem 0 0 0; color: ${colors.accent}; }
          .category-title { display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 1.8rem; text-align: center; margin: 3rem 0 1.5rem 0; color: ${colors.accent}; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; }
          .category-items { display: block; }
          .menu-item { margin-bottom: 1.5rem; page-break-inside: avoid; }
          .item-header { display: flex; align-items: baseline; }
          .item-name { font-family: 'Lato', sans-serif; font-size: 1.1rem; font-weight: 700; margin: 0; color: ${colors.text}; }
          .item-dots { flex-grow: 1; border-bottom: 1px dotted ${colors.dots}; margin: 0 0.5rem; transform: translateY(-4px); }
          .item-price { font-family: 'Lato', sans-serif; font-size: 1.1rem; font-weight: 700; margin: 0; color: ${colors.text}; }
          .item-description { font-size: 0.9rem; font-style: normal; color: ${colors.subtle}; margin: 0.2rem 0 0.3rem 0; padding-left: 0.5rem; max-width: 90%; font-weight: 300; }
          .item-allergens { display: flex; gap: 0.4rem; margin-top: 0.5rem; }
          .allergen-tag { font-family: 'Lato', sans-serif; font-size: 0.7rem; font-weight: 700; color: ${colors.tagText}; background-color: ${colors.tagBg}; border: 1px solid ${colors.tagBorder}; border-radius: 50%; width: 1.6rem; height: 1.6rem; display: inline-flex; align-items: center; justify-content: center; }
          .footer { text-align: center; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid ${colors.border}; font-size: 0.8rem; color: ${colors.subtle}; }
          .allergen-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1rem; font-size: 0.7rem; color: ${colors.subtle}; }
        </style>
      </head>
      <body>
        <div class="menu-container">
          <header class="header">
            ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo">` : ''}
            <h1>${headerTitle}</h1>
          </header>
          <main>${bodyContent}</main>
          <footer class="footer">
            <h3 style="font-family: 'Playfair Display', serif; color: ${colors.text};">Alérgenos</h3>
            <div class="allergen-legend">${allergenLegend}</div>
            <p>${settings.city}, ${settings.country}</p>
            <p>IVA Incluido</p>
          </footer>
        </div>
      </body>
      </html>
    `;
};

const getSchedulePrintStyles = (): string => `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        @page { size: A4 landscape; margin: 1cm; }
        body { 
            font-family: 'Roboto', sans-serif; 
            font-size: 8pt; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color: #333;
        }
        .print-container { width: 100%; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .restaurant-info { display: flex; align-items: center; gap: 1rem; }
        .header h1 { font-size: 16pt; margin: 0; }
        .header img { max-height: 50px; max-width: 150px; object-fit: contain; }
        .schedule-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .schedule-table th, .schedule-table td { border: 1px solid #ccc; text-align: center; padding: 4px; height: 30px; }
        .schedule-table th { background-color: #f2f2f2; font-weight: bold; }
        .employee-name { text-align: left; font-weight: bold; width: 150px; }
        .day-header { min-width: 35px; }
        .day-header.weekend { color: #f97316; }
        .shift-cell { font-weight: bold; }
        .legend-container { margin-top: 1.5rem; display: flex; justify-content: space-between; gap: 2rem; page-break-inside: avoid; }
        .legend { width: 50%; }
        .legend h2 { font-size: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
        .legend-item { display: flex; align-items: center; margin-bottom: 4px; }
        .legend-key { font-weight: bold; width: 35px; text-align: center; padding: 2px; margin-right: 8px; border-radius: 4px; border: 1px solid #555; }
        .legend-desc { flex-grow: 1; }
        .footer { text-align: center; font-size: 7pt; color: #888; margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 0.5rem; }
    </style>
`;

const generateScheduleTableHtml = (
    title: string,
    days: Date[],
    employees: Employee[],
    schedule: FullSchedule,
    shifts: Shift[],
    settings: Settings
): string => {
    const shiftsById = shifts.reduce((acc, shift) => ({ ...acc, [shift.id]: shift }), {} as { [id: string]: Shift });
    const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const colorMap: {[key: string]: string} = { 'red-500': '#ef4444', 'blue-500': '#3b82f6', 'cyan-500': '#06b6d4', 'yellow-500': '#eab308', 'gray-500': '#6b7280', 'green-500': '#22c55e', 'purple-500': '#a855f7', 'white': '#ffffff', 'black': '#000000', 'transparent': 'transparent' };
    
    const getColorFromMap = (color?: string, prefix: string = 'bg-'): string => {
        if (!color) return '';
        return color.replace(prefix, '');
    };

    const tableHeader = `
        <thead>
            <tr>
                <th class="employee-name">Empleado</th>
                ${days.map(date => {
                    const dayNum = date.getUTCDate();
                    const dayName = WEEK_DAYS[date.getUTCDay()];
                    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
                    return `<th class="day-header ${isWeekend ? 'weekend' : ''}"><div>${dayName}</div><div>${dayNum}</div></th>`;
                }).join('')}
            </tr>
        </thead>
    `;

    const tableBody = `
        <tbody>
            ${employees.map(employee => `
                <tr>
                    <td class="employee-name">${employee.name}</td>
                    ${days.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const shiftId = schedule[employee.id]?.[dateStr];
                        const shift = shiftId ? shiftsById[shiftId] : null;
                        const finalBgColor = shift?.color ? (colorMap[getColorFromMap(shift.color, 'bg-')] || 'transparent') : 'transparent';
                        const finalTextColor = shift?.textColor ? (colorMap[getColorFromMap(shift.textColor, 'text-')] || '#333') : '#333';
                        return `<td class="shift-cell" style="background-color: ${finalBgColor}; color: ${finalTextColor};">${shiftId || ''}</td>`;
                    }).join('')}
                </tr>
            `).join('')}
        </tbody>
    `;

    const workShifts = shifts.filter(s => s.hours > 0 && s.description);
    const offShifts = shifts.filter(s => s.hours === 0 && s.description);
    
    const legend = `
        <div class="legend-container">
            <div class="legend">
                <h2>Turnos de Trabajo</h2>
                ${workShifts.map(s => `
                    <div class="legend-item">
                        <div class="legend-key">${s.id}</div>
                        <div class="legend-desc">${s.description} (${s.hours}h)</div>
                    </div>
                `).join('')}
            </div>
            <div class="legend">
                <h2>Leyenda de Ausencias</h2>
                ${offShifts.map(s => {
                    const bgColor = s.color ? (colorMap[getColorFromMap(s.color, 'bg-')] || s.color) : 'transparent';
                    const textColor = s.textColor ? (colorMap[getColorFromMap(s.textColor, 'text-')] || '#ffffff') : '#ffffff';
                    return `
                    <div class="legend-item">
                        <div class="legend-key" style="background-color:${bgColor}; color:${textColor};">${s.id}</div>
                        <div class="legend-desc">${s.description}</div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            ${getSchedulePrintStyles()}
        </head>
        <body>
            <div class="print-container">
                <header class="header">
                    <div class="restaurant-info">
                        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo">` : ''}
                        <h1>${settings.restaurantName}</h1>
                    </div>
                    <h1>${title}</h1>
                </header>
                <main>
                    <table class="schedule-table">
                        ${tableHeader}
                        ${tableBody}
                    </table>
                    ${legend}
                </main>
                <footer class="footer">
                    Documento generado por CostePro &copy; ${new Date().getFullYear()}
                </footer>
            </div>
             <script type="text/javascript">
                window.onload = function() {
                    setTimeout(function() { window.print(); }, 500);
                };
            <\/script>
        </body>
        </html>
    `;
};

const generateLogPageWrapper = (
    title: string, 
    appSettings: Settings, 
    content: string, 
    date: Date,
    infoBarContent: string,
    footerContent: string
): string => {
    const monthYear = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Oswald:wght@700&display=swap');
            @page { size: A4 portrait; margin: 1cm; }
            body { 
                font-family: 'Roboto', sans-serif;
                font-size: 9pt; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                color: #333;
            }
            .page-container {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 4px solid #3b82f6;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }
            .header-text h1 {
                font-family: 'Oswald', sans-serif;
                font-size: 1.8rem;
                color: #3b82f6;
                margin: 0;
                font-weight: 700;
                text-transform: uppercase;
            }
            .header-text h2 {
                font-family: 'Roboto', sans-serif;
                font-size: 1rem;
                color: #555;
                margin: 0;
                font-weight: 400;
            }
            .header-logo img {
                max-height: 50px;
                max-width: 150px;
                object-fit: contain;
            }
            .info-bar {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                background-color: #dbeafe;
                padding: 0.5rem 0.75rem;
                border: 1px solid #9ca3af;
                border-radius: 5px;
                margin-bottom: 1rem;
                font-size: 0.8rem;
            }
            .main-content {
                flex-grow: 1;
            }
            .main-table {
                width: 100%;
                border-collapse: collapse;
            }
            .main-table th, .main-table td {
                border: 1px solid #9ca3af;
                padding: 0.2rem;
                text-align: center;
                height: 22px;
            }
            .main-table th {
                background-color: #3b82f6;
                color: white;
                font-weight: bold;
                font-size: 0.8rem;
            }
            .main-table tbody tr:nth-child(even) {
                background-color: #eff6ff;
            }
            .day-cell {
                font-weight: bold;
                width: 40px;
            }
            .footer {
                text-align: center;
                font-size: 0.8rem;
                color: #6b7280;
                margin-top: 1rem;
                padding-top: 0.5rem;
                border-top: 1px solid #ccc;
            }
            .action-notice {
                background-color: #fefce8;
                border: 1px solid #facc15;
                border-radius: 5px;
                padding: 0.5rem;
                margin-bottom: 0.5rem;
                text-align: center;
                font-size: 0.8rem;
            }
        </style>
    `;

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>${title} - ${appSettings.restaurantName}</title>
            ${styles}
        </head>
        <body>
            <div class="page-container">
                <header class="header">
                    <div class="header-text">
                        <h1>${title}</h1>
                        <h2>${appSettings.restaurantName}</h2>
                    </div>
                    ${appSettings.logoUrl ? `<div class="header-logo"><img src="${appSettings.logoUrl}" alt="Logo"></div>` : ''}
                </header>
                <div class="info-bar">
                    <span><strong>MES / AÑO:</strong> ${monthYear}</span>
                    ${infoBarContent}
                </div>
                <main class="main-content">
                    ${content}
                </main>
                <footer class="footer">
                    ${footerContent}
                    <p>Documento generado por CostePro &copy; ${new Date().getFullYear()}</p>
                </footer>
            </div>
            <script type="text/javascript">
                window.onload = function() { setTimeout(function() { window.print(); }, 500); };
            </script>
        </body>
        </html>
    `;
};


export const generateRefrigeratorLogHtml = (appSettings: Settings, date: Date, records: AppccRecord[] = [], employees: Employee[] = []): string => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const recordsMap = new Map<number, { value: string, employeeName: string }>();
    records.forEach(rec => {
        const recDate = new Date(rec.date);
        if (recDate.getMonth() === month && recDate.getFullYear() === year) {
            const employee = employees.find(e => e.id === rec.employeeId);
            recordsMap.set(recDate.getDate(), { value: rec.value as string, employeeName: employee?.name.split(' ')[0] || '?' });
        }
    });

    const tableRows = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const record = recordsMap.get(day);
        return `
        <tr>
            <td class="day-cell">${day}</td>
            <td>${record?.value || ''}</td>
            <td>${record?.employeeName || ''}</td>
        </tr>
    `}).join('');
    
    const content = `<table class="main-table"><thead><tr><th>Día</th><th>Temperatura (°C)</th><th>Firma</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    const infoBar = `<span><strong>EQUIPO:</strong> ____________________</span><span><strong>UBICACIÓN:</strong> ____________________</span>`;
    const footer = `<div class="action-notice"><strong>ACCIÓN CORRECTORA:</strong> Si la temperatura está fuera del rango correcto (entre 2°C y 5°C), avisar inmediatamente al responsable.</div>`;
    return generateLogPageWrapper("CONTROL DE TEMPERATURA DE NEVERA", appSettings, content, date, infoBar, footer);
};

export const generateFreezerLogHtml = (appSettings: Settings, date: Date, records: AppccRecord[] = [], employees: Employee[] = []): string => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const recordsMap = new Map<number, { value: string, employeeName: string }>();
    records.forEach(rec => {
        const recDate = new Date(rec.date);
        if (recDate.getMonth() === month && recDate.getFullYear() === year) {
            const employee = employees.find(e => e.id === rec.employeeId);
            recordsMap.set(recDate.getDate(), { value: rec.value as string, employeeName: employee?.name.split(' ')[0] || '?' });
        }
    });
    
    const tableRows = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const record = recordsMap.get(day);
        return `
        <tr>
            <td class="day-cell">${day}</td>
            <td>${record?.value || ''}</td>
            <td>${record?.employeeName || ''}</td>
        </tr>
    `}).join('');
    
    const content = `<table class="main-table"><thead><tr><th>Día</th><th>Temperatura (°C)</th><th>Firma</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    const infoBar = `<span><strong>EQUIPO:</strong> ____________________</span><span><strong>UBICACIÓN:</strong> ____________________</span>`;
    const footer = `<div class="action-notice"><strong>ACCIÓN CORRECTORA:</strong> Si la temperatura está fuera del rango correcto (inferior a -18°C), avisar inmediatamente al responsable.</div>`;
    return generateLogPageWrapper("CONTROL DE TEMPERATURA DE CONGELADOR", appSettings, content, date, infoBar, footer);
};

export const generateFryerCleaningLogHtml = (appSettings: Settings, date: Date, records: AppccRecord[] = [], employees: Employee[] = []): string => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const recordsMap = new Map<number, { tasks: string[], employeeName: string }>();
     records.forEach(rec => {
        const recDate = new Date(rec.date);
        if (recDate.getMonth() === month && recDate.getFullYear() === year) {
            const employee = employees.find(e => e.id === rec.employeeId);
            recordsMap.set(recDate.getDate(), { tasks: rec.value as string[], employeeName: employee?.name.split(' ')[0] || '?' });
        }
    });
    
     const tableRows = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const record = recordsMap.get(day);
        return `
        <tr>
            <td class="day-cell">${day}</td>
            <td>${record?.tasks.includes('Lim') ? '✓' : ''}</td>
            <td>${record?.tasks.includes('Ace') ? '✓' : ''}</td>
            <td></td><td></td>
            <td></td><td></td>
            <td></td><td></td>
            <td>${record?.employeeName || ''}</td>
        </tr>
    `}).join('');
    
    const content = `<table class="main-table"><thead><tr><th rowspan="2" style="vertical-align: middle;">Día</th><th colspan="2">Freidora 1</th><th colspan="2">Freidora 2</th><th colspan="2">Freidora 3</th><th colspan="2">Freidora 4</th><th rowspan="2" style="vertical-align: middle;">Firma</th></tr><tr><th>Limp.</th><th>Aceite</th><th>Limp.</th><th>Aceite</th><th>Limp.</th><th>Aceite</th><th>Limp.</th><th>Aceite</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    const footer = `<div class="action-notice"><strong>INSTRUCCIONES:</strong> Marcar con un <strong>✓</strong> en la casilla correspondiente. <strong>Limp.</strong> = Limpieza completa de la cuba. <strong>Aceite</strong> = Cambio completo del aceite.</div>`;
    return generateLogPageWrapper("REGISTRO LIMPIEZA Y CAMBIO DE ACEITE DE FREIDORAS", appSettings, content, date, '', footer);
};

export const generateGeneralCleaningLogHtml = (appSettings: Settings, date: Date, records: AppccRecord[] = [], employees: Employee[] = []): string => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const recordsForMonth = records.filter(rec => {
        const recDate = new Date(rec.date);
        return recDate.getMonth() === month && recDate.getFullYear() === year;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let tableRows = recordsForMonth.map(rec => {
        const employee = employees.find(e => e.id === rec.employeeId);
        const tasks = Array.isArray(rec.value) ? rec.value.join('<br>') : rec.value;
        return `<tr>
            <td>${new Date(rec.date).toLocaleDateString('es-ES')}</td>
            <td style="text-align: left;">${tasks}</td>
            <td></td>
            <td>${employee?.name.split(' ')[0] || ''}</td>
            <td></td>
            <td>${rec.notes || ''}</td>
        </tr>`
    }).join('');
    
    const emptyRowsCount = Math.max(0, 22 - recordsForMonth.length);
    tableRows += Array.from({ length: emptyRowsCount }, () => `<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('');


    const content = `<table class="main-table"><thead><tr><th style="width: 10%;">Fecha</th><th style="width: 30%;">Área / Equipo Limpiado</th><th style="width: 20%;">Producto Utilizado</th><th style="width: 10%;">Realizado</th><th style="width: 10%;">Supervisado</th><th style="width: 20%;">Observaciones</th></tr></thead><tbody>${tableRows}</tbody></table>`;
    const footer = `<div class="action-notice"><strong>NOTA:</strong> Detallar cualquier incidencia o producto de limpieza específico en la columna de observaciones.</div>`;
    return generateLogPageWrapper("REGISTRO DE LIMPIEZA GENERAL", appSettings, content, date, '', footer);
};


export const generateMonthlyScheduleHtml = (
    employees: Employee[],
    schedule: FullSchedule,
    shifts: Shift[],
    settings: Settings,
    year: number,
    month: number
): string => {
    const monthName = new Date(Date.UTC(year, month)).toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' });
    const title = `Horario de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1)));
    
    return generateScheduleTableHtml(title, daysArray, employees, schedule, shifts, settings);
};

export const generateWeeklyScheduleHtml = (
    employees: Employee[],
    schedule: FullSchedule,
    shifts: Shift[],
    settings: Settings,
    week: Date[]
): string => {
    const startDate = week[0];
    const endDate = week[6];
    const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    const title = `Horario Semanal: ${startDate.toLocaleDateString('es-ES', formatOptions)} - ${endDate.toLocaleDateString('es-ES', formatOptions)}`;
    
    return generateScheduleTableHtml(title, week, employees, schedule, shifts, settings);
};
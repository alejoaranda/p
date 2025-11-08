
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Ingredient, RecipeIngredient, Settings } from '../types';
import { TrashIcon, PlusIcon, SparklesIcon } from './icons';
import { generateImageForRecipe } from '../services/geminiService';
import { getCurrencySymbol } from '../../services/currencyService';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  ingredients: Ingredient[];
  addOrUpdateRecipe: (recipe: Recipe) => void;
  categories: string[];
  settings: Settings;
}

const ALL_ALLERGENS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacauetes', 'Soja', 'Lácteos', 
  'Frutos de cáscara', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
];

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm-6 8h6v4H7v-4z" clipRule="evenodd" />
    </svg>
);

// Helper component for info blocks
const InfoBlock: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={`flex flex-col space-y-1 ${className}`}>
        <div className="flex items-center justify-between bg-secondary text-white rounded-t-md px-2 py-1">
            <span className="text-xs font-bold uppercase">{label}</span>
        </div>
        <div className="bg-base-300 rounded-b-md p-2 text-center h-full flex flex-col justify-center">
            {children}
        </div>
    </div>
);

const DoughnutChart: React.FC<{ cost: number; benefit: number; pvpSinTax: number, currencySymbol: string }> = ({ cost, benefit, pvpSinTax, currencySymbol }) => {
    if (pvpSinTax <= 0) {
        return <div className="flex items-center justify-center h-40"><span className="text-sm text-base-content/70">Añade un PVP para ver el beneficio.</span></div>;
    }
    
    const costPercentage = Math.min(100, (cost / pvpSinTax) * 100);

    const circumference = 2 * Math.PI * 45; // r = 45
    const costArcLength = (circumference * costPercentage) / 100;
    const benefitColor = benefit >= 0 ? '#16a34a' : '#ef4444'; // green for profit, red for loss

    return (
        <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke={benefitColor} strokeWidth="10" />
                {costPercentage > 0 && costPercentage <= 100 && (
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#f97316" // orange
                        strokeWidth="10"
                        strokeDasharray={`${costArcLength} ${circumference}`}
                        transform="rotate(-90 50 50)"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-base-content/70">{benefit >= 0 ? 'Beneficio' : 'Pérdida'}</span>
                <span className={`text-xl font-bold`} style={{ color: benefitColor }}>{benefit.toFixed(2)}{currencySymbol}</span>
            </div>
        </div>
    );
};

const PrintableView: React.FC<{ recipe: Recipe; allIngredients: Ingredient[], settings: Settings }> = ({ recipe, allIngredients, settings }) => {
    const currencySymbol = getCurrencySymbol(settings.currency);
    const getIngredientDetails = (id: string) => allIngredients.find(ing => ing.id === id || ing.name.toLowerCase() === id.toLowerCase());

    const ingredientsWithDetails = recipe.ingredients.map(recipeIng => {
        const details = getIngredientDetails(recipeIng.ingredientId);
        const netQuantityG = recipeIng.quantity;
        const wastePercentage = recipeIng.wastePercentage;
        const wasteFactor = 1 - (wastePercentage / 100);
        
        const grossQuantityG = wasteFactor > 0 ? netQuantityG / wasteFactor : 0;
        const pricePerUnit = details?.price || 0;
        
        const cost = (grossQuantityG / 1000) * pricePerUnit;

        return {
            name: details?.name || recipeIng.ingredientId,
            netQuantityG,
            wastePercentage,
            grossQuantityG,
            pricePerUnit,
            unit: details?.unit || 'kg',
            cost,
        };
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

    return (
        <div id="printable-recipe" className="printable-area hidden bg-white text-gray-900 text-xs font-sans">
            {/* --- PAGE 1: ESCANDALLO DE COSTES --- */}
            <div className="p-8 w-[210mm] h-[297mm] flex flex-col">
                <header className="flex justify-between items-start pb-2 border-b-4 border-primary">
                    <div className="flex items-center space-x-4">
                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto max-w-[150px] object-contain" />}
                        <h2 className="text-xl font-bold text-gray-600">{settings.restaurantName}</h2>
                    </div>
                    <h2 className="text-xl font-bold text-primary text-right">ESCANDALLO DE COSTES</h2>
                </header>

                <section className="flex my-6">
                    <div className="w-2/3 pr-4">
                        <h1 className="text-4xl font-extrabold text-gray-800 uppercase tracking-tight">{recipe.name}</h1>
                        <p className="text-lg text-gray-500 font-medium">{recipe.category}</p>
                        <p className="text-sm text-gray-500 mt-2">Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                    <div className="w-1/3 h-32 bg-gray-200 border-2 border-gray-300 flex-shrink-0">
                        {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover"/>}
                    </div>
                </section>
                
                 <section className="grid grid-cols-4 gap-x-4 mb-6 text-sm">
                    <div className="bg-gray-100 p-2 rounded text-center">
                        <div className="font-bold text-gray-500 text-xs">COSTE POR RACIÓN</div>
                        <div className="text-xl font-bold text-primary">{costPerServing.toFixed(2)} {currencySymbol}</div>
                    </div>
                     <div className="bg-gray-100 p-2 rounded text-center">
                        <div className="font-bold text-gray-500 text-xs">PVP SIN IMPUESTOS</div>
                        <div className="text-xl font-bold text-gray-800">{pvpSinTax.toFixed(2)} {currencySymbol}</div>
                    </div>
                     <div className="bg-gray-100 p-2 rounded text-center">
                        <div className="font-bold text-gray-500 text-xs">FOOD COST / RATIO</div>
                        <div className="text-xl font-bold text-gray-800">{foodCostPercentage.toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded text-center">
                        <div className="font-bold text-gray-500 text-xs">BENEFICIO NETO</div>
                        <div className={`text-xl font-bold ${netBenefitPerServing >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netBenefitPerServing.toFixed(2)} {currencySymbol}</div>
                    </div>
                </section>

                <h3 className="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2 mt-4">Desglose de Ingredientes</h3>
                <table className="w-full border-collapse text-center">
                    <thead className="bg-gray-800 text-white font-bold text-xs">
                        <tr>
                            <th className="p-2 text-left w-1/3">INGREDIENTE</th>
                            <th className="p-2">CANT. NETA</th>
                            <th className="p-2">MERMA</th>
                            <th className="p-2">CANT. BRUTA</th>
                            <th className="p-2">PRECIO/UNIDAD</th>
                            <th className="p-2">COSTE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ingredientsWithDetails.map((ing, index) => (
                            <tr key={index} className="border-b border-gray-300 odd:bg-white even:bg-gray-50">
                                <td className="p-1.5 text-left font-medium">{ing.name}</td>
                                <td className="p-1.5">{ing.netQuantityG.toFixed(0)} g</td>
                                <td className="p-1.5">{ing.wastePercentage}%</td>
                                <td className="p-1.5">{ing.grossQuantityG.toFixed(0)} g</td>
                                <td className="p-1.5">{ing.pricePerUnit.toFixed(2)} ${currencySymbol}/${ing.unit}</td>
                                <td className="p-1.5 font-semibold">${ing.cost.toFixed(2)} ${currencySymbol}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-200 font-extrabold text-base">
                            <td colSpan={5} className="text-right p-2">COSTE TOTAL MATERIA PRIMA</td>
                            <td className="p-2">${totalCost.toFixed(2)} ${currencySymbol}</td>
                        </tr>
                        <tr className="bg-gray-200 font-extrabold text-base">
                            <td colSpan={5} className="text-right p-2">COSTE POR RACIÓN (${recipe.servings} raciones)</td>
                            <td className="p-2">${costPerServing.toFixed(2)} ${currencySymbol}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <section className="mt-4 border-t-2 border-gray-300 pt-2 text-xs">
                    <div className="font-bold">PVP Recomendado (Coeficiente: ${coefficient.toFixed(1)}x): <span className="text-primary">${pvpRecomendadoConTax.toFixed(2)} ${currencySymbol}</span></div>
                </section>

                <footer className="text-center text-xs text-gray-500 border-t pt-2 mt-auto">
                    Documento generado por CostePro &copy; ${new Date().getFullYear()}
                </footer>
            </div>
            
            {/* --- PAGE 2: FICHA TÉCNICA --- */}
            <div className="print-break-before p-8 w-[210mm] h-[297mm] flex flex-col">
                 <header className="flex justify-between items-start pb-2 border-b-4 border-primary">
                    <div className="flex items-center space-x-4">
                        ${settings.logoUrl && `<img src="${settings.logoUrl}" alt="Logo" className="h-16 w-auto max-w-[150px] object-contain" />`}
                        <h2 className="text-xl font-bold text-gray-600">${settings.restaurantName}</h2>
                    </div>
                    <h2 className="text-xl font-bold text-primary text-right">FICHA TÉCNICA DE PRODUCCIÓN</h2>
                </header>

                <section className="flex my-6">
                    <div className="w-2/3 pr-4">
                        <h1 className="text-4xl font-extrabold text-gray-800 uppercase tracking-tight">${recipe.name}</h1>
                        <p className="text-lg text-gray-500 font-medium">${recipe.category}</p>
                    </div>
                    <div className="w-1/3 h-32 bg-gray-200 border-2 border-gray-300 flex-shrink-0">
                        ${recipe.imageUrl && `<img src="${recipe.imageUrl}" alt="${recipe.name}" className="w-full h-full object-cover"/>`}
                    </div>
                </section>

                <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                    <div className="bg-gray-100 p-2 rounded"><div className="font-bold text-gray-500 text-xs">T. PREPARACIÓN</div><div className="text-lg font-bold">${recipe.prepTime} min</div></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="font-bold text-gray-500 text-xs">T. COCCIÓN</div><div className="text-lg font-bold">${recipe.cookTime} min</div></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="font-bold text-gray-500 text-xs">Nº RACIONES</div><div className="text-lg font-bold">${recipe.servings}</div></div>
                    <div className="bg-gray-100 p-2 rounded"><div className="font-bold text-gray-500 text-xs">PESO PORCIÓN</div><div className="text-lg font-bold">${recipe.portionSize || 0} g</div></div>
                </div>

                <div className="grid grid-cols-5 gap-6 flex-grow">
                    <div className="col-span-2 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2">Ingredientes</h3>
                         <div className="overflow-hidden">
                             <table className="w-full text-left text-xs leading-snug">
                                <tbody>
                                    ${ingredientsWithDetails.map((ing, i) => `
                                        <tr key=${i} className="border-b border-gray-200">
                                            <td className="py-0.5 font-medium">${ing.name}</td>
                                            <td className="py-0.5 text-right">${ing.netQuantityG.toFixed(0)} g</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                             </table>
                        </div>
                    </div>
                    <div className="col-span-3 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2">Preparación</h3>
                        <ol className="list-decimal list-inside text-xs leading-snug overflow-hidden">
                            ${recipe.preparationSteps.map((step, i) => `<li key=${i}>${step}</li>`).join('')}
                        </ol>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-primary pb-1 mb-2">Información de Alérgenos</h3>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        ${ALL_ALLERGENS.map(allergen => {
                            const isActive = recipe.allergens.includes(allergen);
                            return `
                                <div key=${allergen} className="p-2 border rounded ${isActive ? 'bg-yellow-400 border-yellow-600 font-bold' : 'bg-gray-100 border-gray-300'}">
                                    ${allergen}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <footer className="text-center text-xs text-gray-500 border-t pt-2 mt-auto">
                    Documento generado por CostePro &copy; ${new Date().getFullYear()}
                </footer>
            </div>
        </div>
    );
};


export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({ recipe, onClose, ingredients: allIngredients, addOrUpdateRecipe, categories, settings }) => {
  const [editableRecipe, setEditableRecipe] = useState(recipe);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditableRecipe(recipe);
  }, [recipe]);

  const handleSave = () => {
    addOrUpdateRecipe(editableRecipe);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
        const imageUrl = await generateImageForRecipe(editableRecipe.name);
        if (imageUrl) {
            const updatedRecipe = { ...editableRecipe, imageUrl };
            setEditableRecipe(updatedRecipe);
            addOrUpdateRecipe(updatedRecipe);
        } else {
            alert("No se pudo generar la imagen.");
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to generate image:", errorMessage);
        alert(`Fallo al generar la imagen: ${errorMessage}`);
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("El archivo es demasiado grande. Por favor, sube una imagen de menos de 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const imageUrl = reader.result as string;
        const updatedRecipe = { ...editableRecipe, imageUrl };
        setEditableRecipe(updatedRecipe);
        addOrUpdateRecipe(updatedRecipe);
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    const printableContent = document.getElementById('printable-recipe')?.innerHTML;
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
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
            .print-break-before {
              page-break-before: always;
            }
          }
        </style>
    `;

    if (printableContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Imprimir Receta - ${recipe.name}</title>
              ${tailwindCdn}
              ${tailwindConfig}
              ${printStyles}
            </head>
            <body class="bg-white">
              ${printableContent}
              <script type="text/javascript">
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 500); // Delay to ensure styles are applied
                };
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleRecipeChange = (field: keyof Recipe, value: any) => {
    setEditableRecipe(prev => ({ ...prev, [field]: value }));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const newIngredients = [...editableRecipe.ingredients];
    const ingredient = { ...newIngredients[index] };
    (ingredient[field] as any) = value;
    newIngredients[index] = ingredient;
    setEditableRecipe(prev => ({ ...prev, ingredients: newIngredients }));
  };
  
  const handlePreparationStepsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const steps = e.target.value.split('\n');
    handleRecipeChange('preparationSteps', steps);
  };
  
  const toggleAllergen = (allergenName: string) => {
    const currentAllergens = editableRecipe.allergens || [];
    const isPresent = currentAllergens.includes(allergenName);
    const newAllergens = isPresent
        ? currentAllergens.filter(a => a !== allergenName)
        : [...currentAllergens, allergenName];
    
    const updatedRecipe = { ...editableRecipe, allergens: newAllergens };
    setEditableRecipe(updatedRecipe);
    addOrUpdateRecipe(updatedRecipe); // Save immediately
  };

  const addIngredient = () => {
    setEditableRecipe(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, { ingredientId: '', quantity: 0, wastePercentage: 0 }]
    }));
  };

  const removeIngredient = (index: number) => {
    const newIngredients = editableRecipe.ingredients.filter((_, i) => i !== index);
    const updatedRecipe = { ...editableRecipe, ingredients: newIngredients };
    setEditableRecipe(updatedRecipe);
    addOrUpdateRecipe(updatedRecipe); // Save immediately
  };
  
  const getIngredientDetails = (ingredientId: string): Ingredient | undefined => {
    return allIngredients.find(ing => ing.id === ingredientId || ing.name.toLowerCase() === ingredientId.toLowerCase());
  };
  
  // --- Calculations ---
  const currencySymbol = getCurrencySymbol(settings.currency);

  const totalCost = editableRecipe.ingredients.reduce((acc, recipeIng) => {
      const details = getIngredientDetails(recipeIng.ingredientId);
      if (details && details.price > 0 && recipeIng.quantity > 0) {
          const wasteFactor = 1 - (recipeIng.wastePercentage / 100);
          if (wasteFactor <= 0) return acc;
          const quantityKg = recipeIng.quantity / 1000;
          const effectiveQuantity = quantityKg / wasteFactor;
          return acc + (effectiveQuantity * details.price);
      }
      return acc;
  }, 0);

  const costPerServing = totalCost > 0 && editableRecipe.servings > 0 ? totalCost / editableRecipe.servings : 0;
  
  const taxDivisor = 1 + (editableRecipe.taxRate || 0) / 100;
  const pvpSinTax = taxDivisor !== 0 ? (editableRecipe.pvp || 0) / taxDivisor : (editableRecipe.pvp || 0);
  
  const netBenefitPerServing = pvpSinTax - costPerServing;

  // --- Styles ---
  const inputStyles = "bg-transparent w-full focus:outline-none focus:bg-base-100 rounded px-1 py-0.5 transition-colors";
  const numInputStyles = `${inputStyles} text-right`;
  const escandalloInputStyles = "text-base font-semibold text-white bg-transparent text-center w-full focus:outline-none focus:ring-1 focus:ring-primary rounded";

  return (
    <>
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 non-printable" onClick={onClose}>
        <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="p-4 border-b border-base-300 flex justify-between items-center space-x-4">
                <div className="flex-grow">
                    <input
                        type="text"
                        value={editableRecipe.name}
                        onChange={e => handleRecipeChange('name', e.target.value)}
                        onBlur={handleSave}
                        className="text-2xl font-bold text-base-content bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 w-full mb-2"
                    />
                     <select
                        value={editableRecipe.category}
                        onChange={e => handleRecipeChange('category', e.target.value)}
                        onBlur={handleSave}
                        className="text-sm bg-base-300 text-base-content/80 rounded focus:outline-none focus:ring-1 focus:ring-primary py-1 px-2 w-full md:w-auto"
                    >
                        <option value="">-- Asignar Categoría --</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handlePrint} className="btn btn-sm bg-base-300 hover:bg-base-100 flex items-center space-x-2">
                        <PrintIcon />
                        <span className="hidden sm:inline">Exportar a PDF</span>
                    </button>
                    <button onClick={onClose} className="text-base-content/70 hover:text-base-content text-3xl leading-none flex-shrink-0">&times;</button>
                </div>
            </header>
            
            <div className="p-6 overflow-y-auto">
                {/* Top Section: Image */}
                <div className="w-full h-64 bg-base-300 rounded-lg shadow-inner flex items-center justify-center mb-6">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                    {editableRecipe.imageUrl ? (
                        <img src={editableRecipe.imageUrl} alt={editableRecipe.name} className="w-full h-full object-cover rounded-lg"/>
                    ) : isGeneratingImage ? (
                        <div className="flex flex-col items-center justify-center text-base-content/70">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                            <span>Generando imagen...</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <button onClick={handleGenerateImage} className="text-primary hover:text-primary-focus transition-colors" aria-label="Generar imagen con IA">
                                <SparklesIcon className="h-12 w-12" />
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-lg btn-circle" aria-label="Subir imagen">
                                <PlusIcon />
                            </button>
                        </div>
                    )}
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <InfoBlock label="Costo por Ración"><span className="text-2xl font-bold text-primary">{costPerServing.toFixed(2)}{currencySymbol}</span></InfoBlock>
                    <InfoBlock label="IVA (%)">
                        <div className="flex items-center justify-center">
                            <input 
                                type="number" 
                                value={editableRecipe.taxRate || 0} 
                                onChange={e => handleRecipeChange('taxRate', parseInt(e.target.value) || 0)}
                                onBlur={handleSave} 
                                className={escandalloInputStyles} 
                            />
                            <span className="text-base font-semibold text-white ml-1">%</span>
                        </div>
                    </InfoBlock>
                    <InfoBlock label="PVP">
                        <div className="flex items-center justify-center">
                            <input 
                                type="number" 
                                step="0.01" 
                                value={editableRecipe.pvp || 0} 
                                onChange={e => {
                                    const displayValue = parseFloat(e.target.value.replace(',', '.')) || 0;
                                    handleRecipeChange('pvp', displayValue);
                                }}
                                onBlur={handleSave} 
                                className={escandalloInputStyles} 
                            />
                            <span className="text-base font-semibold text-white ml-1">{currencySymbol}</span>
                        </div>
                    </InfoBlock>
                    <InfoBlock label="Rentabilidad por Ración" className="col-span-2 lg:col-span-1">
                        <DoughnutChart cost={costPerServing} benefit={netBenefitPerServing} pvpSinTax={pvpSinTax} currencySymbol={currencySymbol} />
                        <div className="flex justify-center space-x-4 mt-2 text-xs">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-primary mr-2"></span>Coste</div>
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: netBenefitPerServing >= 0 ? '#16a34a' : '#ef4444'}}></span>{netBenefitPerServing >= 0 ? 'Beneficio' : 'Pérdida'}</div>
                        </div>
                    </InfoBlock>
                </div>

                {/* Small Production Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <InfoBlock label="T. Preparación">
                        <div className="flex items-baseline justify-center">
                        <input type="number" value={editableRecipe.prepTime} onChange={e => handleRecipeChange('prepTime', parseInt(e.target.value))} onBlur={handleSave} className={escandalloInputStyles} />
                        <span className="ml-1 text-sm text-base-content/70">min</span>
                        </div>
                    </InfoBlock>
                    <InfoBlock label="T. Cocción">
                        <div className="flex items-baseline justify-center">
                        <input type="number" value={editableRecipe.cookTime} onChange={e => handleRecipeChange('cookTime', parseInt(e.target.value))} onBlur={handleSave} className={escandalloInputStyles} />
                        <span className="ml-1 text-sm text-base-content/70">min</span>
                        </div>
                    </InfoBlock>
                    <InfoBlock label="Tamaño Ración">
                        <div className="flex items-baseline justify-center">
                        <input type="number" value={editableRecipe.portionSize || 0} onChange={e => handleRecipeChange('portionSize', parseInt(e.target.value))} onBlur={handleSave} className={escandalloInputStyles} />
                        <span className="ml-1 text-sm text-base-content/70">Gr</span>
                        </div>
                    </InfoBlock>
                    <InfoBlock label="Nº Raciones">
                        <input type="number" value={editableRecipe.servings} onChange={e => handleRecipeChange('servings', parseInt(e.target.value))} onBlur={handleSave} className={escandalloInputStyles} />
                    </InfoBlock>
                </div>


                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <h3 className="text-lg font-semibold mb-3 text-base-content">Ingredientes</h3>
                        <div className="bg-base-300 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-base-100/50">
                                    <tr>
                                        <th className="p-2 text-left font-semibold">Ingrediente</th>
                                        <th className="p-2 text-right font-semibold">Merma (%)</th>
                                        <th className="p-2 text-right font-semibold">Cant. (g)</th>
                                        <th className="p-2 text-right font-semibold">Cant. (Kg/L)</th>
                                        <th className="p-2 text-right font-semibold">Coste Kg/L</th>
                                        <th className="p-2 text-right font-semibold">Coste Total</th>
                                        <th className="p-2 text-center font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editableRecipe.ingredients.map((recipeIng, index) => {
                                    const details = getIngredientDetails(recipeIng.ingredientId);
                                    const wasteFactor = 1 - (recipeIng.wastePercentage / 100);
                                    const cost = details && details.price && wasteFactor > 0 ? ((recipeIng.quantity / 1000) / wasteFactor) * details.price : 0;
                                    return (
                                        <tr key={index} className="border-t border-base-100">
                                            <td className="p-1 w-1/3"><input type="text" value={recipeIng.ingredientId} onChange={e => handleIngredientChange(index, 'ingredientId', e.target.value)} onBlur={handleSave} className={inputStyles} placeholder="Nombre..."/></td>
                                            <td className="p-1"><input type="number" value={recipeIng.wastePercentage} onChange={e => handleIngredientChange(index, 'wastePercentage', parseInt(e.target.value) || 0)} onBlur={handleSave} className={numInputStyles} /></td>
                                            <td className="p-1"><input type="number" value={recipeIng.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseFloat(e.target.value.replace(',', '.')) || 0)} onBlur={handleSave} className={numInputStyles} /></td>
                                            <td className="p-2 text-right text-base-content/70">{(recipeIng.quantity / 1000).toFixed(3)}</td>
                                            <td className="p-2 text-right text-base-content/70">{details ? `${details.price.toFixed(2)}${currencySymbol}` : 'N/A'}</td>
                                            <td className="p-2 text-right font-medium">{cost.toFixed(2)}{currencySymbol}</td>
                                            <td className="p-1 text-center">
                                                <button onClick={() => removeIngredient(index)} className="text-red-500 hover:text-red-400"><TrashIcon /></button>
                                            </td>
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addIngredient} className="btn btn-xs w-full mt-2 bg-base-300/50 hover:bg-primary/20"><PlusIcon /> Añadir Ingrediente</button>
                    </div>
                    <div className="lg:col-span-2">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-base-content">Pasos de Preparación</h3>
                            <div className="bg-base-300 p-2 rounded-lg">
                                <textarea
                                    value={editableRecipe.preparationSteps.join('\n')}
                                    onChange={handlePreparationStepsChange}
                                    onBlur={handleSave}
                                    className={`${inputStyles} resize-y min-h-[150px]`}
                                    placeholder="Describe los pasos, uno por línea..."
                                    rows={Math.max(5, editableRecipe.preparationSteps.length)}
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-3 text-base-content">Alérgenos</h3>
                            <div className="bg-base-300 p-4 rounded-lg flex flex-wrap gap-2">
                                {ALL_ALLERGENS.map((allergen) => {
                                const isActive = editableRecipe.allergens.includes(allergen);
                                return (
                                    <button
                                    key={allergen}
                                    onClick={() => toggleAllergen(allergen)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                                        isActive 
                                        ? 'bg-red-600 text-white shadow-md' 
                                        : 'bg-base-100 text-base-content/80 hover:bg-base-100/70'
                                    }`}
                                    >
                                    ${allergen}
                                    </button>
                                );
                                })}
                            </div>
                        </div>
                    </div>
            </div>
            </div>
        </div>
        </div>
        <PrintableView recipe={editableRecipe} allIngredients={allIngredients} settings={settings} />
    </>
  );
};




import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Recipe, Settings, Ingredient } from '../../types';
import { PlusIcon, AiIcon, TrashIcon, SparklesIcon, ClearIcon, PrintMenuIcon, PrintEscandalloIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { generateRecipeFromGemini, generateWeeklyMenuSuggestions, WeeklyMenuSuggestions, generateMultipleDescriptions } from '../../services/geminiService';
import { MenuPreviewModal } from '../MenuPreviewModal';
import { generateAllEscandallosHtml } from '../../services/printService';
import { getCurrencySymbol } from '../../services/currencyService';

interface MenuPlannerViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onSelectRecipe: (recipe: Recipe) => void;
  categories: string[];
  addOrUpdateRecipe: (recipe: Recipe) => void;
  settings: Settings;
  weeklyPlan: { [key: string]: string };
  setWeeklyPlan: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  dailyPvp: { [day: string]: number };
  setDailyPvp: React.Dispatch<React.SetStateAction<{ [day: string]: number }>>;
  mealTypes: string[];
  addMealType: () => void;
  removeMealType: (index: number) => void;
  updateMealType: (index: number, newName: string) => void;
}

export const MenuPlannerView: React.FC<MenuPlannerViewProps> = ({ 
    recipes, 
    ingredients, 
    onSelectRecipe, 
    categories, 
    addOrUpdateRecipe, 
    settings, 
    weeklyPlan, 
    setWeeklyPlan,
    dailyPvp,
    setDailyPvp,
    mealTypes,
    addMealType,
    removeMealType,
    updateMealType,
}) => {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const TAX_RATE = (settings.defaultTaxRate || 10) / 100;

  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [popoverCategory, setPopoverCategory] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<WeeklyMenuSuggestions | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const [isMenuPreviewOpen, setIsMenuPreviewOpen] = useState(false);
  const [recipesForPreview, setRecipesForPreview] = useState<{ [category: string]: Recipe[] }>({});
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewMenuPrice, setPreviewMenuPrice] = useState<number | undefined>();
  const [dailyLoading, setDailyLoading] = useState<{ [day: string]: { preview?: boolean; escandallo?: boolean } }>({});
  
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const handlePrevDay = () => {
      setCurrentDayIndex(prev => (prev === 0 ? days.length - 1 : prev - 1));
  };
  const handleNextDay = () => {
      setCurrentDayIndex(prev => (prev === days.length - 1 ? 0 : prev + 1));
  };
  const currentDayForMobile = days[currentDayIndex];


  const dailyCosts = useMemo(() => {
    const costs: { [day: string]: number } = {};
    days.forEach(day => {
        costs[day] = mealTypes.reduce((totalCost, meal) => {
            const recipeName = weeklyPlan[`${day}-${meal}`];
            const recipe = recipes.find(r => r.name === recipeName);
            if (!recipe) return totalCost;

            const totalRecipeCost = recipe.ingredients.reduce((acc, recipeIng) => {
                const details = ingredients.find(ing => ing.id === recipeIng.ingredientId || ing.name.toLowerCase() === recipeIng.ingredientId.toLowerCase());
                if (details && details.price > 0 && recipeIng.quantity > 0) {
                    const wasteFactor = 1 - ((recipeIng.wastePercentage || 0) / 100);
                    if (wasteFactor <= 0) return acc;
                    const quantityKgOrL = recipeIng.quantity / 1000;
                    const effectiveQuantity = quantityKgOrL / wasteFactor;
                    return acc + (effectiveQuantity * details.price);
                }
                return acc;
            }, 0);

            const costPerServing = totalRecipeCost > 0 && recipe.servings > 0 ? totalRecipeCost / recipe.servings : 0;
            return totalCost + costPerServing;
        }, 0);
    });
    return costs;
  }, [weeklyPlan, recipes, ingredients, days, mealTypes]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopover(null);
        setPopoverCategory(null);
      }
    };
    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopover]);

  const handleCreateRecipe = async (recipeName: string, mealType: string, day: string) => {
    const cellKey = `${day}-${mealType}`;
    setLoadingStates(prev => ({ ...prev, [cellKey]: true }));
    try {
      const aiGeneratedData = await generateRecipeFromGemini(recipeName, categories);
      const ingredientsData = Array.isArray(aiGeneratedData.ingredients) ? aiGeneratedData.ingredients : [];
      const preparationSteps = (Array.isArray(aiGeneratedData.preparationSteps) ? aiGeneratedData.preparationSteps : []).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
      const allergens = (Array.isArray(aiGeneratedData.allergens) ? aiGeneratedData.allergens : []).filter((a): a is string => typeof a === 'string' && a.trim().length > 0);

      const newRecipe: Recipe = {
          id: `rec-${Date.now()}`,
          name: aiGeneratedData.name,
          category: aiGeneratedData.category,
          prepTime: aiGeneratedData.prepTime,
          cookTime: aiGeneratedData.cookTime,
          servings: aiGeneratedData.servings,
          ingredients: ingredientsData
            .filter((ing: any): ing is { name: string; quantity: number; wastePercentage: number } => 
              ing && typeof ing === 'object' && ing.name && typeof ing.quantity === 'number' && typeof ing.wastePercentage === 'number'
            )
            .map((ing) => ({
              ingredientId: ing.name, 
              quantity: ing.quantity,
              wastePercentage: ing.wastePercentage
            })),
          preparationSteps,
          allergens,
          imageUrl: '',
          coefficient: 3, pvp: 0, taxRate: 10, portionSize: 250,
      };
      addOrUpdateRecipe(newRecipe);
      setWeeklyPlan(prevPlan => ({
        ...prevPlan,
        [cellKey]: newRecipe.name
      }));
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to generate recipe:", errorMessage);
        alert(`Failed to generate recipe for "${recipeName}": ${errorMessage}`);
    } finally {
        setLoadingStates(prev => ({ ...prev, [cellKey]: false }));
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsSuggesting(true);
    setAiSuggestions(null);
    try {
        const suggestions = await generateWeeklyMenuSuggestions(settings, new Date(), mealTypes);
        setAiSuggestions(suggestions);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to generate weekly menu suggestions:", errorMessage);
        alert(`Fallo al generar sugerencias de menú: ${errorMessage}`);
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleClearSuggestions = () => {
    setAiSuggestions(null);
  };

  const handleSelectAndCreateFromSuggestion = async (day: string, mealType: string, recipeName: string) => {
    const cellKey = `${day}-${mealType}`;
    if (loadingStates[cellKey]) return;

    // Immediately update the UI to show the selected suggestion in the input field.
    setWeeklyPlan(prevPlan => ({
      ...prevPlan,
      [cellKey]: recipeName,
    }));

    // Call the existing function to generate the recipe from AI.
    // This will handle loading states and updating the plan with the final recipe name.
    await handleCreateRecipe(recipeName, mealType, day);

    // Remove the suggestion from the list now that it has been used.
    setAiSuggestions(prev => {
      if (!prev) return null;
      const newSuggestions = JSON.parse(JSON.stringify(prev));
      if (newSuggestions[day] && newSuggestions[day][mealType]) {
        delete newSuggestions[day][mealType];
      }
      return newSuggestions;
    });
  };

  const handlePopoverToggle = (key: string) => {
    if (activePopover === key) {
        setActivePopover(null);
        setPopoverCategory(null);
    } else {
        setActivePopover(key);
        setPopoverCategory(null);
    }
  };

  const handleSelectChange = (day: string, meal: string, recipeName: string) => {
    setWeeklyPlan(prevPlan => ({
        ...prevPlan,
        [`${day}-${meal}`]: recipeName,
    }));
  };

  const handleOpenDailyPreview = async (day: string) => {
    setDailyLoading(prev => ({ ...prev, [day]: { ...prev[day], preview: true } }));
    try {
        const recipesForDay: Recipe[] = [];
        const recipesToUpdate: Recipe[] = [];
        const mealTypesForDay = mealTypes.map(meal => weeklyPlan[`${day}-${meal}`]).filter(Boolean);
        const uniqueRecipeNames = [...new Set(mealTypesForDay)];

        uniqueRecipeNames.forEach(name => {
            const recipe = recipes.find(r => r.name === name);
            if (recipe) {
                recipesForDay.push({ ...recipe });
                if (!recipe.description) {
                    recipesToUpdate.push(recipe);
                }
            }
        });

        if (recipesToUpdate.length > 0) {
            const descriptionsMap = await generateMultipleDescriptions(recipesToUpdate, ingredients);
            recipesToUpdate.forEach(recipe => {
                const description = descriptionsMap[recipe.id];
                if (description) {
                    const updatedRecipe = { ...recipe, description };
                    addOrUpdateRecipe(updatedRecipe);
                    const index = recipesForDay.findIndex(r => r.id === updatedRecipe.id);
                    if (index !== -1) recipesForDay[index] = updatedRecipe;
                }
            });
        }

        const recipesGroupedByMealType: { [mealType: string]: Recipe[] } = {};
        mealTypes.forEach(meal => {
            const recipeName = weeklyPlan[`${day}-${meal}`];
            if(recipeName) {
                const recipe = recipesForDay.find(r => r.name === recipeName);
                if (recipe) {
                    if (!recipesGroupedByMealType[meal]) recipesGroupedByMealType[meal] = [];
                    recipesGroupedByMealType[meal].push(recipe);
                }
            }
        });

        if (Object.keys(recipesGroupedByMealType).length === 0) {
            alert(`No hay recetas en el menú del ${day}.`);
            return;
        }

        setRecipesForPreview(recipesGroupedByMealType);
        setPreviewTitle(`Menú del ${day}`);
        setPreviewMenuPrice(dailyPvp[day]);
        setIsMenuPreviewOpen(true);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to prepare menu preview for ${day}:`, errorMessage);
        alert(`Error al preparar la carta del ${day}: ${errorMessage}`);
    } finally {
        setDailyLoading(prev => ({ ...prev, [day]: { ...prev[day], preview: false } }));
    }
};

const handleGenerateDailyEscandallos = async (day: string) => {
    setDailyLoading(prev => ({ ...prev, [day]: { ...prev[day], escandallo: true } }));
    try {
        const recipeNamesForDay = mealTypes.map(meal => weeklyPlan[`${day}-${meal}`]).filter(Boolean);
        const uniqueRecipeNames = [...new Set(recipeNamesForDay)];
        
        const recipesOnMenu = uniqueRecipeNames
            .map(name => recipes.find(r => r.name === name))
            .filter((r): r is Recipe => r !== undefined);

        if (recipesOnMenu.length === 0) {
            alert(`No hay recetas en el menú del ${day} para exportar.`);
            return;
        }

        const escandallosHtml = generateAllEscandallosHtml(recipesOnMenu, ingredients, settings);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(escandallosHtml);
            printWindow.document.close();
        } else {
            alert("No se pudo abrir la ventana de impresión. Por favor, revisa la configuración de tu navegador.");
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to generate daily escandallos PDF for ${day}:`, errorMessage);
        alert(`Error al generar el PDF de escandallos del ${day}: ${errorMessage}`);
    } finally {
        setDailyLoading(prev => ({ ...prev, [day]: { ...prev[day], escandallo: false } }));
    }
};

  const renderPlannerCell = (day: string, meal: string) => {
      const cellKey = `${day}-${meal}`;
      const selectedRecipeName = weeklyPlan[cellKey];
      const recipe = recipes.find(r => r.name === selectedRecipeName);
      const isLoading = loadingStates[cellKey];
      const hasName = selectedRecipeName && selectedRecipeName.trim() !== '';
      const suggestion = aiSuggestions?.[day]?.[meal];
      return (
        <div className="relative group">
            <div
                className={`w-full ${recipe ? 'cursor-pointer' : ''}`}
                onClick={() => recipe && onSelectRecipe(recipe)}
            >
                <input
                    type="text"
                    value={selectedRecipeName || ''}
                    onChange={(e) => handleSelectChange(day, meal, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && selectedRecipeName && selectedRecipeName.trim() && !recipe) {
                          e.preventDefault();
                          handleCreateRecipe(selectedRecipeName, meal, day);
                      }
                    }}
                    placeholder="Nombre de la Receta..."
                    className={`w-full bg-base-300 text-base-content rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-sm ${recipe ? 'cursor-pointer' : ''}`}
                />
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center space-x-1">
                    {!hasName && (
                        <button onClick={() => handlePopoverToggle(cellKey)} className="text-blue-500 hover:text-blue-400 transition-colors" aria-label="Añadir receta existente">
                            <PlusIcon className="h-7 w-7" />
                        </button>
                    )}
                    {hasName && !recipe && (
                        <button onClick={(e) => { e.stopPropagation(); handleCreateRecipe(selectedRecipeName, meal, day); }} disabled={isLoading} className="p-1 text-primary hover:text-primary-focus disabled:text-base-content/50 transition-colors" aria-label="Crear receta con IA">
                            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <AiIcon className="h-5 w-5" />}
                        </button>
                    )}
                    
                </div>
            </div>

            {suggestion && !hasName && (
                <div className="absolute top-full left-0 w-full z-10 mt-1">
                    <div className="w-full p-1 bg-base-100 border border-primary rounded-md shadow-lg">
                        <button
                            onClick={() => handleSelectAndCreateFromSuggestion(day, meal, suggestion)}
                            className="w-full text-left p-1 hover:bg-primary/20 rounded font-medium truncate text-primary text-sm"
                            title={suggestion}
                        >
                            {suggestion}
                        </button>
                    </div>
                </div>
            )}
             {activePopover === cellKey && (
                <div ref={popoverRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-base-100 rounded-lg shadow-xl z-20 p-2 text-sm">
                    {!popoverCategory ? (
                        <>
                            <h4 className="font-bold mb-1 px-2 text-base-content">Categorías</h4>
                            <ul className="max-h-48 overflow-y-auto">
                                {categories.map(cat => (
                                    <li key={cat} onClick={() => setPopoverCategory(cat)} className="cursor-pointer p-2 hover:bg-primary/20 rounded-md flex justify-between items-center">
                                        <span>{cat}</span>
                                        <span>&rarr;</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div>
                            <button onClick={() => setPopoverCategory(null)} className="font-bold mb-1 p-2 hover:bg-primary/20 rounded-md w-full text-left">&larr; {popoverCategory}</button>
                            <ul className="max-h-40 overflow-y-auto">
                                {recipes.filter(r => r.category === popoverCategory).map(recipe => (
                                    <li key={recipe.id} onClick={() => {
                                        handleSelectChange(day, meal, recipe.name);
                                        setActivePopover(null);
                                        setPopoverCategory(null);
                                    }} className="cursor-pointer p-2 hover:bg-primary/20 rounded-md">
                                        {recipe.name}
                                    </li>
                                ))}
                                {recipes.filter(r => r.category === popoverCategory).length === 0 && (
                                    <li className="p-2 text-base-content/70">No hay recetas.</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
      )
  }

  const currencySymbol = getCurrencySymbol(settings.currency);

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto md:overflow-hidden">
      <div className="bg-base-200 p-3 rounded-xl shadow-lg md:flex-1 flex flex-col md:overflow-hidden">
        <div className="flex items-center mb-4 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-base-content whitespace-nowrap truncate">Creador de Menú Semanal</h2>
          </div>
          <div className="flex-1 text-center hidden md:block">
              {aiSuggestions && (
                  <h3 className="inline-flex items-center gap-2 text-lg font-bold text-primary">
                      <SparklesIcon />
                      <span>Sugerencias con IA</span>
                      <SparklesIcon />
                  </h3>
              )}
          </div>
          <div className="flex-1 flex justify-end">
            <div className="relative group">
                {aiSuggestions ? (
                    <button
                        onClick={handleClearSuggestions}
                        className="btn btn-circle bg-red-600 hover:bg-red-700 text-white"
                        aria-label="Limpiar sugerencias"
                    >
                        <ClearIcon />
                    </button>
                ) : (
                    <button
                        onClick={handleGenerateSuggestions}
                        disabled={isSuggesting}
                        className="p-2 text-primary hover:text-primary-focus disabled:text-base-content/50 transition-colors"
                        aria-label="Generar sugerencias de menú semanal con IA"
                    >
                        {isSuggesting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div> : <SparklesIcon className="h-6 w-6" />}
                    </button>
                )}
                <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-64 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {aiSuggestions ? 'Limpiar sugerencias' : 'Crear un menú semanal equilibrado con IA'}
                </div>
            </div>
          </div>
        </div>
        
        <div className="md:flex-1 md:overflow-auto">
          {/* Desktop Table */}
          <table className="table-fixed w-full border-collapse hidden md:table">
              <thead>
              <tr className="bg-base-300">
                  <th className="p-4 text-left uppercase font-semibold text-sm border border-base-100 w-48 text-lg">ENTRADAS</th>
                  {days.map(day => (
                  <th key={day} className="p-4 text-center uppercase font-semibold text-sm border border-base-100 text-lg">
                      <span>{day.toUpperCase()}</span>
                      <div className="flex justify-center items-center space-x-2 mt-1">
                          <div className="relative group">
                              <button 
                                  onClick={() => handleOpenDailyPreview(day)} 
                                  disabled={dailyLoading[day]?.preview}
                                  className="btn btn-xs btn-square btn-secondary"
                              >
                              {dailyLoading[day]?.preview ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <PrintMenuIcon />}
                              </button>
                              <div className="absolute bottom-full mb-2 w-32 bg-base-100 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Previsualizar Menú del Día
                              </div>
                          </div>
                          <div className="relative group">
                              <button 
                                  onClick={() => handleGenerateDailyEscandallos(day)}
                                  disabled={dailyLoading[day]?.escandallo}
                                  className="btn btn-xs btn-square btn-secondary"
                              >
                                  {dailyLoading[day]?.escandallo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <PrintEscandalloIcon />}
                              </button>
                              <div className="absolute bottom-full mb-2 w-32 bg-base-100 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Exportar Escandallos del Día
                              </div>
                          </div>
                      </div>
                  </th>
                  ))}
              </tr>
              </thead>
              <tbody>
                {mealTypes.map((meal, index) => (
                    <tr key={index} className="hover:bg-base-300/50 transition-colors">
                        <td className="p-2 font-medium border border-base-100 text-lg">
                            <div className="flex items-center space-x-2 group">
                                <input
                                    type="text"
                                    value={meal}
                                    onChange={(e) => updateMealType(index, e.target.value)}
                                    className="bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                                    placeholder="Nombre del tipo..."
                                />
                                <button
                                    onClick={() => removeMealType(index)}
                                    className="btn btn-xs btn-square btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Eliminar fila ${meal}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </td>
                        {days.map(day => (
                            <td key={day} className="p-4 border border-base-100 align-top relative">
                                {renderPlannerCell(day, meal)}
                            </td>
                        ))}
                    </tr>
                ))}
                <tr>
                    <td className="p-4 border border-base-100">
                        <button onClick={addMealType} className="btn btn-sm btn-outline btn-primary w-full">
                            <PlusIcon /> Añadir Fila
                        </button>
                    </td>
                    <td colSpan={days.length} className="p-4 border border-base-100 bg-base-100/10"></td>
                </tr>
              </tbody>
          </table>
          
          {/* Mobile View */}
          <div className="block md:hidden">
              <div className="flex items-center justify-between p-2 bg-base-300 rounded-lg mb-4 flex-shrink-0 sticky top-0 z-10">
                  <button onClick={handlePrevDay} className="btn btn-square btn-ghost" aria-label="Día anterior">
                      <ChevronLeftIcon />
                  </button>
                  <div className="text-center">
                      <h3 className="text-lg font-bold">{currentDayForMobile}</h3>
                      <div className="flex justify-center items-center space-x-2 mt-1">
                          <button onClick={() => handleOpenDailyPreview(currentDayForMobile)} disabled={dailyLoading[currentDayForMobile]?.preview} className="btn btn-xs btn-square btn-secondary">
                              {dailyLoading[currentDayForMobile]?.preview ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <PrintMenuIcon />}
                          </button>
                          <button onClick={() => handleGenerateDailyEscandallos(currentDayForMobile)} disabled={dailyLoading[currentDayForMobile]?.escandallo} className="btn btn-xs btn-square btn-secondary">
                              {dailyLoading[currentDayForMobile]?.escandallo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <PrintEscandalloIcon />}
                          </button>
                      </div>
                  </div>
                  <button onClick={handleNextDay} className="btn btn-square btn-ghost" aria-label="Siguiente día">
                      <ChevronRightIcon />
                  </button>
              </div>
              <div className="space-y-4 pb-4">
                  {mealTypes.map((meal, index) => (
                      <div key={index} className="bg-base-300/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <input
                                type="text"
                                value={meal}
                                onChange={(e) => updateMealType(index, e.target.value)}
                                className="font-medium bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                                placeholder="Nombre del tipo..."
                            />
                            <button
                                onClick={() => removeMealType(index)}
                                className="btn btn-xs btn-square btn-error ml-2"
                                aria-label={`Eliminar fila ${meal}`}
                            >
                                <TrashIcon />
                            </button>
                          </div>
                          {renderPlannerCell(currentDayForMobile, meal)}
                      </div>
                  ))}
                  <div className="px-3">
                    <button onClick={addMealType} className="btn btn-sm btn-outline btn-primary w-full">
                        <PlusIcon /> Añadir Tipo de Comida
                    </button>
                  </div>
              </div>
          </div>
         </div>
      </div>
      <div className="bg-base-300 p-3 rounded-xl shadow-inner md:flex-shrink-0">
          <h3 className="text-lg font-bold text-base-content mb-2">Análisis Financiero Diario</h3>
          {/* Desktop Financial Table */}
          <div className="hidden md:block">
              <table className="table-fixed w-full border-collapse text-xs">
                  <thead>
                      <tr className="bg-base-100">
                          <th className="p-1 text-left font-semibold border border-base-200 w-32">Concepto</th>
                          {days.map(day => (
                              <th key={day} className="p-1 text-center font-semibold border border-base-200">{day}</th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      <tr className="bg-base-200/50">
                          <td className="p-1 font-medium border border-base-200">Coste Menú</td>
                          {days.map(day => (
                              <td key={day} className="p-1 text-right font-bold border border-base-200">
                                  {dailyCosts[day].toFixed(2)} {currencySymbol}
                              </td>
                          ))}
                      </tr>
                      <tr className="bg-base-200/50">
                          <td className="p-1 font-medium border border-base-200">PVP Menú</td>
                          {days.map(day => (
                              <td key={day} className="p-1 text-right border border-base-200">
                                  <input
                                      type="number"
                                      step="0.01"
                                      value={dailyPvp[day] || 0}
                                      onChange={(e) => {
                                          const displayValue = parseFloat(e.target.value) || 0;
                                          setDailyPvp(prev => ({...prev, [day]: displayValue}));
                                      }}
                                      className="w-20 bg-base-100 text-base-content rounded-md py-0.5 px-1 text-right focus:outline-none focus:ring-2 focus:ring-primary"
                                      placeholder="0.00"
                                  /> {currencySymbol}
                              </td>
                          ))}
                      </tr>
                      <tr className="bg-base-200/50">
                          <td className="p-1 font-medium border border-base-200">PVP sin Impuestos</td>
                          {days.map(day => {
                              const pvp = dailyPvp[day] || 0;
                              const pvpSinTax = pvp / (1 + TAX_RATE);
                              return (
                                  <td key={day} className="p-1 text-right border border-base-200">
                                      {pvpSinTax.toFixed(2)} {currencySymbol}
                                  </td>
                              );
                          })}
                      </tr>
                      <tr className="bg-primary/20">
                          <td className="p-1 font-bold border border-base-200 text-base-content">Beneficio Neto</td>
                          {days.map(day => {
                               const pvp = dailyPvp[day] || 0;
                               const pvpSinTax = pvp / (1 + TAX_RATE);
                               const netBenefit = pvpSinTax - dailyCosts[day];
                               const benefitColor = netBenefit >= 0 ? 'text-green-400' : 'text-red-400';
                              return (
                                  <td key={day} className={`p-1 text-right font-extrabold border border-base-200 ${benefitColor}`}>
                                      {netBenefit.toFixed(2)} {currencySymbol}
                                  </td>
                              );
                          })}
                      </tr>
                  </tbody>
              </table>
          </div>
          {/* Mobile Financial Table */}
           <div className="block md:hidden">
              <table className="w-full text-xs">
                    <tbody>
                        <tr className="bg-base-200/50">
                            <td className="p-1 font-medium border border-base-200">Coste Menú</td>
                            <td className="p-1 text-right font-bold border border-base-200">
                                {dailyCosts[currentDayForMobile].toFixed(2)} {currencySymbol}
                            </td>
                        </tr>
                        <tr className="bg-base-200/50">
                            <td className="p-1 font-medium border border-base-200">PVP Menú</td>
                            <td className="p-1 text-right border border-base-200">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={dailyPvp[currentDayForMobile] || 0}
                                    onChange={(e) => {
                                        const displayValue = parseFloat(e.target.value) || 0;
                                        setDailyPvp(prev => ({...prev, [currentDayForMobile]: displayValue}));
                                    }}
                                    className="w-20 bg-base-100 text-base-content rounded-md py-0.5 px-1 text-right"
                                    placeholder="0.00"
                                /> {currencySymbol}
                            </td>
                        </tr>
                         <tr className="bg-base-200/50">
                            <td className="p-1 font-medium border border-base-200">PVP sin Impuestos</td>
                            <td className="p-1 text-right border border-base-200">
                                {((dailyPvp[currentDayForMobile] || 0) / (1 + TAX_RATE)).toFixed(2)} {currencySymbol}
                            </td>
                        </tr>
                        <tr className="bg-primary/20">
                            <td className="p-1 font-bold border border-base-200 text-base-content">Beneficio Neto</td>
                             <td className={`p-1 text-right font-extrabold border border-base-200 ${(((dailyPvp[currentDayForMobile] || 0) / (1 + TAX_RATE)) - dailyCosts[currentDayForMobile]) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(((dailyPvp[currentDayForMobile] || 0) / (1 + TAX_RATE)) - dailyCosts[currentDayForMobile]).toFixed(2)} {currencySymbol}
                            </td>
                        </tr>
                    </tbody>
              </table>
          </div>
      </div>
      <MenuPreviewModal
          isOpen={isMenuPreviewOpen}
          onClose={() => setIsMenuPreviewOpen(false)}
          menuData={recipesForPreview}
          settings={settings}
          onUpdateRecipe={addOrUpdateRecipe}
          title={previewTitle}
          menuPrice={dailyPvp[days.find(day => previewTitle.includes(day)) || '']}
      />
    </div>
  );
};
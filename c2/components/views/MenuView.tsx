import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Settings, Ingredient, ServiceReportData, AllergenInfo } from '../../types';
import { generateRecipeFromGemini, generateMenuSuggestions, MenuSuggestions, generateMultipleDescriptions, generateServiceReport } from '../../services/geminiService';
import { PlusIcon, AiIcon, TrashIcon, SparklesIcon, ClearIcon, PrintMenuIcon, PrintEscandalloIcon, MinusIcon, InfoForServiceIcon } from '../icons';
import { MenuPreviewModal } from '../MenuPreviewModal';
import { generateAllEscandallosHtml, generateServiceReportHtml } from '../../services/printService';

interface ServiceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ServiceReportData[] | null;
  settings: Settings;
}

const ServiceReportModal: React.FC<ServiceReportModalProps> = ({ isOpen, onClose, reportData, settings }) => {
  const [editableReport, setEditableReport] = useState<ServiceReportData[] | null>(null);

  useEffect(() => {
    // Deep copy to allow local edits without affecting parent state
    setEditableReport(reportData ? JSON.parse(JSON.stringify(reportData)) : null);
  }, [reportData]);

  if (!isOpen || !editableReport) return null;
  
  const handlePrint = () => {
    if (!editableReport) return;
    const reportHtml = generateServiceReportHtml(editableReport, settings);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    } else {
        alert("No se pudo abrir la ventana de impresión. Revisa la configuración de tu navegador.");
    }
  };

  const handleKeyPointChange = (dishIndex: number, pointIndex: number, newContent: string) => {
    const newReport = [...editableReport];
    newReport[dishIndex].keyPoints[pointIndex].content = newContent;
    setEditableReport(newReport);
  };
  
  const handleIngredientsChange = (dishIndex: number, newIngredientsString: string) => {
    const newReport = [...editableReport];
    newReport[dishIndex].ingredients = newIngredientsString.split('\n').filter(ing => ing.trim() !== '');
    setEditableReport(newReport);
  };

  const handleAllergenChange = (dishIndex: number, allergenIndex: number, field: keyof AllergenInfo, value: string) => {
    const newReport = [...editableReport];
    const allergen = newReport[dishIndex].allergenManagement[allergenIndex];
     if (field === 'allergenName') {
      allergen.allergenName = value;
    } else if (field === 'justification') {
      allergen.justification = value;
    } else if (field === 'status') {
      allergen.status = value as AllergenInfo['status'];
    }
    setEditableReport(newReport);
  };
  
  const handleAddAllergen = (dishIndex: number) => {
    const newReport = [...editableReport];
    newReport[dishIndex].allergenManagement.push({
      allergenName: '',
      status: 'NO ELIMINABLE',
      justification: ''
    });
    setEditableReport(newReport);
  };

  const handleRemoveAllergen = (dishIndex: number, allergenIndex: number) => {
    const newReport = [...editableReport];
    newReport[dishIndex].allergenManagement.splice(allergenIndex, 1);
    setEditableReport(newReport);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 non-printable" onClick={onClose}>
      <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-base-content">Informe para Servicio (Editable)</h2>
          <div className="flex items-center space-x-4">
            <button onClick={handlePrint} className="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white">Imprimir PDF</button>
            <button onClick={onClose} className="text-base-content/70 hover:text-base-content text-3xl leading-none flex-shrink-0">&times;</button>
          </div>
        </header>
        <div className="p-4 flex-grow overflow-y-auto bg-base-100">
             {editableReport.map((dish, index) => (
                <div key={index} className="bg-base-200 p-4 rounded-lg mb-4 shadow-lg grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 flex flex-col justify-between">
                        <div className="space-y-3">
                            {dish.keyPoints.map((point, pointIndex) => (
                                <div key={point.title}>
                                    <label className="block text-xs font-bold text-base-content/90 mb-1">{point.title}</label>
                                    <textarea
                                        value={point.content}
                                        onChange={(e) => handleKeyPointChange(index, pointIndex, e.target.value)}
                                        className="w-full bg-base-100 text-base-content rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                        rows={2}
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4">
                             <div className="overflow-x-auto rounded-md border border-base-300">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-base-300">
                                        <tr>
                                            <th className="p-2 w-1/4">Alérgeno</th>
                                            <th className="p-2 w-1/4">Estado</th>
                                            <th className="p-2 w-1/2">Justificación y Acciones</th>
                                            <th className="p-1 w-auto text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dish.allergenManagement.map((allergen, allergenIndex) => (
                                            <tr key={allergenIndex} className="border-t border-base-300">
                                                <td className="p-1">
                                                   <input
                                                        type="text"
                                                        value={allergen.allergenName}
                                                        onChange={(e) => handleAllergenChange(index, allergenIndex, 'allergenName', e.target.value)}
                                                        placeholder="Nombre..."
                                                        className="w-full bg-base-100 text-base-content rounded-md p-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </td>
                                                <td className="p-1">
                                                    <select
                                                      value={allergen.status}
                                                      onChange={(e) => handleAllergenChange(index, allergenIndex, 'status', e.target.value)}
                                                      className="w-full bg-base-100 text-base-content rounded-md p-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="ELIMINABLE">Eliminable</option>
                                                        <option value="NO ELIMINABLE">No Eliminable</option>
                                                        <option value="SUSTITUIBLE">Sustituible</option>
                                                    </select>
                                                </td>
                                                <td className="p-1">
                                                  <textarea
                                                    value={allergen.justification}
                                                    onChange={(e) => handleAllergenChange(index, allergenIndex, 'justification', e.target.value)}
                                                    className="w-full bg-base-100 text-base-content rounded-md p-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                                    rows={1}
                                                  />
                                                </td>
                                                <td className="p-1 text-center">
                                                    <button onClick={() => handleRemoveAllergen(index, allergenIndex)} className="btn btn-xs btn-square btn-error opacity-70 hover:opacity-100" aria-label="Eliminar alérgeno">
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={4} className="p-1 text-center border-t border-base-300">
                                                <button onClick={() => handleAddAllergen(index)} className="btn btn-xs btn-outline btn-primary">
                                                    + Añadir Alérgeno
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col">
                        <input
                          type="text"
                          value={dish.dishName}
                          onChange={(e) => {
                              const newReport = [...editableReport];
                              newReport[index].dishName = e.target.value;
                              setEditableReport(newReport);
                          }}
                          className="text-xl font-bold text-primary bg-transparent focus:outline-none w-full !mt-0 !mb-2 border-b-2 border-primary/20 pb-1"
                        />

                        {dish.imageUrl ? (
                            <img src={dish.imageUrl} alt={dish.dishName} className="w-full h-32 object-cover rounded-lg flex-shrink-0 my-2" />
                        ) : (
                            <div className="w-full h-32 bg-base-100 rounded-lg flex items-center justify-center text-xs text-base-content/50 flex-shrink-0 my-2">Sin Imagen</div>
                        )}
                        
                        <div className="mt-2 flex-grow flex flex-col">
                            <label className="block text-xs font-bold text-base-content/90 mb-1">Lista de Ingredientes</label>
                            <textarea
                                value={dish.ingredients.join('\n')}
                                onChange={(e) => handleIngredientsChange(index, e.target.value)}
                                className="w-full bg-base-100 text-base-content rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-y flex-grow"
                            />
                        </div>
                    </div>
                </div>
            ))}
            {editableReport.length === 0 && (
                <div className="text-center p-8 text-base-content/70">
                    <p>El informe generado aparecerá aquí.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

interface MenuViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onSelectRecipe: (recipe: Recipe) => void;
  addOrUpdateRecipe: (recipe: Recipe) => void;
  menuItems: { [key: string]: string[] };
  setMenuItems: React.Dispatch<React.SetStateAction<{ [key: string]: string[] }>>;
  settings: Settings;
  categories: string[];
}

export const MenuView: React.FC<MenuViewProps> = ({ recipes, ingredients, onSelectRecipe, addOrUpdateRecipe, menuItems, setMenuItems, settings, categories }) => {
  const [localMenuItems, setLocalMenuItems] = useState(menuItems);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});
  
  const [aiSuggestions, setAiSuggestions] = useState<MenuSuggestions | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [isGeneratingEscandallos, setIsGeneratingEscandallos] = useState(false);
  const [isMenuPreviewOpen, setIsMenuPreviewOpen] = useState(false);
  const [recipesForPreview, setRecipesForPreview] = useState<{ [category: string]: Recipe[] }>({});

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [serviceReport, setServiceReport] = useState<ServiceReportData[] | null>(null);

  // State for recipe selector modal (mobile)
  const [isRecipeSelectorOpen, setIsRecipeSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<{ category: string } | null>(null);
  const [selectorCategory, setSelectorCategory] = useState<string | null>(null);

  // State for popover (desktop)
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [popoverCategory, setPopoverCategory] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const newMenuItems = JSON.parse(JSON.stringify(menuItems));
    let needsUpdate = false;
    for (const category in newMenuItems) {
        const items = newMenuItems[category];
        if (!Array.isArray(items) || items.length === 0 || items[items.length - 1] !== '') {
            newMenuItems[category] = Array.isArray(items) ? [...items, ''] : [''];
            needsUpdate = true;
        }
    }
    if (needsUpdate) {
        setMenuItems(newMenuItems);
    }
    setLocalMenuItems(newMenuItems);
  }, [menuItems, setMenuItems]);
  
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


  const handleCloseSelector = () => {
    setIsRecipeSelectorOpen(false);
    setSelectorTarget(null);
    setSelectorCategory(null);
  };

  const toggleCategoryCollapse = (categoryName: string) => {
    setCollapsedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };
  
  const handlePopoverToggle = (categoryName: string) => {
    if (activePopover === categoryName) {
        setActivePopover(null);
        setPopoverCategory(null);
    } else {
        setActivePopover(categoryName);
        setPopoverCategory(null); // Reset sub-category selection
    }
  };


  const handleCreateRecipe = async (recipeName: string, category: string, index: number) => {
    const loadingKey = `${category}-${index}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
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
            coefficient: settings.defaultCoefficient, 
            pvp: 0, 
            taxRate: settings.defaultTaxRate, 
            portionSize: 250,
        };
        addOrUpdateRecipe(newRecipe);
        handleSelectChange(category, index, newRecipe.name);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to generate recipe:", errorMessage);
        alert(`Failed to generate recipe for "${recipeName}": ${errorMessage}`);
    } finally {
        setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const updateMenuItemsState = (newItems: { [key: string]: string[] }) => {
    setLocalMenuItems(newItems);
    setMenuItems(newItems);
  };
  
  const handleSelectChange = (category: string, index: number, recipeName: string) => {
    const newItems = JSON.parse(JSON.stringify(localMenuItems));
    const itemsInCategory = newItems[category];
    
    const originalLength = itemsInCategory.length;
    itemsInCategory[index] = recipeName;

    if (recipeName.trim() === '') {
        const lastIndex = itemsInCategory.length - 1;
        if (lastIndex > 0 && itemsInCategory[lastIndex] === '' && itemsInCategory[lastIndex - 1] === '') {
            itemsInCategory.pop();
        }
    } else {
        if (index === originalLength - 1) {
            itemsInCategory.push('');
        }
    }
    
    updateMenuItemsState(newItems);
  };
  
  const addExistingRecipeToCategory = (category: string, recipeName: string) => {
    const newItems = { ...localMenuItems };
    const items = newItems[category];
    const firstEmptyIndex = items.findIndex(item => item === '');

    if (firstEmptyIndex !== -1) {
        items[firstEmptyIndex] = recipeName;
    } else {
        items.push(recipeName);
    }

    if (items[items.length - 1] !== '') {
        items.push('');
    }

    updateMenuItemsState(newItems);
  };

  const handleGenerateSuggestions = async () => {
    setIsSuggesting(true);
    setAiSuggestions(null);
    try {
        const suggestions = await generateMenuSuggestions(settings, new Date());
        setAiSuggestions(suggestions);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to generate menu suggestions:", errorMessage);
        alert(`Fallo al generar sugerencias: ${errorMessage}`);
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleClearSuggestions = () => {
    setAiSuggestions(null);
  };

  const handleSelectAndCreateFromSuggestion = async (category: string, index: number, recipeName: string) => {
    const loadingKey = `${category}-${index}`;
    if (loadingStates[loadingKey]) return;
    
    handleSelectChange(category, index, recipeName);
    await handleCreateRecipe(recipeName, category, index);

    setAiSuggestions(prev => {
        if (!prev) return null;
        const newSuggestions = JSON.parse(JSON.stringify(prev));
        const suggestionsForCategory = newSuggestions[category as keyof MenuSuggestions];
        if (Array.isArray(suggestionsForCategory)) {
            const suggestionIndex = suggestionsForCategory.indexOf(recipeName);
            if (suggestionIndex > -1) {
                suggestionsForCategory.splice(suggestionIndex, 1);
            }
        }
        return newSuggestions;
    });
  };
  
  const handleAddSuggestionToMenu = (category: string, recipeName: string) => {
    const itemsInCategory = localMenuItems[category];
    if (!Array.isArray(itemsInCategory)) return;
    
    const index = itemsInCategory.findIndex(item => item.trim() === '');
    
    if (index === -1) {
      alert(`No hay un espacio vacío en "${category}" para añadir la sugerencia. Por favor, borra un plato para hacer espacio.`);
      return;
    }

    handleSelectAndCreateFromSuggestion(category, index, recipeName);
  };

  const handleOpenPreview = async () => {
    setIsPreparingPreview(true);
    try {
        const recipesOnMenu: Recipe[] = [];
        const recipesToUpdate: Recipe[] = [];

        Object.values(localMenuItems).flat().filter(Boolean).forEach(name => {
            const recipe = recipes.find(r => r.name === name);
            if (recipe && !recipesOnMenu.some(r => r.id === recipe.id)) {
                recipesOnMenu.push({ ...recipe });
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
                    const index = recipesOnMenu.findIndex(r => r.id === updatedRecipe.id);
                    if (index !== -1) recipesOnMenu[index] = updatedRecipe;
                }
            });
        }
        
        const groupedByMenuCategory: { [category: string]: Recipe[] } = {};
        Object.entries(localMenuItems).forEach(([category, names]) => {
            if (Array.isArray(names)) {
                const categoryRecipes = names.map(name => recipesOnMenu.find(r => r.name === name)).filter((r): r is Recipe => !!r);
                if (categoryRecipes.length > 0) {
                    groupedByMenuCategory[category] = categoryRecipes;
                }
            }
        });
        
        if (Object.keys(groupedByMenuCategory).length === 0) {
            alert("No hay recetas en la carta.");
            return;
        }

        setRecipesForPreview(groupedByMenuCategory);
        setIsMenuPreviewOpen(true);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Failed to prepare menu preview:", errorMessage);
        alert(`Error al preparar la carta: ${errorMessage}`);
    } finally {
        setIsPreparingPreview(false);
    }
  };

  const handleGenerateAllEscandallos = async () => {
      setIsGeneratingEscandallos(true);
      try {
          const uniqueRecipeNames = [...new Set(Object.values(localMenuItems).flat().filter(Boolean))];
          const recipesOnMenu = uniqueRecipeNames
              .map(name => recipes.find(r => r.name === name))
              .filter((r): r is Recipe => r !== undefined);

          if (recipesOnMenu.length === 0) {
              alert("No hay recetas en la carta para exportar.");
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
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.error("Failed to generate escandallos PDF:", errorMessage);
          alert(`Error al generar el PDF de escandallos: ${errorMessage}`);
      } finally {
          setIsGeneratingEscandallos(false);
      }
  };

  const handleGenerateServiceReport = async () => {
    setIsGeneratingReport(true);
    try {
      const uniqueRecipeNames = [...new Set(Object.values(localMenuItems).flat().filter(Boolean))];
      const recipesOnMenu = uniqueRecipeNames
          .map(name => recipes.find(r => r.name === name))
          .filter((r): r is Recipe => r !== undefined);

      if (recipesOnMenu.length === 0) {
          alert("No hay recetas en la carta para generar el informe.");
          return;
      }

      const report = await generateServiceReport(recipesOnMenu, settings);
      
      const enrichedReport = report.map(dishReport => {
          const recipe = recipesOnMenu.find(r => r.name === dishReport.dishName);
          if (!recipe) return { ...dishReport, ingredients: [], imageUrl: '' };

          const ingredientNames = recipe.ingredients.map(recipeIng => {
              const ingDetails = ingredients.find(i => i.id === recipeIng.ingredientId || i.name.toLowerCase() === recipeIng.ingredientId.toLowerCase());
              return ingDetails ? ingDetails.name : recipeIng.ingredientId;
          });

          return { ...dishReport, ingredients: ingredientNames, imageUrl: recipe.imageUrl || '' };
      });
      
      setServiceReport(enrichedReport as ServiceReportData[]);
      setIsReportModalOpen(true);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Failed to generate service report:", errorMessage);
      alert(`Error al generar el informe: ${errorMessage}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };


  // Render function for a recipe input slot
  const renderRecipeSlot = (recipeName: string, category: string, index: number) => {
      const recipe = recipes.find(r => r.name === recipeName);
      const isLoading = loadingStates[`${category}-${index}`];
      const hasName = recipeName && recipeName.trim() !== '';

      return (
          <div key={index} className="relative group flex items-center space-x-2">
              <div
                  className={`flex-grow ${recipe ? 'cursor-pointer' : ''}`}
                  onClick={() => recipe && onSelectRecipe(recipe)}
              >
                  <input
                      type="text"
                      value={recipeName}
                      onChange={(e) => handleSelectChange(category, index, e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && hasName && !recipe) {
                              e.preventDefault();
                              handleCreateRecipe(recipeName, category, index);
                          }
                      }}
                      placeholder="Nombre de la Receta..."
                      className={`w-full bg-base-300 text-base-content rounded-md p-3 md:p-2 focus:outline-none focus:ring-2 focus:ring-primary ${recipe ? 'cursor-pointer' : ''}`}
                  />
              </div>

              <div className="flex-shrink-0 flex items-center space-x-1">
                  {hasName && !recipe && (
                      <button onClick={(e) => { e.stopPropagation(); handleCreateRecipe(recipeName, category, index); }} disabled={isLoading} className="p-1 text-primary hover:text-primary-focus disabled:text-base-content/50 transition-colors" aria-label="Crear receta con IA">
                          {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div> : <AiIcon className="h-5 w-5" />}
                      </button>
                  )}
                  {hasName && recipe && <button onClick={(e) => { e.stopPropagation(); handleSelectChange(category, index, ''); }} className="btn btn-sm btn-square bg-red-600 hover:bg-red-700 text-white opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity" aria-label="Quitar plato"><TrashIcon /></button>}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto px-4 md:px-0">
        <div className="bg-base-200 p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-base-content">Diseño de Carta</h2>
                <div className="flex items-center space-x-2">
                    <div className="relative group">
                        {aiSuggestions ? (
                            <button onClick={handleClearSuggestions} className="btn btn-circle bg-red-600 hover:bg-red-700 text-white" aria-label="Limpiar sugerencias"><ClearIcon /></button>
                        ) : (
                            <button onClick={handleGenerateSuggestions} disabled={isSuggesting} className="p-2 text-primary hover:text-primary-focus disabled:text-base-content/50 transition-colors" aria-label="Generar sugerencias con IA">{isSuggesting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div> : <SparklesIcon className="h-6 w-6" />}</button>
                        )}
                        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-64 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{aiSuggestions ? 'Limpiar sugerencias' : 'Generar ideas de platos con IA'}</div>
                    </div>
                    <div className="relative group">
                        <button onClick={handleOpenPreview} disabled={isPreparingPreview} className="btn btn-secondary btn-circle" aria-label="Previsualizar carta">{isPreparingPreview ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div> : <PrintMenuIcon />}</button>
                        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-48 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Previsualizar y Exportar Carta</div>
                    </div>
                    <div className="relative group">
                        <button onClick={handleGenerateAllEscandallos} disabled={isGeneratingEscandallos} className="btn btn-secondary btn-circle" aria-label="Exportar escandallos">{isGeneratingEscandallos ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div> : <PrintEscandalloIcon />}</button>
                        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-60 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Exportar TODOS los Escandallos de la Carta</div>
                    </div>
                    <div className="relative group">
                        <button onClick={handleGenerateServiceReport} disabled={isGeneratingReport} className="btn btn-secondary btn-circle" aria-label="Generar informe para servicio">
                            {isGeneratingReport ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div> : <InfoForServiceIcon />}
                        </button>
                        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-60 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Generar Informe para Camareros (Alergias, FAQs)
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-6">
            {Object.entries(localMenuItems).map(([category, items]) => (
                <div key={category} className="bg-base-200 p-4 md:p-3 rounded-xl shadow-lg flex flex-col relative">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold text-primary">{category}</h3>
                            <div className="hidden md:block">
                                <button onClick={() => handlePopoverToggle(category)} className="text-blue-500 hover:text-blue-400 transition-colors" aria-label="Añadir receta existente">
                                    <PlusIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="block md:hidden">
                                <button onClick={() => {
                                    setSelectorTarget({ category });
                                    setIsRecipeSelectorOpen(true);
                                }} className="text-blue-500 hover:text-blue-400 transition-colors" aria-label="Añadir receta existente">
                                    <PlusIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => toggleCategoryCollapse(category)} className="btn btn-sm btn-square btn-ghost text-white" aria-expanded={!collapsedCategories[category]}>
                                {collapsedCategories[category] ? <PlusIcon className="h-5 w-5" /> : <MinusIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <div className={`flex-grow space-y-3 ${collapsedCategories[category] ? 'hidden md:block' : ''}`}>
                        {Array.isArray(items) && items.map((recipeName, index) => renderRecipeSlot(recipeName, category, index))}
                    </div>

                    {aiSuggestions?.[category as keyof MenuSuggestions] && aiSuggestions[category as keyof MenuSuggestions].length > 0 && (
                        <div className={`mt-4 border-t-2 border-primary/20 pt-3 ${collapsedCategories[category] ? 'hidden md:block' : ''}`}>
                            <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                <SparklesIcon className="h-4 w-4" />
                                Sugerencias de la IA
                            </h4>
                            <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">
                                {aiSuggestions[category as keyof MenuSuggestions].map((suggestion, sugIndex) => (
                                    <li key={sugIndex}>
                                        <button
                                            onClick={() => handleAddSuggestionToMenu(category, suggestion)}
                                            className="w-full text-left p-2 text-sm bg-base-300 hover:bg-primary/20 rounded-md transition-colors truncate"
                                            title={suggestion}
                                        >
                                            + {suggestion}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Popover for desktop */}
                    {activePopover === category && (
                        <div ref={popoverRef} className="absolute top-14 left-4 mt-1 w-72 bg-base-100 rounded-lg shadow-xl z-20 p-2 text-sm">
                            {!popoverCategory ? (
                                <>
                                    <h4 className="font-bold mb-1 px-2 text-base-content">Seleccionar Categoría</h4>
                                    <ul className="max-h-48 overflow-y-auto">
                                        {categories.map(cat => (
                                            <li key={cat} onClick={() => setPopoverCategory(cat)} className="cursor-pointer p-2 hover:bg-primary/20 rounded-md flex justify-between items-center">
                                                <span>{cat}</span>
                                                <span className="text-lg">&rarr;</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <div>
                                    <button onClick={() => setPopoverCategory(null)} className="font-bold mb-1 p-2 hover:bg-primary/20 rounded-md w-full text-left flex items-center gap-2">
                                        <span className="text-lg">&larr;</span> {popoverCategory}
                                    </button>
                                    <ul className="max-h-40 overflow-y-auto">
                                        {recipes.filter(r => r.category === popoverCategory).map(recipe => (
                                            <li key={recipe.id} onClick={() => {
                                                addExistingRecipeToCategory(category, recipe.name);
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
            ))}
        </div>

        {/* Recipe Selector Modal for Mobile */}
        {isRecipeSelectorOpen && selectorTarget && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={handleCloseSelector}>
                <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <header className="p-4 border-b border-base-300 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-base-content">
                            {selectorCategory ? `Seleccionar Receta en "${selectorCategory}"` : 'Seleccionar Categoría'}
                        </h3>
                        <button onClick={handleCloseSelector} className="text-base-content/70 hover:text-base-content text-3xl">&times;</button>
                    </header>
                    <div className="p-4 overflow-y-auto">
                        {!selectorCategory ? (
                            <ul className="space-y-2">
                                {categories.map(cat => (
                                    <li key={cat}>
                                        <button onClick={() => setSelectorCategory(cat)} className="w-full text-left p-3 bg-base-300 hover:bg-primary/20 rounded-md transition-colors">
                                            {cat}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>
                                <button onClick={() => setSelectorCategory(null)} className="btn btn-sm btn-ghost mb-4">&larr; Volver a Categorías</button>
                                <ul className="space-y-2">
                                    {recipes.filter(r => r.category === selectorCategory).map(recipe => (
                                        <li key={recipe.id}>
                                            <button onClick={() => {
                                                addExistingRecipeToCategory(selectorTarget.category, recipe.name);
                                                handleCloseSelector();
                                            }} className="w-full text-left p-3 bg-base-300 hover:bg-primary/20 rounded-md transition-colors">
                                                {recipe.name}
                                            </button>
                                        </li>
                                    ))}
                                    {recipes.filter(r => r.category === selectorCategory).length === 0 && (
                                        <li className="p-3 text-base-content/70">No hay recetas en esta categoría.</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <MenuPreviewModal
            isOpen={isMenuPreviewOpen}
            onClose={() => setIsMenuPreviewOpen(false)}
            menuData={recipesForPreview}
            settings={settings}
            onUpdateRecipe={addOrUpdateRecipe}
            title="Carta del Restaurante"
        />

        <ServiceReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            reportData={serviceReport}
            settings={settings}
        />
    </div>
  );
};
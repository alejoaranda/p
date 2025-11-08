import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, IngredientUnit, InvoiceProcessingResult, Settings } from '../../types';
import { SparklesIcon, PlusIcon, TrashIcon } from '../icons';
import { processInvoiceWithGemini } from '../../services/geminiService';
import { getCurrencySymbol } from '../../services/currencyService';

interface IngredientsViewProps {
  ingredients: Ingredient[];
  onUpdateIngredient: (ingredient: Ingredient) => void;
  onBatchUpdateIngredients: (data: InvoiceProcessingResult) => string[];
  onAddIngredient: () => void;
  onRemoveIngredient: (ingredientId: string) => void;
  settings: Settings;
}

export const IngredientsView: React.FC<IngredientsViewProps> = ({ ingredients, onUpdateIngredient, onBatchUpdateIngredients, onAddIngredient, onRemoveIngredient, settings }) => {
  const [editableIngredients, setEditableIngredients] = useState<Ingredient[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedIngredients, setHighlightedIngredients] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  useEffect(() => {
    // Deep copy to prevent unintended mutations
    setEditableIngredients(JSON.parse(JSON.stringify(ingredients)));
  }, [ingredients]);

  const handleInputChange = (id: string, field: keyof Ingredient, value: string | number) => {
    setEditableIngredients(currentIngredients =>
      currentIngredients.map(ing =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const handleQuantityChange = (id: string, value: string) => {
    setQuantities(prev => ({...prev, [id]: value}));
  };

  const handleBlur = (id: string) => {
    const updatedIngredient = editableIngredients.find(ing => ing.id === id);
    if (updatedIngredient) {
      onUpdateIngredient(updatedIngredient);
    }
  };

  const processImage = async (base64String: string, mimeType: string) => {
    setIsProcessing(true);
    setHighlightedIngredients(new Set());
    try {
      if (!base64String) {
        throw new Error("Could not read file or capture image.");
      }
      const result = await processInvoiceWithGemini(base64String, mimeType, ingredients);
      const modifiedIds = onBatchUpdateIngredients(result);
      setHighlightedIngredients(new Set(modifiedIds));
      alert('¡Factura procesada! Los ingredientes han sido actualizados.');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error processing invoice:", errorMessage);
      alert(`Error procesando la factura: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      await processImage(base64String, file.type);
      if(event.target) event.target.value = ''; // Reset file input
    };
    reader.onerror = () => {
        alert('Error al leer el archivo.');
        if(event.target) event.target.value = '';
    };
    reader.readAsDataURL(file);
  };
  
  const handleInvoiceUploadClick = () => {
    if (window.innerWidth < 768) { // Simple check for mobile/tablet
      setIsChoiceModalOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleAttachFileClick = () => {
    setIsChoiceModalOpen(false);
    fileInputRef.current?.click();
  };
  
  const handleTakePhotoClick = () => {
    setIsChoiceModalOpen(false);
    cameraInputRef.current?.click();
  };
  
  const inputStyles = "bg-base-200 w-full focus:outline-none focus:bg-base-300 rounded px-1 py-0.5 transition-colors text-xs md:text-sm";
  const numInputStyles = `${inputStyles} text-right`;
  const currencySymbol = getCurrencySymbol(settings.currency);

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-lg h-full flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, image/webp"
        disabled={isProcessing}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment"
        disabled={isProcessing}
      />

      {isChoiceModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setIsChoiceModalOpen(false)}>
          <div className="bg-base-200 rounded-lg shadow-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">Añadir Factura</h3>
            <button onClick={handleAttachFileClick} className="btn w-full btn-primary">Adjuntar Archivo</button>
            <button onClick={handleTakePhotoClick} className="btn w-full btn-secondary">Tomar Foto</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Ingredientes</h2>
        </div>
        <div className="flex items-center space-x-2">
            <div className="relative group">
                <button 
                    onClick={handleInvoiceUploadClick}
                    disabled={isProcessing}
                    className="p-2 text-primary hover:text-primary-focus disabled:text-base-content/50 transition-colors"
                    aria-label="Procesar factura con IA"
                >
                    {isProcessing ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div> : <SparklesIcon className="h-6 w-6" />}
                </button>
                <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-64 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {isProcessing ? 'Procesando factura...' : 'Actualizar precios desde una factura con IA'}
                </div>
            </div>
            <div className="relative group">
                <button
                    onClick={onAddIngredient}
                    className="btn btn-circle bg-orange-500 hover:bg-orange-600 text-white"
                    aria-label="Añadir Ingrediente"
                >
                    <PlusIcon />
                </button>
                <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 w-48 bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Añadir nuevo ingrediente
                </div>
            </div>
        </div>
      </div>
      <div className="overflow-auto flex-grow -mx-4 md:mx-0">
        <table className="w-full text-left table-fixed text-xs md:text-sm">
          <thead>
            <tr className="bg-base-300">
              <th className="py-1 pl-1 md:p-3 font-semibold w-[30%] md:w-1/4">
                <span className="md:hidden text-xs leading-tight">Ingrediente</span>
                <span className="hidden md:inline">Ingrediente</span>
              </th>
              <th className="p-1 md:p-3 font-semibold text-center w-[12%] md:w-auto">
                <span className="md:hidden text-xs leading-tight">Cant.</span>
                <span className="hidden md:inline">Cantidad</span>
              </th>
              <th className="p-1 md:p-3 font-semibold text-center w-[10%] md:w-auto">
                <span className="md:hidden text-xs leading-tight">Ud.</span>
                <span className="hidden md:inline">Unidad</span>
              </th>
              <th className="p-1 md:p-3 font-semibold text-right w-[15%] md:w-auto">
                <span className="md:hidden text-xs leading-tight">P.<br/>Bruto</span>
                <span className="hidden md:inline">P. Bruto</span>
              </th>
              <th className="p-1 md:p-3 font-semibold text-right w-[12%] md:w-auto">
                <span className="md:hidden text-xs leading-tight">Merma<br/>%</span>
                <span className="hidden md:inline">Merma %</span>
              </th>
              <th className="hidden md:table-cell p-2 md:p-3 font-semibold text-right">Merma {currencySymbol}</th>
              <th className="hidden md:table-cell p-2 md:p-3 font-semibold text-right">P. Neto</th>
              <th className="py-1 pr-1 md:p-3 font-semibold text-right w-[16%] md:w-auto">
                 <span className="md:hidden text-xs leading-tight">P.<br/>Total</span>
                <span className="hidden md:inline">P. Total</span>
              </th>
              <th className="hidden md:table-cell p-2 md:p-3 font-semibold md:w-1/4">Proveedor</th>
              <th className="p-1 md:p-3 font-semibold text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {editableIngredients.map((ingredient) => {
              const quantity = parseFloat(quantities[ingredient.id] || '1') || 0;
              const grossPrice = ingredient.price || 0;
              const waste = (ingredient.wastePercentage || 0) / 100;
              
              const netPricePerUnit = waste < 1 ? grossPrice / (1 - waste) : Infinity;
              const wasteValue = (netPricePerUnit - grossPrice) * quantity;
              const totalPrice = netPricePerUnit * quantity;
              const isHighlighted = highlightedIngredients.has(ingredient.id);

              return (
                <tr 
                  key={ingredient.id} 
                  className={`border-b border-base-300 hover:bg-base-300/50 transition-colors duration-500 group ${isHighlighted ? 'bg-green-500/20' : ''}`}
                >
                  <td className="py-0.5 px-1 md:p-1 font-medium">
                    <input 
                        type="text" 
                        value={ingredient.name} 
                        onChange={(e) => handleInputChange(ingredient.id, 'name', e.target.value)} 
                        onBlur={() => handleBlur(ingredient.id)} 
                        className="bg-base-200 w-full focus:outline-none focus:bg-base-300 rounded px-1 py-0.5 transition-colors text-xs md:text-sm"
                    />
                  </td>
                  <td className="p-0.5 md:p-1">
                     <input type="number" value={quantities[ingredient.id] ?? '1'} onChange={(e) => handleQuantityChange(ingredient.id, e.target.value)} className={`${numInputStyles} font-bold`}/>
                  </td>
                  <td className="p-0.5 md:p-1">
                    <select value={ingredient.unit} onChange={(e) => handleInputChange(ingredient.id, 'unit', e.target.value as IngredientUnit)} onBlur={() => handleBlur(ingredient.id)} className={`${inputStyles} text-center`}>
                        <option value={IngredientUnit.KG}>kg</option>
                        <option value={IngredientUnit.L}>l</option>
                        <option value={IngredientUnit.PZ}>pz</option>
                    </select>
                  </td>
                  <td className="p-0.5 md:p-1">
                     <input 
                        type="number" 
                        step="0.01" 
                        value={ingredient.price} 
                        onChange={(e) => {
                            const displayValue = parseFloat(e.target.value.replace(',', '.')) || 0;
                            handleInputChange(ingredient.id, 'price', displayValue);
                        }} 
                        onBlur={() => handleBlur(ingredient.id)} 
                        className={numInputStyles}
                     />
                  </td>
                  <td className="p-0.5 md:p-1">
                     <input type="number" value={ingredient.wastePercentage} onChange={(e) => handleInputChange(ingredient.id, 'wastePercentage', parseInt(e.target.value) || 0)} onBlur={() => handleBlur(ingredient.id)} className={numInputStyles}/>
                  </td>
                  <td className="p-2 text-right text-base-content/70 hidden md:table-cell">{isFinite(wasteValue) ? wasteValue.toFixed(2) + currencySymbol : 'N/A'}</td>
                  <td className="p-2 text-right text-base-content/70 hidden md:table-cell">{isFinite(netPricePerUnit) ? netPricePerUnit.toFixed(2) + currencySymbol : 'N/A'}</td>
                  <td className="py-0.5 pr-1 md:p-2 text-right font-bold text-primary">{isFinite(totalPrice) ? totalPrice.toFixed(2) + currencySymbol : 'N/A'}</td>
                  <td className="p-1 hidden md:table-cell">
                    <input type="text" value={ingredient.supplier} onChange={(e) => handleInputChange(ingredient.id, 'supplier', e.target.value)} onBlur={() => handleBlur(ingredient.id)} className={inputStyles} placeholder="Proveedor..."/>
                  </td>
                  <td className="p-1 text-center">
                    <button
                        onClick={() => onRemoveIngredient(ingredient.id)}
                        className="btn btn-xs btn-square btn-error opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Eliminar ${ingredient.name}`}
                    >
                        <TrashIcon />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient, Settings, ReportType } from '../types';
import { getCurrencySymbol } from '../services/currencyService';
import { 
    generateCostDeviationReport,
    generateMenuEngineeringReport,
    generatePredictiveInventoryReport,
    generateLaborCostReport,
    generateExecutiveSummaryReport
} from '../services/geminiService';

interface ReportModalProps {
  reportType: ReportType;
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  ingredients: Ingredient[];
  settings: Settings;
}

const reportDetails: { [key in ReportType]: { title: string; description: string } } = {
  COST_DEVIATION: {
    title: 'Informe de Desviación de Costes',
    description: 'Introduce los datos de inventario y ventas para comparar el coste real con el teórico.',
  },
  MENU_ENGINEERING: {
    title: 'Ingeniería de Menú Inteligente',
    description: 'Introduce el número de unidades vendidas de cada plato para analizar su rentabilidad y popularidad.',
  },
  PREDICTIVE_INVENTORY: {
    title: 'Inventario Predictivo y Alerta de Mermas',
    description: 'Proporciona datos de consumo para que la IA prediga necesidades futuras y detecte posibles mermas.',
  },
  LABOR_COST: {
    title: 'Informe de Eficiencia y Coste Laboral',
    description: 'Calcula el porcentaje del coste de personal sobre las ventas para evaluar la eficiencia operativa.',
  },
  EXECUTIVE_SUMMARY: {
    title: 'Resumen Ejecutivo (El Pulso del Negocio)',
    description: 'Introduce los datos clave del periodo para obtener un resumen financiero completo.',
  },
};

export const ReportModal: React.FC<ReportModalProps> = ({ reportType, isOpen, onClose, recipes, ingredients, settings }) => {
    const [view, setView] = useState<'form' | 'result'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [reportResult, setReportResult] = useState('');
    const [formData, setFormData] = useState<any>({});
    
    const currencySymbol = getCurrencySymbol(settings.currency);

    const getInitialFormData = (type: ReportType) => {
        const today = new Date().toISOString().split('T')[0];
        const common = { startDate: today, endDate: today };
        switch (type) {
            case 'COST_DEVIATION':
                return { 
                    ...common,
                    dishes: recipes.map(r => ({ id: r.id, name: r.name, sold: 0 })),
                    openingInventory: 0,
                    purchases: 0,
                    closingInventory: 0
                };
            case 'MENU_ENGINEERING':
                return {
                    ...common,
                    dishes: recipes.map(r => ({ id: r.id, name: r.name, sold: 0 })),
                };
            case 'LABOR_COST':
                return { ...common, totalSales: 0, laborCost: 0 };
            case 'EXECUTIVE_SUMMARY':
                return { ...common, totalSales: 0, foodCost: 0, laborCost: 0, otherCosts: 0, customers: 0 };
            case 'PREDICTIVE_INVENTORY':
                 return {
                    period: 'Últimas 4 semanas',
                    totalSales: 0,
                    ingredients: ingredients.slice(0, 10).map(i => ({ name: i.name, startStock: 0, purchases: 0, endStock: 0 })),
                    forecast: ''
                };
            default: return {};
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData(reportType));
            setView('form');
            setReportResult('');
        }
    }, [isOpen, reportType, recipes]);

    const handleFormChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleDishChange = (index: number, value: number) => {
        const newDishes = [...formData.dishes];
        newDishes[index].sold = value;
        handleFormChange('dishes', newDishes);
    };
    
    const handleIngredientChange = (index: number, field: string, value: any) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index][field] = value;
        handleFormChange('ingredients', newIngredients);
    };

    const costPerServing = useMemo(() => {
        const costs: { [recipeId: string]: number } = {};
        recipes.forEach(recipe => {
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
            costs[recipe.id] = totalRecipeCost > 0 && recipe.servings > 0 ? totalRecipeCost / recipe.servings : 0;
        });
        return costs;
    }, [recipes, ingredients]);

    const handleSubmit = async () => {
        setIsLoading(true);
        setReportResult('');
        try {
            let result = '';
            switch (reportType) {
                case 'COST_DEVIATION':
                    const theoreticalCost = formData.dishes.reduce((acc: number, dish: any) => {
                        return acc + (costPerServing[dish.id] || 0) * dish.sold;
                    }, 0);
                    result = await generateCostDeviationReport({ ...formData, theoreticalCost }, settings);
                    break;
                case 'MENU_ENGINEERING':
                     const dishesWithCosts = formData.dishes.map((d: any) => ({
                        ...d,
                        cost: costPerServing[d.id] || 0,
                        pvp: recipes.find(r => r.id === d.id)?.pvp || 0
                    })).filter((d: any) => d.sold > 0);
                    result = await generateMenuEngineeringReport({ ...formData, dishes: dishesWithCosts }, settings);
                    break;
                case 'LABOR_COST':
                    result = await generateLaborCostReport(formData, settings);
                    break;
                case 'EXECUTIVE_SUMMARY':
                    result = await generateExecutiveSummaryReport(formData, settings);
                    break;
                case 'PREDICTIVE_INVENTORY':
                    result = await generatePredictiveInventoryReport(formData, settings);
                    break;
            }
            setReportResult(result);
            setView('result');
        } catch (error) {
            const message = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
            setReportResult(`Error al generar el informe:\n\n${message}`);
            setView('result');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderForm = () => {
        // ... (render form based on reportType)
        const commonDateFields = (
            <div className="grid grid-cols-2 gap-4 mb-4">
                <FormInput label="Fecha de Inicio" type="date" value={formData.startDate} onChange={e => handleFormChange('startDate', e.target.value)} />
                <FormInput label="Fecha de Fin" type="date" value={formData.endDate} onChange={e => handleFormChange('endDate', e.target.value)} />
            </div>
        );
        
        switch (reportType) {
            case 'COST_DEVIATION':
                return <>
                    {commonDateFields}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                         <FormInput label={`Inv. Inicial (${currencySymbol})`} type="number" value={formData.openingInventory} onChange={e => handleFormChange('openingInventory', parseFloat(e.target.value))} />
                         <FormInput label={`Compras (${currencySymbol})`} type="number" value={formData.purchases} onChange={e => handleFormChange('purchases', parseFloat(e.target.value))} />
                         <FormInput label={`Inv. Final (${currencySymbol})`} type="number" value={formData.closingInventory} onChange={e => handleFormChange('closingInventory', parseFloat(e.target.value))} />
                    </div>
                    <h4 className="font-semibold mb-2 text-base-content/90">Unidades Vendidas por Plato</h4>
                    <div className="max-h-60 overflow-y-auto bg-base-100 p-2 rounded-md border border-base-300">
                        {formData.dishes?.map((dish: any, index: number) => (
                            <div key={dish.id} className="grid grid-cols-3 gap-2 items-center mb-1">
                                <span className="truncate col-span-2 text-sm">{dish.name}</span>
                                <input type="number" value={dish.sold} onChange={e => handleDishChange(index, parseInt(e.target.value))} className="input input-sm bg-base-200" />
                            </div>
                        ))}
                    </div>
                </>;
            case 'MENU_ENGINEERING':
                return <>
                    {commonDateFields}
                     <h4 className="font-semibold mb-2 text-base-content/90">Unidades Vendidas por Plato</h4>
                    <div className="max-h-80 overflow-y-auto bg-base-100 p-2 rounded-md border border-base-300">
                        {formData.dishes?.map((dish: any, index: number) => (
                            <div key={dish.id} className="grid grid-cols-3 gap-2 items-center mb-1">
                                <span className="truncate col-span-2 text-sm">{dish.name}</span>
                                <input type="number" value={dish.sold} onChange={e => handleDishChange(index, parseInt(e.target.value))} className="input input-sm bg-base-200" />
                            </div>
                        ))}
                    </div>
                </>;
            case 'LABOR_COST':
                return <>
                    {commonDateFields}
                    <FormInput label={`Ventas Totales sin Imp. (${currencySymbol})`} type="number" value={formData.totalSales} onChange={e => handleFormChange('totalSales', parseFloat(e.target.value))} />
                    <FormInput label={`Coste Total de Personal (${currencySymbol})`} type="number" value={formData.laborCost} onChange={e => handleFormChange('laborCost', parseFloat(e.target.value))} />
                </>;
            case 'EXECUTIVE_SUMMARY':
                return <>
                    {commonDateFields}
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label={`Ventas Totales sin Imp. (${currencySymbol})`} type="number" value={formData.totalSales} onChange={e => handleFormChange('totalSales', parseFloat(e.target.value))} />
                        <FormInput label={`Coste de Comida (${currencySymbol})`} type="number" value={formData.foodCost} onChange={e => handleFormChange('foodCost', parseFloat(e.target.value))} />
                        <FormInput label={`Coste de Personal (${currencySymbol})`} type="number" value={formData.laborCost} onChange={e => handleFormChange('laborCost', parseFloat(e.target.value))} />
                        <FormInput label={`Otros Costes Op. (${currencySymbol})`} type="number" value={formData.otherCosts} onChange={e => handleFormChange('otherCosts', parseFloat(e.target.value))} />
                        <FormInput label="Nº de Clientes" type="number" value={formData.customers} onChange={e => handleFormChange('customers', parseInt(e.target.value))} />
                    </div>
                </>;
             case 'PREDICTIVE_INVENTORY':
                return <>
                    <FormInput label="Periodo a Analizar" type="text" value={formData.period} onChange={e => handleFormChange('period', e.target.value)} />
                    <FormInput label={`Ventas Totales del Periodo (${currencySymbol})`} type="number" value={formData.totalSales} onChange={e => handleFormChange('totalSales', parseFloat(e.target.value))} />
                    <h4 className="font-semibold my-2 text-base-content/90">Datos de Ingredientes Clave</h4>
                    <div className="max-h-60 overflow-y-auto bg-base-100 p-2 rounded-md border border-base-300 text-xs">
                        {formData.ingredients?.map((ing: any, index: number) => (
                             <div key={index} className="grid grid-cols-4 gap-2 items-center mb-1">
                                <span className="truncate">{ing.name}</span>
                                <input type="number" placeholder="Stock Ini." value={ing.startStock} onChange={e => handleIngredientChange(index, 'startStock', parseInt(e.target.value))} className="input input-xs bg-base-200" />
                                <input type="number" placeholder="Compras" value={ing.purchases} onChange={e => handleIngredientChange(index, 'purchases', parseInt(e.target.value))} className="input input-xs bg-base-200" />
                                <input type="number" placeholder="Stock Fin." value={ing.endStock} onChange={e => handleIngredientChange(index, 'endStock', parseInt(e.target.value))} className="input input-xs bg-base-200" />
                            </div>
                        ))}
                    </div>
                     <div className="mt-4">
                        <label className="block text-sm font-medium text-base-content/80 mb-1">Eventos o Cambios Esperados</label>
                        <textarea value={formData.forecast} onChange={e => handleFormChange('forecast', e.target.value)} className="textarea textarea-bordered w-full bg-base-200" placeholder="Ej: Próxima semana es festivo, esperamos un 20% más de clientes..."></textarea>
                    </div>
                </>;
            default: return <p>Este informe no está configurado.</p>;
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-base-300 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-base-content">{reportDetails[reportType].title}</h2>
                        {view === 'form' && <p className="text-sm text-base-content/70">{reportDetails[reportType].description}</p>}
                    </div>
                    <button onClick={onClose} className="text-base-content/70 hover:text-base-content text-3xl leading-none flex-shrink-0">&times;</button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                            <p className="text-base-content/80">La IA está generando tu informe...</p>
                        </div>
                    ) : view === 'form' ? (
                        <div className="space-y-4">
                            {renderForm()}
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm bg-base-100 p-4 rounded-md text-base-content">{reportResult}</pre>
                    )}
                </div>

                {!isLoading && (
                    <footer className="p-4 border-t border-base-300 flex justify-end space-x-4">
                        {view === 'form' ? (
                            <>
                                <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
                                <button onClick={handleSubmit} className="btn btn-primary">Generar Informe</button>
                            </>
                        ) : (
                             <>
                                <button onClick={() => setView('form')} className="btn btn-ghost">Volver</button>
                                <button onClick={() => window.print()} className="btn btn-secondary">Imprimir</button>
                            </>
                        )}
                    </footer>
                )}
            </div>
        </div>
    );
};

const FormInput: React.FC<{
    label: string;
    type?: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
}> = ({ label, type = 'text', value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-base-content/80 mb-1">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className="input input-bordered w-full bg-base-100"
            step={type === 'number' ? '0.01' : undefined}
        />
    </div>
);

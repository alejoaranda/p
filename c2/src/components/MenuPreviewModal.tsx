
import React, { useState, useEffect } from 'react';
import { Recipe, Settings } from '../types';
import { generateMenuHtml } from '../../services/printService';

interface MenuPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuData: { [category: string]: Recipe[] };
  settings: Settings;
  onUpdateRecipe: (recipe: Recipe) => void;
  title?: string;
  menuPrice?: number;
}

type Theme = 'light' | 'dark' | 'oceanic' | 'vintage';

export const MenuPreviewModal: React.FC<MenuPreviewModalProps> = ({ isOpen, onClose, menuData, settings, onUpdateRecipe, title, menuPrice }) => {
    const [editableMenuData, setEditableMenuData] = useState(menuData);
    const [previewTheme, setPreviewTheme] = useState<Theme>('light');

    useEffect(() => {
        setEditableMenuData(menuData);
    }, [menuData]);

    if (!isOpen) return null;

    const handleFieldChange = (categoryKey: string, recipeId: string, field: keyof Recipe, value: string | number) => {
        setEditableMenuData(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].map(recipe =>
                recipe.id === recipeId ? { ...recipe, [field]: value } : recipe
            )
        }));
    };

    const handleSave = (categoryKey: string, recipeId: string) => {
        const updatedRecipe = editableMenuData[categoryKey].find(r => r.id === recipeId);
        if (updatedRecipe) {
            onUpdateRecipe(updatedRecipe);
        }
    };

    const handlePrint = () => {
        const menuHtml = generateMenuHtml(editableMenuData, settings, previewTheme, title, menuPrice);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(menuHtml);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500); // Give browser time to render fonts
        } else {
            alert("No se pudo abrir la ventana de impresión. Revisa la configuración de tu navegador.");
        }
    };

    const allergenSymbols: { [key: string]: string } = {
        'Gluten': 'G', 'Crustáceos': 'Cr', 'Huevos': 'H', 'Pescado': 'P', 'Cacauetes': 'C', 'Soja': 'S', 'Lácteos': 'L',
        'Frutos de cáscara': 'Fc', 'Apio': 'A', 'Mostaza': 'M', 'Sésamo': 'Se', 'Sulfitos': 'Su', 'Altramuces': 'Al', 'Moluscos': 'Mo'
    };
    
     const themeClasses = {
        light: { bg: 'bg-[#F8F5F2]', text: 'text-[#2C2C2C]', title: 'text-[#1A1A1A]', accent: 'text-[#C0A062]', border: 'border-[#C0A062]', dots: 'border-gray-400', subtle: 'text-gray-500', inputBg: 'focus:bg-gray-200/50', tagBg: 'bg-gray-200', tagText: 'text-gray-600', tagBorder: 'border-gray-300', logoFilter: '' },
        dark: { bg: 'bg-[#222222]', text: 'text-[#EAEAEA]', title: 'text-white', accent: 'text-[#D4AF37]', border: 'border-[#D4AF37]', dots: 'border-gray-600', subtle: 'text-gray-400', inputBg: 'focus:bg-gray-800/50', tagBg: 'bg-gray-700', tagText: 'text-gray-200', tagBorder: 'border-gray-600', logoFilter: 'invert-[.9] saturate-[.5] hue-rotate-180' },
        oceanic: { bg: 'bg-[#0A2647]', text: 'text-[#E0F7FA]', title: 'text-white', accent: 'text-[#20B2AA]', border: 'border-[#20B2AA]', dots: 'border-[#144272]', subtle: 'text-[#ADD8E6]', inputBg: 'focus:bg-[#144272]/50', tagBg: 'bg-[#144272]', tagText: 'text-[#E0F7FA]', tagBorder: 'border-[#20B2AA]', logoFilter: 'invert-[.9] saturate-[.5] hue-rotate-180' },
        vintage: { bg: 'bg-[#FDF6E3]', text: 'text-[#583E23]', title: 'text-[#3D2B1F]', accent: 'text-[#9A3412]', border: 'border-[#9A3412]', dots: 'border-[#B4A082]', subtle: 'text-[#8C7853]', inputBg: 'focus:bg-[#EAE0C8]/50', tagBg: 'bg-[#EAE0C8]', tagText: 'text-[#583E23]', tagBorder: 'border-[#DCD0B3]', logoFilter: '' }
    };
    
    const theme = themeClasses[previewTheme];

    return (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center p-4 z-50 non-printable" onClick={onClose}>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;700&display=swap');
                .font-playfair { font-family: 'Playfair Display', serif; }
                .font-lato { font-family: 'Lato', sans-serif; }
                `}
            </style>
            <div className="bg-base-200 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col my-4" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-base-300 grid grid-cols-1 md:grid-cols-3 items-center gap-y-4">
                    <h2 className="text-xl font-bold text-base-content order-1 md:order-1 justify-self-center md:justify-self-start">{title || 'Previsualización de la Carta'}</h2>
                    
                    <div className="flex items-center justify-center space-x-2 order-3 md:order-2" title="Cambiar tema de la carta">
                        <button onClick={() => setPreviewTheme('light')} className={`w-6 h-6 rounded-full bg-white transition-all ${previewTheme === 'light' ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : 'opacity-50 hover:opacity-100'}`} aria-label="Tema claro" />
                        <button onClick={() => setPreviewTheme('dark')} className={`w-6 h-6 rounded-full bg-black border border-gray-500 transition-all ${previewTheme === 'dark' ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : 'opacity-50 hover:opacity-100'}`} aria-label="Tema oscuro" />
                        <button onClick={() => setPreviewTheme('oceanic')} className={`w-6 h-6 rounded-full bg-[#0A2647] border border-cyan-700 transition-all ${previewTheme === 'oceanic' ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : 'opacity-50 hover:opacity-100'}`} aria-label="Tema oceánico" />
                        <button onClick={() => setPreviewTheme('vintage')} className={`w-6 h-6 rounded-full bg-[#FDF6E3] border border-amber-950 transition-all ${previewTheme === 'vintage' ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : 'opacity-50 hover:opacity-100'}`} aria-label="Tema vintage" />
                    </div>

                    <div className="flex items-center space-x-4 order-2 md:order-3 justify-self-center md:justify-self-end">
                        <button onClick={handlePrint} className="btn btn-sm btn-primary">Crear PDF</button>
                        <button onClick={onClose} className="text-base-content/70 hover:text-base-content text-3xl leading-none flex-shrink-0" aria-label="Cerrar">&times;</button>
                    </div>
                </header>
                <div className="p-4 sm:p-8 bg-gray-400 dark:bg-gray-900 overflow-y-auto transition-colors">
                    <div className={`shadow-lg w-full max-w-[210mm] mx-auto font-lato transition-colors duration-300 ${theme.bg} ${theme.text} p-8 md:p-12`}>
                        {/* Header */}
                        <header className={`text-center mb-8 pb-4 ${theme.border} border-b`}>
                            {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className={`max-h-20 mx-auto mb-2 ${theme.logoFilter}`} />}
                            <h1 className={`font-playfair text-4xl ${theme.title}`}>{title || settings.restaurantName}</h1>
                        </header>
                        
                        {/* Menu Items */}
                        <main>
                            {menuPrice && menuPrice > 0 && (
                                <div className="text-center my-6 pb-4">
                                    <p className={`font-playfair text-2xl font-bold ${theme.accent}`}>
                                        Precio del Menú: {menuPrice.toFixed(2)}{settings.currency === 'EUR' ? '€' : settings.currency}
                                    </p>
                                </div>
                            )}
                            {Object.entries(editableMenuData).map(([category, recipes]) => {
                                if (!recipes || !Array.isArray(recipes) || recipes.length === 0) return null;
                                return (
                                <section key={category}>
                                    <h2 className={`font-playfair text-3xl font-bold text-center my-10 tracking-widest uppercase flex items-center justify-center ${theme.accent}`}>
                                      <span>{category}</span>
                                    </h2>
                                    <div className="space-y-6">
                                        {recipes.map(recipe => (
                                            <div key={recipe.id} className="group">
                                                <div className="flex items-baseline">
                                                    <input 
                                                        type="text"
                                                        value={recipe.name}
                                                        onChange={(e) => handleFieldChange(category, recipe.id, 'name', e.target.value)}
                                                        onBlur={() => handleSave(category, recipe.id)}
                                                        className={`font-lato text-lg font-bold bg-transparent focus:outline-none rounded px-1 w-full ${theme.text} ${theme.inputBg}`}
                                                    />
                                                    {(!menuPrice || menuPrice <= 0) && (
                                                        <>
                                                            <div className={`flex-grow border-b border-dotted mx-2 -translate-y-1 ${theme.dots}`}></div>
                                                            <div className="flex items-center">
                                                                <input 
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={recipe.pvp ?? ''}
                                                                    onChange={(e) => handleFieldChange(category, recipe.id, 'pvp', parseFloat(e.target.value) || 0)}
                                                                    onBlur={() => handleSave(category, recipe.id)}
                                                                    className={`font-lato text-lg font-bold w-20 text-right bg-transparent focus:outline-none rounded px-1 ${theme.text} ${theme.inputBg}`}
                                                                />
                                                                <span>{settings.currency === 'EUR' ? '€' : settings.currency}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <textarea
                                                    value={recipe.description || ''}
                                                    onChange={(e) => handleFieldChange(category, recipe.id, 'description', e.target.value)}
                                                    onBlur={() => handleSave(category, recipe.id)}
                                                    className={`font-lato text-sm font-light mt-1 pl-2 w-full bg-transparent focus:outline-none rounded px-1 resize-none ${theme.subtle} ${theme.inputBg}`}
                                                    rows={2}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                {(recipe.allergens || []).map(allergen => (
                                                    <div key={allergen} title={allergen} className={`text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center transition-colors ${theme.tagBg} ${theme.tagText} ${theme.tagBorder} border`}>
                                                        {allergenSymbols[allergen] || '?'}
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )})}
                        </main>
                        
                        {/* Footer */}
                         <footer className={`text-center mt-12 pt-4 border-t text-xs ${theme.subtle} ${theme.border}`}>
                            <h3 className={`font-playfair text-lg mb-2 ${theme.text}`}>Alérgenos</h3>
                             <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                                {Object.entries(allergenSymbols).map(([name, symbol]) => <span key={name}><b>{symbol}</b>: {name}</span>)}
                            </div>
                            <p className="mt-4">{settings.city}, ${settings.country}</p>
                            <p>IVA Incluido</p>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

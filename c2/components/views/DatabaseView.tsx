
import React, { useState } from 'react';
import { Recipe } from '../../types';
import { ViewIcon, TrashIcon, PlusIcon } from '../icons';

interface DatabaseViewProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onRemoveRecipe: (recipeId: string) => void;
  categories: string[];
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string, deleteRecipes: boolean) => void;
}

// Checkmark Icon for confirmation
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

// Close Icon for cancellation
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CategoryItem: React.FC<{
  category: string;
  onSelect: () => void;
  onRemove: () => void;
  isConfirming: boolean;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
}> = ({ category, onSelect, onRemove, isConfirming, onConfirmRemove, onCancelRemove }) => (
    <div className="relative group bg-base-300 rounded-lg shadow-md transition-all duration-300 hover:shadow-primary/30 hover:-translate-y-1">
        <button onClick={onSelect} className="w-full text-center p-6 text-lg font-semibold tracking-wider uppercase">
            {category}
        </button>
        <div className={`absolute top-2 right-2 flex items-center space-x-1 transition-opacity ${isConfirming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
             {isConfirming ? (
                <>
                    <span className="text-xs font-bold text-red-500 mr-1">Borrar?</span>
                    <button onClick={(e) => { e.stopPropagation(); onConfirmRemove(); }} className="btn btn-xs btn-square btn-success text-white" aria-label="Confirmar borrado"><CheckIcon /></button>
                    <button onClick={(e) => { e.stopPropagation(); onCancelRemove(); }} className="btn btn-xs btn-square btn-ghost" aria-label="Cancelar borrado"><CloseIcon /></button>
                </>
            ) : (
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="btn btn-xs btn-square bg-red-600 hover:bg-red-700 text-white" aria-label={`Borrar categoría ${category}`}><TrashIcon /></button>
            )}
        </div>
    </div>
);


export const DatabaseView: React.FC<DatabaseViewProps> = ({ 
    recipes, onSelectRecipe, onRemoveRecipe,
    categories, onAddCategory, onRemoveCategory
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [confirmingDeleteCategory, setConfirmingDeleteCategory] = useState<string | null>(null);

    const handleSaveNewCategory = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim());
        }
        setNewCategoryName('');
        setIsAddingCategory(false);
    };

    const handleCancelAddCategory = () => {
        setNewCategoryName('');
        setIsAddingCategory(false);
    };

    const handleRemoveCategoryRequest = (name: string) => {
        const recipesInCategory = recipes.filter(r => r.category === name);
        if (recipesInCategory.length > 0) {
            setConfirmingDeleteCategory(name);
        } else {
            onRemoveCategory(name, false);
        }
    };
    
    const handleConfirmRemove = (name: string) => {
        onRemoveCategory(name, true);
        setConfirmingDeleteCategory(null);
    };


    const filteredRecipes = selectedCategory ? recipes.filter(r => r.category === selectedCategory) : [];

    return (
        <div className="bg-base-200 p-4 rounded-xl shadow-lg h-full flex flex-col">
            {selectedCategory ? (
                <>
                    <div className="flex items-center mb-4 flex-shrink-0">
                        <button onClick={() => setSelectedCategory(null)} className="btn btn-sm bg-base-300 hover:bg-base-100 mr-4">
                            &larr; Volver al Índice
                        </button>
                        <h2 className="text-2xl font-bold text-base-content">Recetas de: {selectedCategory}</h2>
                    </div>
                    <div className="overflow-auto flex-grow">
                        <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="bg-base-300">
                            <th className="p-3 font-semibold w-2/5">Nombre Receta</th>
                            <th className="p-3 font-semibold w-2/5">Alérgenos</th>
                            <th className="p-3 font-semibold text-center w-1/5">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecipes.map((recipe) => (
                            <tr key={recipe.id} className="border-b border-base-300 hover:bg-base-300/50 transition-colors">
                                <td className="p-3 font-medium">{recipe.name}</td>
                                <td className="p-3">
                                    {recipe.allergens && recipe.allergens.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {recipe.allergens.map(allergen => (
                                                <span key={allergen} className="text-xs bg-red-600/80 text-white font-semibold px-2 py-1 rounded-full">
                                                    {allergen}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-base-content/60">Ninguno</span>
                                    )}
                                </td>
                                <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <button onClick={() => onSelectRecipe(recipe)} className="btn btn-sm bg-secondary text-white hover:bg-blue-600">
                                    <ViewIcon />
                                    <span className="hidden sm:inline ml-1">Ver</span>
                                    </button>
                                    <button 
                                    onClick={() => onRemoveRecipe(recipe.id)} 
                                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                                    aria-label={`Borrar receta ${recipe.name}`}
                                    >
                                    <TrashIcon />
                                    <span className="hidden sm:inline ml-1">Borrar</span>
                                    </button>
                                </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                        {filteredRecipes.length === 0 && (
                            <p className="text-center p-8 text-base-content/70">No hay recetas en esta categoría.</p>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="text-center bg-base-300 p-4 rounded-t-lg mb-6 shadow-md flex-shrink-0">
                        <h2 className="text-3xl font-bold text-base-content tracking-widest uppercase">ÍNDICE</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map(category => (
                                <CategoryItem 
                                    key={category}
                                    category={category}
                                    onSelect={() => {
                                        setSelectedCategory(category);
                                        setConfirmingDeleteCategory(null);
                                    }}
                                    onRemove={() => handleRemoveCategoryRequest(category)}
                                    isConfirming={confirmingDeleteCategory === category}
                                    onConfirmRemove={() => handleConfirmRemove(category)}
                                    onCancelRemove={() => setConfirmingDeleteCategory(null)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 flex-shrink-0">
                        {isAddingCategory ? (
                            <form onSubmit={handleSaveNewCategory} className="bg-base-300 p-3 rounded-lg flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Nombre de la nueva categoría..."
                                    className="w-full bg-base-100 text-base-content rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-sm btn-primary">Guardar</button>
                                <button type="button" onClick={handleCancelAddCategory} className="btn btn-sm btn-ghost">Cancelar</button>
                            </form>
                        ) : (
                            <button 
                                onClick={() => setIsAddingCategory(true)}
                                className="w-full btn bg-base-300 hover:bg-base-100 flex items-center justify-center transition-colors"
                            >
                                <PlusIcon />
                                <span className="ml-2">Añadir Nueva Categoría</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

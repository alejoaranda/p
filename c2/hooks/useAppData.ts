// FIX: Add React to import to make React namespace available for types
import React, { useState, useCallback, useMemo } from 'react';
import { Recipe, Ingredient, Employee, Shift, FullSchedule, PersonnelNeeds, SpecialEvent, Settings, IngredientUnit, InvoiceProcessingResult, RecordableItem, RecordItemType, AppccRecord } from '../types';

// --- MOCK DATA ---
const initialCategories: string[] = [
    'CALDOS', 'SOPAS', 'SALSAS', 'ENTRANTES', 'CARNES Y GUISOS', 'GUARNICIÓN',
    'ARROCES', 'PESCADOS Y MARISCOS', 'PASTAS', 'VEGETARIANO', 'VEGANO', 'POSTRES',
    'INFANTIL', 'DECORACIÓN DE PLATOS', 'MASAS'
].sort();

const initialIngredients: Ingredient[] = [
  { id: 'ing1', name: 'Tomate', price: 2.5, supplier: 'Proveedor A', unit: IngredientUnit.KG, wastePercentage: 10, supplierLink: 'https://example.com/proveedorA' },
  { id: 'ing2', name: 'Cebolla', price: 1.5, supplier: 'Proveedor A', unit: IngredientUnit.KG, wastePercentage: 15, supplierLink: 'https://example.com/proveedorA' },
  { id: 'ing3', name: 'Aceite de Oliva', price: 8.0, supplier: 'Proveedor B', unit: IngredientUnit.L, wastePercentage: 0, supplierLink: 'https://example.com/proveedorB' },
  { id: 'ing4', name: 'Sal', price: 1.0, supplier: 'Proveedor C', unit: IngredientUnit.KG, wastePercentage: 0 },
  { id: 'ing5', name: 'Pechuga de Pollo', price: 7.5, supplier: 'Proveedor D', unit: IngredientUnit.KG, wastePercentage: 5, supplierLink: 'https://example.com/proveedorD' },
  { id: 'ing6', name: 'Arroz Bomba', price: 3.0, supplier: 'Proveedor B', unit: IngredientUnit.KG, wastePercentage: 0, supplierLink: 'https://example.com/proveedorB' },
  { id: 'ing7', name: 'Azafrán', price: 1500, supplier: 'Proveedor C', unit: IngredientUnit.KG, wastePercentage: 0 },
];

const initialRecipes: Recipe[] = [
  {
    id: 'rec1', name: 'Gazpacho Andaluz', category: 'ENTRANTES', prepTime: 20, cookTime: 0, servings: 4,
    ingredients: [ { ingredientId: 'ing1', quantity: 1000, wastePercentage: 10 }, { ingredientId: 'ing2', quantity: 100, wastePercentage: 15 }, { ingredientId: 'ing3', quantity: 50, wastePercentage: 0 }, { ingredientId: 'ing4', quantity: 10, wastePercentage: 0 }, ],
    preparationSteps: [ 'Lavar y trocear los tomates y la cebolla.', 'Poner todo en una batidora junto con el aceite y la sal.', 'Batir hasta obtener una crema fina.', 'Enfriar en la nevera al menos 1 hora antes de servir.', ],
    allergens: [],
    description: 'Sopa fría tradicional andaluza, elaborada con tomates maduros, pimiento, pepino y un toque de aceite de oliva virgen extra. Refrescante y llena de sabor.',
    coefficient: 3.5,
    pvp: 8.50,
    taxRate: 10,
    portionSize: 250,
  },
  {
    id: 'rec2', name: 'Pollo al Curry', category: 'CARNES Y GUISOS', prepTime: 15, cookTime: 25, servings: 4,
    ingredients: [ { ingredientId: 'ing5', quantity: 800, wastePercentage: 5 }, { ingredientId: 'ing2', quantity: 200, wastePercentage: 15 }, { ingredientId: 'ing3', quantity: 30, wastePercentage: 0 }, ],
    preparationSteps: [ 'Cortar el pollo en dados y la cebolla en juliana.', 'Sofreír la cebolla en una sartén con aceite de oliva.', 'Añadir el pollo y dorar.', 'Incorporar la salsa de curry y cocinar a fuego lento durante 15 minutos.', 'Servir caliente, acompañado de arroz blanco.' ],
    allergens: ['Lácteos'],
    description: 'Tiernos trozos de pechuga de pollo cocinados lentamente en una cremosa y aromática salsa de curry con leche de coco y una selección de especias exóticas.',
    coefficient: 3.8,
    pvp: 12.00,
    taxRate: 10,
    portionSize: 300,
  }
];

const initialEmployees: Employee[] = [
    { id: 'emp1', name: 'Juan Pérez', targetHours: 160 },
    { id: 'emp2', name: 'María García', targetHours: 160 },
    { id: 'emp3', name: 'Carlos Sánchez', targetHours: 120 },
    { id: 'emp4', name: 'Ana Fernández', targetHours: 80 },
    { id: 'emp5', name: 'Lucía Martín', targetHours: 160 },
    { id: 'emp6', name: 'David Gómez', targetHours: 120 },
];

const initialShifts: Shift[] = [
    { id: 'T1', name: 'T1', description: '9:00 / 13:00 - 16:30 / 22:00', hours: 9.5, color: 'bg-transparent' },
    { id: 'T2', name: 'T2', description: '13:00 / 20:00', hours: 7, color: 'bg-transparent' },
    { id: 'T3', name: 'T3', description: '14:00 / 23:00', hours: 9, color: 'bg-transparent' },
    { id: 'T4', name: 'T4', description: '10:00 / 18:00', hours: 8, color: 'bg-transparent' },
    { id: 'T5', name: 'T5', description: '00:00 / 18:00', hours: 8, color: 'bg-transparent' },
    { id: 'T6', name: 'T6', description: '00:00 / 12:00', hours: 8, color: 'bg-transparent' },
    { id: 'T7', name: 'T7', description: '', hours: 0, color: 'bg-transparent' },
    { id: 'T8', name: 'T8', description: '', hours: 0, color: 'bg-transparent' },
    { id: 'T9', name: 'T9', description: '', hours: 0, color: 'bg-transparent' },
    { id: 'L', name: 'L', description: 'Libre', hours: 0, color: 'bg-red-500', textColor: 'text-white' },
    { id: 'V', name: 'V', description: 'Vacaciones', hours: 0, color: 'bg-blue-500', textColor: 'text-white' },
    { id: 'F', name: 'F', description: 'Días Festivos', hours: 0, color: 'bg-cyan-500', textColor: 'text-white' },
    { id: 'E', name: 'E', description: 'Enfermedad', hours: 0, color: 'bg-yellow-500', textColor: 'text-black' },
    { id: 'ER', name: 'ER', description: 'ERTE', hours: 0, color: 'bg-gray-500', textColor: 'text-white' },
    { id: 'DS', name: 'DS', description: 'Día Libre Solicitado', hours: 0, color: 'bg-green-500', textColor: 'text-white' },
    { id: 'X', name: 'X', description: 'Ausencia', hours: 0, color: 'bg-purple-500', textColor: 'text-white' },
];

const initialSchedule: FullSchedule = {
    'emp1': { '2025-10-01': 'T1', '2025-10-02': 'T1', '2025-10-03': 'T2', '2025-10-04': 'L', '2025-10-05': 'L' },
    'emp2': { '2025-10-01': 'T2', '2025-10-02': 'T2', '2025-10-04': 'T3', '2025-10-05': 'T3' },
    'emp3': { '2025-10-01': 'T3', '2025-10-02': 'T3', '2025-10-03': 'T3', '2025-10-04': 'T3', '2025-10-05': 'T3' },
};

const initialPersonnelNeeds: PersonnelNeeds = {
  'T1': { 'Lun': 2, 'Mar': 2, 'Mie': 2, 'Jue': 2, 'Vie': 2, 'Sab': 3, 'Dom': 3 },
  'T3': { 'Lun': 1, 'Mar': 1, 'Mie': 1, 'Jue': 1, 'Vie': 1, 'Sab': 2, 'Dom': 2 },
  'T7': { 'Lun': 0, 'Mar': 0, 'Mie': 0, 'Jue': 0, 'Vie': 0, 'Sab': 0, 'Dom': 0 },
  'T8': { 'Lun': 0, 'Mar': 0, 'Mie': 0, 'Jue': 0, 'Vie': 0, 'Sab': 0, 'Dom': 0 },
  'T9': { 'Lun': 0, 'Mar': 0, 'Mie': 0, 'Jue': 0, 'Vie': 0, 'Sab': 0, 'Dom': 0 },
};

const initialSpecialEvents: SpecialEvent[] = [
    {id: 'evt1', date: '2025-10-12', description: 'Fiesta Nacional'},
    {id: 'evt2', date: '2025-10-31', description: 'Evento Halloween'},
];

const initialSettings: Settings = {
  restaurantName: 'RESORT BARCELONA',
  restaurantType: 'Cocina Mediterránea',
  city: 'Barcelona',
  country: 'España',
  currency: 'EUR',
  defaultCoefficient: 3.5,
  defaultTaxRate: 10,
  logoUrl: '',
};

const initialRefrigerators: RecordableItem[] = [
    { id: 'ref-1', name: 'Nevera Barra' },
    { id: 'ref-2', name: 'Cámara Verduras' },
];
const initialFreezers: RecordableItem[] = [
    { id: 'fre-1', name: 'Congelador Principal' },
];
const initialFryers: RecordableItem[] = [
    { id: 'fry-1', name: 'Freidora 1 (Patatas)' },
    { id: 'fry-2', name: 'Freidora 2 (Pescado)' },
];
const initialCleaningZones: RecordableItem[] = [
    { id: 'cle-1', name: 'Cocina Caliente' },
    { id: 'cle-2', name: 'Almacén Seco' },
];

const initialAppccRecords: AppccRecord[] = [
    { id: 'rec-temp-1', itemId: 'ref-1', itemType: 'refrigerator', employeeId: 'emp1', date: '2025-10-01', value: '4°C' },
    { id: 'rec-temp-2', itemId: 'ref-2', itemType: 'refrigerator', employeeId: 'emp1', date: '2025-10-01', value: '3.5°C' },
    { id: 'rec-fry-1', itemId: 'fry-1', itemType: 'fryer', employeeId: 'emp2', date: '2025-10-02', value: ['Lim', 'Ace'] },
];

const useAppData = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [fullSchedule, setFullSchedule] = useState<FullSchedule>(initialSchedule);
  const [personnelNeeds, setPersonnelNeeds] = useState<PersonnelNeeds>(initialPersonnelNeeds);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>(initialSpecialEvents);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [categories, setCategories] = useState<string[]>(initialCategories);

  // --- Menu Planner State ---
  const days = useMemo(() => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], []);
  const initialMealTypes = useMemo(() => ['Entrante Frío', 'Entrante Caliente', 'Plato Carne', 'Plato Pescado', 'Plato Vegetariano', 'Postre'], []);
  const [mealTypes, setMealTypes] = useState<string[]>(initialMealTypes);
  const [weeklyPlan, setWeeklyPlan] = useState<{[key: string]: string}>(() => {
    const initialPlan: {[key: string]: string} = {};
    days.forEach(day => {
        initialMealTypes.forEach(meal => {
            initialPlan[`${day}-${meal}`] = '';
        });
    });
    return initialPlan;
  });
  const [dailyPvp, setDailyPvp] = useState<{ [day: string]: number }>(
    () => days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {})
  );

  // --- APPCC Records State ---
  const [refrigerators, setRefrigerators] = useState<RecordableItem[]>(initialRefrigerators);
  const [freezers, setFreezers] = useState<RecordableItem[]>(initialFreezers);
  const [fryers, setFryers] = useState<RecordableItem[]>(initialFryers);
  const [cleaningZones, setCleaningZones] = useState<RecordableItem[]>(initialCleaningZones);
  const [appccRecords, setAppccRecords] = useState<AppccRecord[]>(initialAppccRecords);

  const recordableItemSetters: { [key in RecordItemType]: React.Dispatch<React.SetStateAction<RecordableItem[]>> } = {
      refrigerator: setRefrigerators,
      freezer: setFreezers,
      fryer: setFryers,
      cleaningZone: setCleaningZones,
  };

  const addRecordableItem = useCallback((type: RecordItemType, name: string) => {
    const setter = recordableItemSetters[type];
    const prefix = { refrigerator: 'ref', freezer: 'fre', fryer: 'fry', cleaningZone: 'cle' }[type];
    if (setter && name.trim()) {
        const newItem: RecordableItem = {
            id: `${prefix}-${Date.now()}`,
            name: name.trim()
        };
        setter(prev => [...prev, newItem]);
    }
  }, []);

  const updateRecordableItem = useCallback((type: RecordItemType, id: string, newName: string) => {
    const setter = recordableItemSetters[type];
    if (setter && newName.trim()) {
        setter(prev => prev.map(item => item.id === id ? { ...item, name: newName.trim() } : item));
    }
  }, []);
  
  const removeRecordableItem = useCallback((type: RecordItemType, id: string) => {
    const setter = recordableItemSetters[type];
    if (setter) {
        setter(prev => prev.filter(item => item.id !== id));
        // Also remove associated records
        setAppccRecords(prevRecords => prevRecords.filter(rec => rec.itemId !== id));
    }
  }, []);
  
  const addAppccRecord = useCallback((record: Omit<AppccRecord, 'id'>) => {
      const newRecord: AppccRecord = {
          ...record,
          id: `appcc-${Date.now()}`
      };
      setAppccRecords(prev => [...prev, newRecord]);
  }, []);


  const addOrUpdateRecipe = useCallback((newRecipe: Recipe) => {
    setRecipes(prevRecipes => {
      const existingIndex = prevRecipes.findIndex(r => r.id === newRecipe.id || r.name.toLowerCase() === newRecipe.name.toLowerCase());
      if (existingIndex !== -1) {
        const updatedRecipes = [...prevRecipes];
        updatedRecipes[existingIndex] = newRecipe;
        return updatedRecipes;
      } else {
        return [...prevRecipes, newRecipe];
      }
    });
  }, []);

  const removeRecipe = useCallback((recipeId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta permanentemente?')) {
      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    }
  }, []);

  const updateIngredient = useCallback((updatedIngredient: Ingredient) => {
    setIngredients(prevIngredients => {
      return prevIngredients.map(ing => ing.id === updatedIngredient.id ? updatedIngredient : ing);
    });
  }, []);

  const addIngredient = useCallback(() => {
    setIngredients(prevIngredients => {
      const newIngredient: Ingredient = {
        id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: 'Nuevo Ingrediente',
        price: 0,
        supplier: '',
        unit: IngredientUnit.KG,
        wastePercentage: 0,
      };
      return [...prevIngredients, newIngredient];
    });
  }, []);

  const removeIngredient = useCallback((ingredientId: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
  }, []);

  const batchUpdateIngredients = useCallback((data: InvoiceProcessingResult): string[] => {
    const modifiedIds: string[] = [];
    let updatedIngredients = [...ingredients];
    data.updates.forEach(update => {
      const index = updatedIngredients.findIndex(ing => ing.name.toLowerCase() === update.name.toLowerCase());
      if (index !== -1) {
        updatedIngredients[index] = { ...updatedIngredients[index], price: update.newPrice };
        modifiedIds.push(updatedIngredients[index].id);
      }
    });
    data.additions.forEach(addition => {
      const exists = updatedIngredients.some(ing => ing.name.toLowerCase() === addition.name.toLowerCase());
      if (!exists) {
        const newIngredient: Ingredient = {
          id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: addition.name,
          price: addition.price,
          supplier: addition.supplier || 'Proveedor Desconocido',
          unit: Object.values(IngredientUnit).includes(addition.unit) ? addition.unit : IngredientUnit.PZ,
          wastePercentage: 0,
        };
        updatedIngredients.push(newIngredient);
        modifiedIds.push(newIngredient.id);
      }
    });
    setIngredients(updatedIngredients);
    return modifiedIds;
  }, [ingredients]);

  const updateSchedule = useCallback((employeeId: string, date: string, shiftId: string | null) => {
    setFullSchedule(prev => {
        const newSchedule = { ...prev };
        if (!newSchedule[employeeId]) newSchedule[employeeId] = {};
        if (shiftId === null || shiftId === '') delete newSchedule[employeeId][date];
        else newSchedule[employeeId][date] = shiftId;
        return newSchedule;
    });
  }, []);

  const batchUpdateSchedule = useCallback((newScheduleData: FullSchedule) => {
    setFullSchedule(prev => {
        const newFullSchedule = { ...prev };
        for (const employeeId in newScheduleData) {
            if (!newFullSchedule[employeeId]) newFullSchedule[employeeId] = {};
            newFullSchedule[employeeId] = { ...newFullSchedule[employeeId], ...newScheduleData[employeeId] };
        }
        return newFullSchedule;
    });
  }, []);

  const addEmployee = useCallback((name: string, targetHours: number) => {
    setEmployees(prev => [...prev, { id: `emp-${Date.now()}`, name, targetHours }]);
  }, []);

  const updateEmployee = useCallback((updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
  }, []);

  const removeEmployee = useCallback((employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    setFullSchedule(prev => {
        const newSchedule = { ...prev };
        delete newSchedule[employeeId];
        return newSchedule;
    });
  }, []);

  const updatePersonnelNeeds = useCallback((shiftId: string, day: string, count: number) => {
    setPersonnelNeeds(prev => {
      const newNeeds = { ...prev };
      if (!newNeeds[shiftId]) newNeeds[shiftId] = { 'Lun': 0, 'Mar': 0, 'Mie': 0, 'Jue': 0, 'Vie': 0, 'Sab': 0, 'Dom': 0 };
      newNeeds[shiftId][day] = count;
      return newNeeds;
    });
  }, []);

  const updateShift = useCallback((updatedShift: Shift) => {
    setShifts(prevShifts => prevShifts.map(shift => shift.id === updatedShift.id ? updatedShift : shift));
  }, []);

  const addSpecialEvent = useCallback((event: Omit<SpecialEvent, 'id'>) => {
    setSpecialEvents(prev => [...prev, { ...event, id: `evt-${Date.now()}` }]);
  }, []);

  const removeSpecialEvent = useCallback((eventId: string) => {
    setSpecialEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => setSettings(newSettings), []);

  const addCategory = useCallback((categoryName: string) => {
    setCategories(prevCategories => {
        const alreadyExists = prevCategories.some(c => c.toLowerCase() === categoryName.toLowerCase());
        if (categoryName && !alreadyExists) return [...prevCategories, categoryName.toUpperCase()].sort();
        return prevCategories;
    });
  }, []);

  const removeCategory = useCallback((categoryName: string, deleteRecipes: boolean) => {
    setCategories(prev => prev.filter(c => c !== categoryName));
    if (deleteRecipes) setRecipes(prevRecipes => prevRecipes.filter(r => r.category !== categoryName));
  }, []);

  const updateMealType = useCallback((indexToUpdate: number, newName: string) => {
    setMealTypes(prevTypes => {
        const oldName = prevTypes[indexToUpdate];
        if (oldName === newName || !newName.trim()) return prevTypes;
        const newTypes = [...prevTypes];
        newTypes[indexToUpdate] = newName;
        setWeeklyPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            days.forEach(day => {
                const oldKey = `${day}-${oldName}`;
                const newKey = `${day}-${newName}`;
                if (newPlan[oldKey] !== undefined) {
                    newPlan[newKey] = newPlan[oldKey];
                    delete newPlan[oldKey];
                }
            });
            return newPlan;
        });
        return newTypes;
    });
  }, [days]);

  const addMealType = useCallback(() => {
    setMealTypes(prev => {
        const newTypeName = `Nuevo Tipo ${prev.length + 1}`;
        setWeeklyPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            days.forEach(day => { newPlan[`${day}-${newTypeName}`] = ''; });
            return newPlan;
        });
        return [...prev, newTypeName];
    });
  }, [days]);

  const removeMealType = useCallback((indexToRemove: number) => {
    setMealTypes(currentMealTypes => {
      const typeToRemove = currentMealTypes[indexToRemove];
      if (!typeToRemove) return currentMealTypes;
      setWeeklyPlan(currentPlan => {
        const newPlan = { ...currentPlan };
        days.forEach(day => { delete newPlan[`${day}-${typeToRemove}`]; });
        return newPlan;
      });
      return currentMealTypes.filter((_, i) => i !== indexToRemove);
    });
  }, [days]);

  return { 
    recipes, ingredients, employees, shifts, fullSchedule, personnelNeeds, specialEvents, settings, categories,
    mealTypes, weeklyPlan, dailyPvp,
    refrigerators, freezers, fryers, cleaningZones, appccRecords,
    addOrUpdateRecipe, removeRecipe, updateIngredient, addIngredient, removeIngredient, batchUpdateIngredients,
    updateSchedule, batchUpdateSchedule, addEmployee, updateEmployee, removeEmployee,
    updatePersonnelNeeds, updateShift, addSpecialEvent, removeSpecialEvent, updateSettings,
    addCategory, removeCategory, setWeeklyPlan, setDailyPvp, addMealType, removeMealType, updateMealType,
    addRecordableItem, updateRecordableItem, removeRecordableItem, addAppccRecord
  };
};

export default useAppData;
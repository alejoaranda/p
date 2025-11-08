import React, { useState, useCallback, useEffect } from 'react';
import { View, Recipe, RecordableItem, RecordItemType, AppccRecord, Employee, Settings } from './types';
import useAppData from './hooks/useAppData';
import { NavIcon, DatabaseIcon, IngredientsIcon, MenuPlannerIcon, SchedulesIcon, SettingsIcon, CosteProLogo, RecordsIcon, FinancialReportsIcon, CheckIcon } from './components/icons';
import { MenuView } from './components/views/MenuView';
import { DatabaseView } from './components/views/DatabaseView';
import { IngredientsView } from './components/views/IngredientsView';
import { MenuPlannerView } from './components/views/MenuPlannerView';
import { SchedulesView } from './components/views/SchedulesView';
import { SettingsView } from './components/views/SettingsView';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { AIAssistant } from './components/AIAssistant';
import { RecordsView } from './components/views/RecordsView';
import { FinancialsView } from './components/views/FinancialsView';
import LandingPage from './components/LandingPage';

// --- QR Code Record Form Page ---
interface RecordFormPageProps {
  params: { type: RecordItemType, id: string };
  employees: Employee[];
  items: RecordableItem[];
  onSave: (record: Omit<AppccRecord, 'id'>) => void;
}

const RecordFormPage: React.FC<RecordFormPageProps> = ({ params, employees, items, onSave }) => {
    const [employeeId, setEmployeeId] = useState<string>('');
    const [value, setValue] = useState<string>('');
    const [fryerTasks, setFryerTasks] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const item = items.find(i => i.id === params.id);
    if (!item) {
        return <div className="h-screen w-screen flex items-center justify-center bg-base-100 text-base-content p-4 text-center">
            <h1 className="text-xl font-bold text-red-500">Error: Equipo no encontrado. Por favor, vuelva a escanear un QR válido.</h1>
        </div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId) {
            alert("Por favor, selecciona tu nombre.");
            return;
        }

        let recordValue: string | string[];
        switch (params.type) {
            case 'fryer':
                if (fryerTasks.length === 0) {
                    alert("Por favor, selecciona al menos una tarea (Limpieza o Aceite).");
                    return;
                }
                recordValue = fryerTasks;
                break;
            case 'cleaningZone':
                if (!notes.trim()) {
                    alert("Por favor, describe la limpieza realizada.");
                    return;
                }
                recordValue = notes.split('\n').filter(s => s.trim() !== '');
                break;
            default: // refrigerator, freezer
                if (!value.trim()) {
                    alert("Por favor, introduce la temperatura.");
                    return;
                }
                recordValue = value;
        }
        
        onSave({
            itemId: params.id,
            itemType: params.type,
            employeeId,
            date: new Date().toISOString().split('T')[0],
            value: recordValue,
            notes: params.type !== 'cleaningZone' ? notes : undefined,
        });
        
        setIsSubmitted(true);
    };
    
    if (isSubmitted) {
         return <div className="h-screen w-screen flex items-center justify-center bg-base-100 text-base-content p-4 text-center">
            <div className="bg-base-200 p-8 rounded-lg shadow-xl flex flex-col items-center">
                <div className="bg-green-500 rounded-full p-4 mb-4">
                    <CheckIcon className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-base-content">¡Registro Guardado!</h1>
                <p className="text-base-content/80 mt-2">Gracias. Puedes cerrar esta ventana.</p>
            </div>
        </div>;
    }
    
    const renderFormFields = () => {
        switch (params.type) {
            case 'refrigerator':
            case 'freezer':
                return <div className="relative">
                    <input type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} className="input input-bordered w-full text-center text-2xl h-16" placeholder="0.0" required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-base-content/50">°C</span>
                </div>;
            case 'fryer':
                return <div className="flex justify-around">
                    {['Limpieza', 'Aceite'].map(task => {
                        const internalValue = task === 'Limpieza' ? 'Lim' : 'Ace';
                        const isChecked = fryerTasks.includes(internalValue);
                        return <label key={task} className={`flex items-center space-x-2 p-4 border-2 rounded-lg cursor-pointer ${isChecked ? 'border-primary bg-primary/10' : 'border-base-300'}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => setFryerTasks(prev => isChecked ? prev.filter(t => t !== internalValue) : [...prev, internalValue])} className="checkbox checkbox-primary" />
                            <span className="font-semibold">{task}</span>
                        </label>
                    })}
                </div>;
            case 'cleaningZone':
                return <textarea value={notes} onChange={e => setNotes(e.target.value)} className="textarea textarea-bordered w-full" rows={4} placeholder="Describe las tareas de limpieza realizadas..." required></textarea>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-base-200 rounded-xl shadow-2xl p-6">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-primary">{item.name}</h1>
                    <p className="text-base-content/70">Registro de Control APPCC</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label"><span className="label-text">Empleado</span></label>
                        <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="select select-bordered w-full" required>
                            <option value="" disabled>Selecciona tu nombre</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label"><span className="label-text">Registro</span></label>
                        {renderFormFields()}
                    </div>
                     {params.type !== 'cleaningZone' && (
                        <div>
                            <label className="label"><span className="label-text">Observaciones (opcional)</span></label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="textarea textarea-bordered w-full" rows={2} placeholder="Añadir notas..."></textarea>
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary w-full mt-4">Enviar Registro</button>
                </form>
            </div>
        </div>
    );
};

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Menu);
  const appData = useAppData();
  const { 
    recipes, ingredients, employees, shifts, fullSchedule, personnelNeeds, specialEvents, settings, categories,
    mealTypes, weeklyPlan, dailyPvp,
    refrigerators, freezers, fryers, cleaningZones, appccRecords,
    addOrUpdateRecipe, removeRecipe, updateIngredient, addIngredient, removeIngredient, batchUpdateIngredients,
    updateSchedule, batchUpdateSchedule, updatePersonnelNeeds, updateShift, addSpecialEvent, removeSpecialEvent,
    updateSettings, addCategory, removeCategory, addEmployee, updateEmployee, removeEmployee, setWeeklyPlan,
    setDailyPvp, addMealType, removeMealType, updateMealType,
    addRecordableItem, updateRecordableItem, removeRecordableItem, addAppccRecord
  } = appData;

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [menuItems, setMenuItems] = useState<{ [key: string]: string[] }>({
    'Entrantes Fríos': ['Gazpacho Andaluz'],
    'Entrantes Calientes': [''],
    'Platos Principales': ['Pollo al Curry', ''],
    'Postres': [''],
  });

  // --- QR Code Form Routing Logic ---
  const [recordFormParams, setRecordFormParams] = useState<{type: RecordItemType, id: string} | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('t') as RecordItemType;
    const id = urlParams.get('id');
    if (type && id && ['refrigerator', 'freezer', 'fryer', 'cleaningZone'].includes(type)) {
        setRecordFormParams({ type, id });
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (recordFormParams) {
    const allItems = [...refrigerators, ...freezers, ...fryers, ...cleaningZones];
    return <RecordFormPage params={recordFormParams} employees={employees} items={allItems} onSave={addAppccRecord} />;
  }
  // --- End of Routing Logic ---


  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case View.Menu:
        return <MenuView 
                  recipes={recipes} 
                  ingredients={ingredients}
                  onSelectRecipe={handleSelectRecipe} 
                  addOrUpdateRecipe={addOrUpdateRecipe}
                  menuItems={menuItems}
                  setMenuItems={setMenuItems}
                  settings={settings}
                  categories={categories}
               />;
      case View.MenuPlanner:
        return <MenuPlannerView 
                  recipes={recipes} 
                  ingredients={ingredients}
                  onSelectRecipe={handleSelectRecipe}
                  categories={categories}
                  addOrUpdateRecipe={addOrUpdateRecipe} 
                  settings={settings}
                  weeklyPlan={weeklyPlan}
                  setWeeklyPlan={setWeeklyPlan}
                  dailyPvp={dailyPvp}
                  setDailyPvp={setDailyPvp}
                  mealTypes={mealTypes}
                  addMealType={addMealType}
                  removeMealType={removeMealType}
                  updateMealType={updateMealType}
                />;
      case View.Database:
        return <DatabaseView 
                  recipes={recipes} 
                  onSelectRecipe={handleSelectRecipe} 
                  onRemoveRecipe={removeRecipe} 
                  categories={categories}
                  onAddCategory={addCategory}
                  onRemoveCategory={removeCategory}
                  addOrUpdateRecipe={addOrUpdateRecipe}
                  settings={settings}
                />;
      case View.Ingredients:
        return <IngredientsView 
                  ingredients={ingredients} 
                  onUpdateIngredient={updateIngredient} 
                  onAddIngredient={addIngredient}
                  onRemoveIngredient={removeIngredient}
                  onBatchUpdateIngredients={batchUpdateIngredients}
                  settings={settings}
                />;
      case View.Schedules:
        return (
          <SchedulesView 
            employees={employees} 
            shifts={shifts.slice(0, 6)} 
            schedule={fullSchedule} 
            onUpdateSchedule={updateSchedule}
            onBatchUpdateSchedule={batchUpdateSchedule}
            personnelNeeds={personnelNeeds}
            onUpdatePersonnelNeeds={updatePersonnelNeeds}
            specialEvents={specialEvents}
            onAddSpecialEvent={addSpecialEvent}
            onRemoveSpecialEvent={removeSpecialEvent}
            onAddEmployee={addEmployee}
            onUpdateEmployee={updateEmployee}
            onRemoveEmployee={removeEmployee}
            onUpdateShift={updateShift}
            settings={settings}
          />
        );
      case View.Settings:
        return <SettingsView settings={settings} onUpdateSettings={updateSettings} />;
      case View.Records:
        return <RecordsView settings={settings} appData={appData} />;
      case View.FinancialReports:
        return <FinancialsView recipes={recipes} ingredients={ingredients} settings={settings} />;
      default:
        return <MenuView 
                  recipes={recipes} 
                  ingredients={ingredients}
                  onSelectRecipe={handleSelectRecipe} 
                  addOrUpdateRecipe={addOrUpdateRecipe}
                  menuItems={menuItems}
                  setMenuItems={setMenuItems}
                  settings={settings}
                  categories={categories}
                />;
    }
  };

  const HeaderNavItem: React.FC<{ view: View; label: string; icon: React.ReactNode; }> = ({ view, label, icon }) => (
    <div className="relative group">
        <button
            onClick={() => setCurrentView(view)}
            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${
            currentView === view ? 'bg-primary text-primary-content' : 'hover:bg-base-300'
            }`}
            aria-label={label}
        >
            {icon}
        </button>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-auto min-w-max bg-base-300 text-base-content text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {label}
        </div>
    </div>
  );

  return (
    <div className="h-full bg-base-100 text-base-content flex flex-col">
      <header className="bg-base-200 shadow-md p-3 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <CosteProLogo />
          <div className="flex items-center gap-1 md:gap-2">
            <HeaderNavItem view={View.Menu} label="Carta" icon={<NavIcon />} />
            <HeaderNavItem view={View.MenuPlanner} label="Creador de Menú" icon={<MenuPlannerIcon />} />
            <HeaderNavItem view={View.Schedules} label="Horarios" icon={<SchedulesIcon />} />
            <HeaderNavItem view={View.Records} label="Registros" icon={<RecordsIcon />} />
            <HeaderNavItem view={View.FinancialReports} label="Informes" icon={<FinancialReportsIcon />} />
            <HeaderNavItem view={View.Database} label="Recetario" icon={<DatabaseIcon />} />
            <HeaderNavItem view={View.Ingredients} label="Ingredientes" icon={<IngredientsIcon />} />
          </div>
        </div>
        <div className="flex-shrink-0">
          <HeaderNavItem view={View.Settings} label="Configuración" icon={<SettingsIcon />} />
        </div>
      </header>
      
      <main className="flex-1 py-4 md:p-6 overflow-y-auto bg-base-100">
        {renderView()}
      </main>

      {selectedRecipe && <RecipeDetailModal recipe={selectedRecipe} onClose={handleCloseModal} ingredients={ingredients} addOrUpdateRecipe={addOrUpdateRecipe} categories={categories} settings={settings} />}

      <AIAssistant recipes={recipes} />
    </div>
  );
};


const App: React.FC = () => {
    const [showLandingPage, setShowLandingPage] = useState(true);

    const handleEnterApp = () => {
        setShowLandingPage(false);
    };

    if (showLandingPage) {
        return <LandingPage onEnterApp={handleEnterApp} />;
    }

    return <MainApp />;
};


export default App;

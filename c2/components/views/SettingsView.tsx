import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../../types';
import { TrashIcon } from '../icons';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
}

const currencies = [
  // Major world currencies
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'USD', name: 'Dólar estadounidense ($)' },
  { code: 'GBP', name: 'Libra esterlina (£)' },
  { code: 'JPY', name: 'Yen japonés (¥)' },
  { code: 'CAD', name: 'Dólar canadiense (C$)' },
  { code: 'AUD', name: 'Dólar australiano (A$)' },
  { code: 'CHF', name: 'Franco suizo (Fr)' },
  // Spanish-speaking countries
  { code: 'MXN', name: 'Peso mexicano ($)' },
  { code: 'ARS', name: 'Peso argentino ($)' },
  { code: 'CLP', name: 'Peso chileno ($)' },
  { code: 'COP', name: 'Peso colombiano ($)' },
  { code: 'PEN', name: 'Sol peruano (S/)' },
  { code: 'UYU', name: 'Peso uruguayo ($U)' },
  { code: 'BOB', name: 'Boliviano (Bs.)' },
  { code: 'CRC', name: 'Colón costarricense (₡)' },
  { code: 'CUP', name: 'Peso cubano ($)' },
  { code: 'DOP', name: 'Peso dominicano (RD$)' },
  { code: 'GTQ', name: 'Quetzal (Q)' },
  { code: 'HNL', name: 'Lempira (L)' },
  { code: 'NIO', name: 'Córdoba (C$)' },
  { code: 'PAB', name: 'Balboa (B/.)' },
  { code: 'PYG', name: 'Guaraní (₲)' },
  { code: 'VES', name: 'Bolívar soberano (Bs.S.)' },
];

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const SettingsInput: React.FC<{
    label: string;
    field: keyof Settings;
    type?: string;
    isNumber?: boolean;
    value: string | number;
    onChange: (field: keyof Settings, value: string | number) => void;
    onBlur: () => void;
}> = ({ label, field, type = 'text', isNumber = false, value, onChange, onBlur }) => (
    <div>
        <label htmlFor={field} className="block text-sm font-medium text-base-content/80 mb-1">{label}</label>
        <input
            id={field}
            type={type}
            value={value}
            onChange={(e) => onChange(field, isNumber ? parseFloat(e.target.value) || 0 : e.target.value)}
            onBlur={onBlur}
            className="w-full bg-base-300 text-base-content rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
    </div>
);

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleInputChange = (field: keyof Settings, value: string | number) => {
    setLocalSettings(currentSettings => ({ ...currentSettings, [field]: value }));
  };

  const handleBlur = () => {
    onUpdateSettings(localSettings);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("El archivo es demasiado grande. Por favor, sube una imagen de menos de 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const newSettings = { ...localSettings, logoUrl: reader.result as string };
        setLocalSettings(newSettings);
        onUpdateSettings(newSettings);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    const newSettings = { ...localSettings, logoUrl: '' };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-lg h-full flex flex-col overflow-y-auto">
      <h2 className="text-2xl font-bold text-base-content mb-6">Configuración</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        {/* Left Column: General & Logo */}
        <div className="space-y-6">
          <div className="bg-base-300 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">Información del Restaurante</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsInput label="Nombre del Restaurante" field="restaurantName" value={localSettings.restaurantName} onChange={handleInputChange} onBlur={handleBlur} />
              <SettingsInput label="Tipo de Restaurante" field="restaurantType" value={localSettings.restaurantType} onChange={handleInputChange} onBlur={handleBlur} />
              <SettingsInput label="Ciudad" field="city" value={localSettings.city} onChange={handleInputChange} onBlur={handleBlur} />
              <SettingsInput label="País" field="country" value={localSettings.country} onChange={handleInputChange} onBlur={handleBlur} />
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-base-content/80 mb-1">Moneda</label>
                <select
                  id="currency"
                  value={localSettings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  onBlur={handleBlur}
                  className="w-full bg-base-100 text-base-content rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <SettingsInput label="Coeficiente por Defecto" field="defaultCoefficient" type="number" isNumber={true} value={localSettings.defaultCoefficient} onChange={handleInputChange} onBlur={handleBlur} />
              <SettingsInput label="IVA por Defecto (%)" field="defaultTaxRate" type="number" isNumber={true} value={localSettings.defaultTaxRate} onChange={handleInputChange} onBlur={handleBlur} />
            </div>
          </div>
          <div className="bg-base-300 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">Logo del Restaurante</h3>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-base-100 rounded-md flex items-center justify-center overflow-hidden">
                {localSettings.logoUrl ? (
                  <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon />
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp"
                />
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-secondary">Subir Logo</button>
                {localSettings.logoUrl && (
                  <button onClick={handleRemoveLogo} className="btn btn-sm btn-ghost text-red-500 flex items-center gap-1">
                    <TrashIcon /> Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: App & Data */}
        <div className="space-y-6">
          <div className="bg-base-300 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">Apariencia de la App</h3>
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">Tema</label>
              <div className="flex space-x-2">
                <button onClick={() => setTheme('dark')} className={`btn btn-sm ${theme === 'dark' ? 'bg-primary text-primary-content' : 'btn-ghost'}`}>Oscuro</button>
                <button onClick={() => setTheme('light')} className={`btn btn-sm ${theme === 'light' ? 'bg-primary text-primary-content' : 'btn-ghost'}`}>Claro</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
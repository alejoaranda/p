import React, { useState } from 'react';
import { Recipe, Ingredient, Settings, ReportType } from '../../types';
import { ReportModal } from '../ReportModal';

// Helper Icons for Report Cards
const CostDeviationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
const MenuEngineeringIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const PredictiveInventoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 .001 0M20 7s0 0-.001 0M12 11c-3.314 0-6-1.343-6-3m6 3c3.314 0 6-1.343 6-3" /></svg>;
const LaborCostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ExecutiveSummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface ReportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon, title, description, onClick }) => (
  <div className="bg-base-300 p-6 rounded-lg shadow-md flex flex-col items-center text-center transition-transform hover:-translate-y-2">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-base-content mb-2">{title}</h3>
    <p className="text-base-content/80 text-sm mb-4 flex-grow">{description}</p>
    <button onClick={onClick} className="btn bg-orange-500 hover:bg-orange-600 text-white mt-auto w-full">
      Generar Informe
    </button>
  </div>
);


interface FinancialsViewProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  settings: Settings;
}


export const FinancialsView: React.FC<FinancialsViewProps> = ({ recipes, ingredients, settings }) => {
    const [activeReport, setActiveReport] = useState<ReportType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const reports = [
        {
            id: 'COST_DEVIATION',
            icon: <CostDeviationIcon />,
            title: 'Desviación de Costes',
            description: 'Compara el coste teórico de los ingredientes (según recetas vendidas) con el coste real del inventario consumido.'
        },
        {
            id: 'MENU_ENGINEERING',
            icon: <MenuEngineeringIcon />,
            title: 'Ingeniería de Menú',
            description: 'Analiza la rentabilidad y popularidad de cada plato para optimizar tu carta y maximizar beneficios.'
        },
        {
            id: 'PREDICTIVE_INVENTORY',
            icon: <PredictiveInventoryIcon />,
            title: 'Inventario Predictivo',
            description: 'Estima las necesidades futuras de ingredientes y te alerta sobre posibles mermas o roturas de stock.'
        },
        {
            id: 'LABOR_COST',
            icon: <LaborCostIcon />,
            title: 'Eficiencia Laboral',
            description: 'Calcula el porcentaje que representa el coste de personal sobre las ventas y compáralo con los estándares del sector.'
        },
        {
            id: 'EXECUTIVE_SUMMARY',
            icon: <ExecutiveSummaryIcon />,
            title: 'Resumen Ejecutivo',
            description: 'Un panel de control con los indicadores clave de tu negocio, "El Pulso del Negocio" en una sola vista.'
        }
    ];

    const handleGenerateReport = (reportType: ReportType) => {
        setActiveReport(reportType);
        setIsModalOpen(true);
    };

    return (
         <div className="p-4">
            <div className="bg-base-200 p-4 rounded-xl shadow-lg mb-6">
                <h2 className="text-2xl font-bold text-base-content">Informes Financieros y de Gestión</h2>
                <p className="text-base-content/70 mt-1">Herramientas para analizar la salud de tu negocio y tomar decisiones basadas en datos.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <ReportCard 
                        key={report.id}
                        icon={report.icon}
                        title={report.title}
                        description={report.description}
                        onClick={() => handleGenerateReport(report.id as ReportType)}
                    />
                ))}
            </div>

            {isModalOpen && activeReport && (
                <ReportModal 
                    reportType={activeReport}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    recipes={recipes}
                    ingredients={ingredients}
                    settings={settings}
                />
            )}
        </div>
    );
};
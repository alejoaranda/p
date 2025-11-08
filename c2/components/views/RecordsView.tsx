import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Settings, RecordType, RecordableItem, RecordItemType, AppccRecord, Employee } from '../../types';
import useAppData from '../../hooks/useAppData';
import { 
    generateRefrigeratorLogHtml, 
    generateFreezerLogHtml,
    generateFryerCleaningLogHtml, 
    generateGeneralCleaningLogHtml 
} from '../../services/printService';
import { PlusIcon, TrashIcon, CheckIcon, PencilIcon, QrCodeIcon } from '../icons';

type AppData = ReturnType<typeof useAppData>;

// --- Helper Components ---
const RecordableItemManager: React.FC<{
    title: string;
    items: RecordableItem[];
    type: RecordItemType;
    appData: AppData;
    onGenerateQr: (item: RecordableItem, type: RecordItemType) => void;
}> = ({ title, items, type, appData, onGenerateQr }) => {
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAdd = () => {
        if (newItemName.trim()) {
            appData.addRecordableItem(type, newItemName);
            setNewItemName('');
        }
    };
    
    const handleEdit = (item: RecordableItem) => {
        setEditingId(item.id);
        setEditingName(item.name);
    };

    const handleSaveEdit = (id: string) => {
        if (editingName.trim()) {
            appData.updateRecordableItem(type, id, editingName);
        }
        setEditingId(null);
        setEditingName('');
    };

    return (
        <div className="bg-base-300 p-4 rounded-lg flex flex-col">
            <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
            <ul className="space-y-2 mb-2 flex-grow">
                {items.map(item => (
                    <li key={item.id} className="flex items-center space-x-2 group">
                        <div className="flex-grow bg-base-100 p-2 rounded flex justify-between items-center min-w-0">
                            {editingId === item.id ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    onBlur={() => handleSaveEdit(item.id)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(item.id)}
                                    className="input input-sm bg-base-200 flex-grow"
                                    autoFocus
                                />
                            ) : (
                                 <span className="truncate pr-2">{item.name}</span>
                            )}
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                {editingId === item.id ? (
                                    <button onClick={() => handleSaveEdit(item.id)} className="btn btn-xs btn-square btn-success" title="Guardar"><CheckIcon /></button>
                                ) : (
                                    <div className="flex items-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(item)} className="btn btn-xs btn-square btn-ghost" title="Editar"><PencilIcon /></button>
                                        <button onClick={() => appData.removeRecordableItem(type, item.id)} className="btn btn-xs btn-square btn-error" title="Eliminar"><TrashIcon /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation();
                                onGenerateQr(item, type); 
                            }} 
                            className="btn btn-square btn-ghost flex-shrink-0" 
                            title="Generar QR"
                            disabled={editingId === item.id}
                        >
                            <QrCodeIcon className="h-8 w-8 text-base-content/70 hover:text-primary" />
                        </button>
                    </li>
                ))}
            </ul>
            <div className="flex items-center space-x-2 mt-auto">
                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder={`Añadir ${title.slice(0, -1).toLowerCase()}...`} className="input input-sm input-bordered w-full" onKeyDown={e => e.key === 'Enter' && handleAdd()}/>
                <button onClick={handleAdd} className="btn btn-sm btn-primary btn-square"><PlusIcon /></button>
            </div>
        </div>
    );
};


// --- Main View Component ---

export const RecordsView: React.FC<{ settings: Settings, appData: AppData }> = ({ settings, appData }) => {
    const { employees, appccRecords, refrigerators, freezers, fryers, cleaningZones } = appData;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('Temperatura Nevera');
    const [selectedItemForPrint, setSelectedItemForPrint] = useState<string>('');
    const [modalData, setModalData] = useState<{ date: Date; records: AppccRecord[] } | null>(null);
    const [qrModalData, setQrModalData] = useState<{ name: string; dataUrl: string } | null>(null);
    const qrCodeApiRef = useRef<any>(null);

    const loadQrCodeLibrary = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            // If library is already loaded and cached, return it
            if (qrCodeApiRef.current) {
                return resolve(qrCodeApiRef.current);
            }
            // If library was loaded by another component (e.g. via <script> tag)
            if ((window as any).QRCode) {
                qrCodeApiRef.current = (window as any).QRCode;
                return resolve(qrCodeApiRef.current);
            }

            // Otherwise, load the script dynamically
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js";
            script.async = true;
            script.onload = () => {
                if ((window as any).QRCode) {
                    qrCodeApiRef.current = (window as any).QRCode;
                    resolve(qrCodeApiRef.current);
                } else {
                    reject(new Error("QR code library loaded but QRCode object not found on window."));
                }
            };
            script.onerror = () => {
                reject(new Error("No se pudo cargar la librería para generar códigos QR. Revisa tu conexión a internet."));
            };
            document.body.appendChild(script);
        });
    };

    const { year, month } = useMemo(() => ({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
    }), [currentDate]);

    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const placeholders = Array.from({ length: dayOffset }, () => null);
        return [...placeholders, ...days];
    }, [year, month]);

    const recordTypeMapping: { [key in RecordType]: RecordItemType } = {
        'Temperatura Nevera': 'refrigerator',
        'Temperatura Congelador': 'freezer',
        'Limpieza Freidoras': 'fryer',
        'Limpieza General': 'cleaningZone',
    };
    
    const itemsForSelectedType = useMemo(() => {
        const itemType = recordTypeMapping[selectedRecordType];
        switch(itemType) {
            case 'refrigerator': return refrigerators;
            case 'freezer': return freezers;
            case 'fryer': return fryers;
            case 'cleaningZone': return cleaningZones;
            default: return [];
        }
    }, [selectedRecordType, refrigerators, freezers, fryers, cleaningZones]);

    useEffect(() => {
        if (itemsForSelectedType.length > 0 && !itemsForSelectedType.find(i => i.id === selectedItemForPrint)) {
            setSelectedItemForPrint(itemsForSelectedType[0].id);
        } else if (itemsForSelectedType.length === 0) {
            setSelectedItemForPrint('');
        }
    }, [itemsForSelectedType, selectedItemForPrint]);


    const recordsForGrid = useMemo(() => {
        const itemType = recordTypeMapping[selectedRecordType];
        const relevantRecords = appccRecords.filter(rec => rec.itemType === itemType && new Date(rec.date).getMonth() === month && new Date(rec.date).getFullYear() === year);
        const groupedByDay: { [day: number]: AppccRecord[] } = {};
        relevantRecords.forEach(rec => {
            const dayOfMonth = new Date(rec.date).getDate();
            if (!groupedByDay[dayOfMonth]) {
                groupedByDay[dayOfMonth] = [];
            }
            groupedByDay[dayOfMonth].push(rec);
        });
        return groupedByDay;
    }, [selectedRecordType, appccRecords, month, year]);
    
     const handleDownloadFilledLog = () => {
        if (!selectedItemForPrint) {
            alert('Por favor, selecciona un equipo para descargar el registro.');
            return;
        }
        const generatorMap = {
            'Temperatura Nevera': generateRefrigeratorLogHtml,
            'Temperatura Congelador': generateFreezerLogHtml,
            'Limpieza Freidoras': generateFryerCleaningLogHtml,
            'Limpieza General': generateGeneralCleaningLogHtml
        };
        const generator = generatorMap[selectedRecordType];
        if (generator) {
            const recordsForItem = appccRecords.filter(r => r.itemId === selectedItemForPrint);
            const html = generator(settings, currentDate, recordsForItem, employees);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); }, 500);
            }
        }
    };
    
    const handleGenerateSingleQr = async (item: RecordableItem, type: RecordItemType) => {
        try {
            const QRCode = await loadQrCodeLibrary();
            const baseUrl = `${window.location.origin}${window.location.pathname}`;
            const url = `${baseUrl}?t=${type}&id=${item.id}`;
            const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'H', width: 256 });
            setQrModalData({ name: item.name, dataUrl });
        } catch (error) {
            alert(error instanceof Error ? error.message : String(error));
        }
    };
    
    const handlePrintQr = () => {
        if (!qrModalData) return;
        const html = `
            <!DOCTYPE html><html lang="es"><head><title>QR Code - ${qrModalData.name}</title>
            <style>
                @page { size: 10cm 10cm; margin: 0.5cm; }
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; }
                img { width: 8cm; height: 8cm; }
                p { font-weight: bold; font-size: 18pt; margin-top: 0.5cm; }
            </style></head><body>
                <img src="${qrModalData.dataUrl}" alt="QR Code">
                <p>${qrModalData.name}</p>
                <script>window.onload=()=>{setTimeout(()=>window.print(), 250)}</script>
            </body></html>`;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto h-full flex flex-col">
            <div className="bg-base-200 p-4 rounded-xl shadow-lg mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-base-content">Registros APPCC</h2>
                <p className="text-base-content/70 mt-1">Gestiona tus equipos, genera QRs y visualiza los registros diarios.</p>
            </div>
            
            {/* Config Section */}
            <div className="bg-base-200 p-4 rounded-xl shadow-inner mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-base-content mb-4 border-b border-primary/20 pb-2">Configuración de Equipos y QRs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <RecordableItemManager title="Neveras" items={refrigerators} type="refrigerator" appData={appData} onGenerateQr={handleGenerateSingleQr}/>
                    <RecordableItemManager title="Congeladores" items={freezers} type="freezer" appData={appData} onGenerateQr={handleGenerateSingleQr}/>
                    <RecordableItemManager title="Freidoras" items={fryers} type="fryer" appData={appData} onGenerateQr={handleGenerateSingleQr}/>
                    <RecordableItemManager title="Zonas de Limpieza" items={cleaningZones} type="cleaningZone" appData={appData} onGenerateQr={handleGenerateSingleQr}/>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-base-200 p-4 rounded-xl shadow-inner flex-grow flex flex-col">
                 <h3 className="text-xl font-bold text-base-content mb-4 border-b border-primary/20 pb-2">Calendario de Registros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                    <div className="flex items-center bg-base-300 p-1 rounded-lg">
                         <select value={month} onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))} className="select select-ghost flex-grow">
                            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })}</option>)}
                        </select>
                         <select value={year} onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))} className="select select-ghost">
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-base-content/80 mb-1">Tipo de Registro a Visualizar</label>
                        <select value={selectedRecordType} onChange={(e) => setSelectedRecordType(e.target.value as RecordType)} className="select select-bordered w-full bg-base-300">
                            {['Temperatura Nevera', 'Temperatura Congelador', 'Limpieza Freidoras', 'Limpieza General'].map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-base-content/80 mb-1">Descargar Plantilla Rellena</label>
                        <div className="flex items-end gap-2">
                             <select value={selectedItemForPrint} onChange={e => setSelectedItemForPrint(e.target.value)} className="select select-bordered w-full bg-base-300" disabled={itemsForSelectedType.length === 0}>
                                <option value="" disabled>{itemsForSelectedType.length === 0 ? 'Añade equipos...' : 'Selecciona equipo...'}</option>
                                {itemsForSelectedType.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <button onClick={handleDownloadFilledLog} className="btn btn-primary" disabled={!selectedItemForPrint}>Descargar</button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-7 text-center font-bold text-primary border-b-2 border-primary/20 pb-2 mb-2">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 flex-grow">
                     {calendarGrid.map((day, index) => (
                        <div key={index} className={`rounded-md flex flex-col items-center justify-start p-1 min-h-[80px] ${day ? 'bg-base-300' : 'bg-transparent'}`}>
                            {day && ( <>
                                <span className="text-sm font-semibold text-base-content/70">{day.getDate()}</span>
                                {recordsForGrid[day.getDate()] && (
                                    <div className="flex-grow flex items-center justify-center w-full">
                                        <button onClick={() => setModalData({ date: day, records: recordsForGrid[day.getDate()] })} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg hover:bg-green-400 transition-all">
                                            {recordsForGrid[day.getDate()].length}
                                        </button>
                                    </div>
                                )}
                            </> )}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Records Detail Modal */}
            {modalData && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setModalData(null)}>
                    <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-primary mb-4">
                            Registros del {modalData.date.toLocaleDateString('es-ES')}
                        </h3>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="table w-full">
                                <thead><tr><th>Equipo</th><th>Valor</th><th>Empleado</th><th>Notas</th></tr></thead>
                                <tbody>
                                    {modalData.records.map(rec => {
                                        const item = [...refrigerators, ...freezers, ...fryers, ...cleaningZones].find(i => i.id === rec.itemId);
                                        const employee = employees.find(e => e.id === rec.employeeId);
                                        return (
                                            <tr key={rec.id}>
                                                <td>{item?.name || 'N/A'}</td>
                                                <td>{Array.isArray(rec.value) ? rec.value.join(', ') : rec.value}</td>
                                                <td>{employee?.name || 'N/A'}</td>
                                                <td>{rec.notes || '-'}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                         <div className="text-right mt-6">
                            <button onClick={() => setModalData(null)} className="btn btn-primary">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrModalData && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setQrModalData(null)}>
                    <div className="bg-base-100 rounded-lg shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-primary mb-4">{qrModalData.name}</h3>
                        <img src={qrModalData.dataUrl} alt={`QR Code for ${qrModalData.name}`} className="mx-auto border-4 border-base-300 rounded-lg" />
                        <div className="mt-6 flex justify-center space-x-4">
                            <button onClick={() => setQrModalData(null)} className="btn btn-ghost">Cerrar</button>
                            <button onClick={handlePrintQr} className="btn btn-primary">Imprimir QR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
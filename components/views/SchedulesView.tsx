
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, Shift, FullSchedule, PersonnelNeeds, SpecialEvent, Settings } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, MinusIcon, TrashIcon, PrintMonthIcon, PrintWeekIcon, SparklesIcon, FlipIcon, SwitchHorizontalIcon } from '../icons';
import { generateMonthlyScheduleHtml, generateWeeklyScheduleHtml } from '../../services/printService';
import { generateWeeklyScheduleForAllEmployees } from '../../services/geminiService';


interface SchedulesViewProps {
  employees: Employee[];
  shifts: Shift[];
  schedule: FullSchedule;
  onUpdateSchedule: (employeeId: string, date: string, shiftId: string | null) => void;
  onBatchUpdateSchedule: (schedule: FullSchedule) => void;
  personnelNeeds: PersonnelNeeds;
  onUpdatePersonnelNeeds: (shiftId: string, day: string, count: number) => void;
  specialEvents: SpecialEvent[];
  onAddSpecialEvent: (event: Omit<SpecialEvent, 'id'>) => void;
  onRemoveSpecialEvent: (eventId: string) => void;
  onAddEmployee: (name: string, targetHours: number) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onRemoveEmployee: (employeeId: string) => void;
  onUpdateShift: (shift: Shift) => void;
  settings: Settings;
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const calculateHoursFromString = (timeString: string): number => {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split('-').map(p => p.trim());
  let totalHours = 0;
  for (const part of parts) {
    const times = part.split('/').map(t => t.trim());
    if (times.length === 2) {
      const [startStr, endStr] = times;
      const startMatch = startStr.match(/^(\d{1,2}):(\d{2})$/);
      const endMatch = endStr.match(/^(\d{1,2}):(\d{2})$/);
      if (startMatch && endMatch) {
        try {
          const startHour = parseInt(startMatch[1], 10);
          const startMinute = parseInt(startMatch[2], 10);
          const endHour = parseInt(endMatch[1], 10);
          const endMinute = parseInt(endMatch[2], 10);
          if (startHour > 23 || startMinute > 59 || endHour > 23 || endMinute > 59) continue;
          let startTotalMinutes = startHour * 60 + startMinute;
          let endTotalMinutes = endHour * 60 + endMinute;
          if (endTotalMinutes < startTotalMinutes) endTotalMinutes += 24 * 60;
          totalHours += (endTotalMinutes - startTotalMinutes) / 60;
        } catch (e) { continue; }
      }
    }
  }
  return Math.round(totalHours * 100) / 100;
};


export const SchedulesView: React.FC<SchedulesViewProps> = ({ 
    employees, shifts, schedule, onUpdateSchedule, onBatchUpdateSchedule,
    personnelNeeds, onUpdatePersonnelNeeds,
    specialEvents, onAddSpecialEvent, onRemoveSpecialEvent,
    onAddEmployee, onUpdateEmployee, onRemoveEmployee, onUpdateShift,
    settings
}) => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-10-01T12:00:00Z'));
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [localPersonnelNeeds, setLocalPersonnelNeeds] = useState<{[key: string]: {[key: string]: number | ''}}>(personnelNeeds);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isMobileStatsVisible, setIsMobileStatsVisible] = useState(false);
  const [balanceStartDate, setBalanceStartDate] = useState<Date | null>(() => new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1)));

  const [collapsedSections, setCollapsedSections] = useState({
    legend: true,
    events: true,
    management: false,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => setLocalPersonnelNeeds(personnelNeeds), [personnelNeeds]);

  const addMonths = (date: Date, months: number) => {
    const newDate = new Date(date);
    newDate.setUTCDate(1);
    newDate.setUTCMonth(newDate.getUTCMonth() + months);
    return newDate;
  };
  
  const handlePrevWeek = () => {
    setCurrentWeekIndex(p => p > 0 ? p - 1 : weeksInMonth.length - 1);
  };
  const handleNextWeek = () => {
    setCurrentWeekIndex(p => p < weeksInMonth.length - 1 ? p + 1 : 0);
  };

  const { year, month } = useMemo(() => ({
    year: currentDate.getUTCFullYear(),
    month: currentDate.getUTCMonth(),
  }), [currentDate]);

  const daysInMonthArray = useMemo(() => {
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Array.from({ length: days }, (_, i) => new Date(Date.UTC(year, month, i + 1)));
  }, [year, month]);

  const weeksInMonth = useMemo(() => {
    const weeks: Date[][] = [];
    const firstDate = new Date(Date.UTC(year, month, 1));
    const firstDayOfWeek = (firstDate.getUTCDay() + 6) % 7;
    const startDate = new Date(firstDate);
    startDate.setUTCDate(firstDate.getUTCDate() - firstDayOfWeek);
    let currentDay = new Date(startDate);
    while (currentDay.getUTCMonth() <= month || currentDay.getUTCFullYear() < year) {
        if (currentDay.getUTCFullYear() > year) break;
        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(currentDay));
            currentDay.setUTCDate(currentDay.getUTCDate() + 1);
        }
        weeks.push(week);
        if (currentDay.getUTCMonth() > month && currentDay.getUTCDay() === 1) break;
    }
    return weeks.filter(week => week.some(day => day.getUTCMonth() === month));
  }, [year, month]);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  
  const displayedDays = useMemo(() => {
    return viewMode === 'week' ? (weeksInMonth[currentWeekIndex] || []) : daysInMonthArray;
  }, [viewMode, daysInMonthArray, weeksInMonth, currentWeekIndex]);

  useEffect(() => {
      const today = new Date();
      today.setUTCHours(0,0,0,0);
      if (today.getUTCFullYear() === year && today.getUTCMonth() === month) {
          const weekIndex = weeksInMonth.findIndex(week => week.some(day => day.getTime() === today.getTime()));
          setCurrentWeekIndex(weekIndex !== -1 ? weekIndex : 0);
      } else {
          setCurrentWeekIndex(0);
      }
  }, [year, month, weeksInMonth]);
  

  const shiftsById = useMemo(() => shifts.reduce((acc, shift) => ({ ...acc, [shift.id]: shift }), {} as { [id: string]: Shift }), [shifts]);
  const workShifts = useMemo(() => shifts.filter(s => s.id.startsWith('T')), [shifts]);
  const offShifts = useMemo(() => shifts.filter(s => !s.id.startsWith('T')), [shifts]);

  const formatToISODate = (date: Date) => date.toISOString().split('T')[0];
  
  const specialEventsMap = useMemo(() => new Map(specialEvents.map(e => [e.date, e.description])), [specialEvents]);
  
  const dailyShiftCounts = useMemo(() => {
    const counts: { [dateStr: string]: { [shiftId: string]: number } } = {};
    daysInMonthArray.forEach(date => {
      const dateStr = formatToISODate(date);
      counts[dateStr] = {};
      workShifts.forEach(shift => counts[dateStr][shift.id] = 0);
      employees.forEach(emp => {
        const shiftId = schedule[emp.id]?.[dateStr];
        if (shiftId && shiftsById[shiftId]?.hours > 0) counts[dateStr][shiftId]++;
      });
    });
    return counts;
  }, [schedule, employees, shiftsById, daysInMonthArray, workShifts]);

  const cumulativeBalances = useMemo(() => {
    const balances: { [employeeId: string]: number } = {};
    if (!balanceStartDate) return balances;

    const endDate = new Date(Date.UTC(year, month + 1, 0));

    employees.forEach(employee => {
        const employeeSchedule = schedule[employee.id] || {};
        
        const workedHours = Object.keys(employeeSchedule).reduce((acc, dateStr) => {
            const shiftDate = new Date(dateStr + 'T00:00:00Z');
            if (shiftDate >= balanceStartDate && shiftDate <= endDate) {
                const shiftId = employeeSchedule[dateStr];
                const hours = shiftId ? (shiftsById[shiftId]?.hours || 0) : 0;
                return acc + hours;
            }
            return acc;
        }, 0);

        const diffTime = endDate.getTime() - balanceStartDate.getTime();
        if (diffTime < 0) {
            balances[employee.id] = workedHours;
            return;
        }

        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const dailyTarget = employee.targetHours / 30.44;
        const targetHours = diffDays * dailyTarget;
        
        balances[employee.id] = workedHours - targetHours;
    });
    
    return balances;
  }, [employees, schedule, shiftsById, balanceStartDate, year, month]);

  const handlePersonnelNeedsChange = (shiftId: string, day: string, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
        setLocalPersonnelNeeds(prev => ({
            ...prev,
            [shiftId]: {
                ...(prev[shiftId] || {}),
                [day]: value === '' ? '' : parseInt(value, 10)
            }
        }));
    }
  };

  const handlePersonnelNeedsBlur = (shiftId: string, day: string) => {
      const currentValue = localPersonnelNeeds[shiftId]?.[day];
      const finalValue = typeof currentValue === 'number' ? currentValue : 0;
      
      setLocalPersonnelNeeds(prev => ({
          ...prev,
          [shiftId]: {
              ...(prev[shiftId] || {}),
              [day]: finalValue
          }
      }));

      onUpdatePersonnelNeeds(shiftId, day, finalValue);
  };
  
  const handleGenerateWeeklySchedule = async () => {
      if (employees.length === 0) {
          alert("Añade empleados antes de generar un horario.");
          return;
      }
      const weekDates = weeksInMonth[currentWeekIndex];
      if (!weekDates || weekDates.length === 0) return;

      setIsGeneratingSchedule(true);
      try {
          const response = await generateWeeklyScheduleForAllEmployees(employees, shifts, personnelNeeds, weekDates);
          
          const weeklyScheduleUpdates: FullSchedule = {};
          response.forEach(employeeSchedule => {
              if (!weeklyScheduleUpdates[employeeSchedule.employeeId]) {
                  weeklyScheduleUpdates[employeeSchedule.employeeId] = {};
              }
              employeeSchedule.schedule.forEach(item => {
                  weeklyScheduleUpdates[employeeSchedule.employeeId][item.date] = item.shiftId;
              });
          });

          onBatchUpdateSchedule(weeklyScheduleUpdates);

      } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          alert(`No se pudo generar el horario semanal. Error: ${msg}`);
      } finally {
          setIsGeneratingSchedule(false);
      }
  };

  const handlePrintMonth = () => {
    const html = generateMonthlyScheduleHtml(employees, schedule, shifts, settings, year, month);
    const printWindow = window.open('', '_blank');
    if (printWindow) { printWindow.document.write(html); printWindow.document.close(); }
  };

  const handlePrintCurrentWeek = () => {
    const weekToPrint = weeksInMonth[currentWeekIndex];
    if (weekToPrint) {
      const html = generateWeeklyScheduleHtml(employees, schedule, shifts, settings, weekToPrint);
      const printWindow = window.open('', '_blank');
      if (printWindow) { 
        printWindow.document.write(html); 
        printWindow.document.close(); 
      }
    }
  };

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-lg flex flex-col">
      {/* Unified Header */}
      <div className="flex items-center justify-center md:justify-between flex-wrap gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-base-content">Horarios</h2>
          <button onClick={() => setViewMode(prev => prev === 'month' ? 'week' : 'month')} className="btn btn-sm btn-circle btn-ghost hidden md:inline-flex" title={viewMode === 'month' ? 'Cambiar a vista semanal' : 'Cambiar a vista mensual'}>
              <SwitchHorizontalIcon />
          </button>
          {viewMode === 'week' && (
              <button onClick={handleGenerateWeeklySchedule} disabled={isGeneratingSchedule} className="p-1 text-primary hover:text-primary-focus disabled:text-base-content/50 transition-colors" title="Generar horario para esta semana con IA">
                  {isGeneratingSchedule ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"/> : <SparklesIcon />}
              </button>
          )}
          {viewMode === 'month' 
            ? <button onClick={handlePrintMonth} className="btn btn-sm btn-circle btn-ghost" title="Exportar horario mensual"><PrintMonthIcon /></button>
            : <button onClick={handlePrintCurrentWeek} className="btn btn-sm btn-circle btn-ghost" title="Exportar horario semanal"><PrintWeekIcon /></button>
          }
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="btn btn-sm btn-square btn-ghost"><ChevronLeftIcon /></button>
          <span className="text-lg font-semibold w-48 text-center">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, c => c.toUpperCase())}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="btn btn-sm btn-square btn-ghost"><ChevronRightIcon /></button>
        </div>
      </div>
      
      {/* Conditional Weekly Header */}
      {viewMode === 'week' && (
          <div className="flex items-center justify-center p-2 bg-base-300 rounded-lg my-2 flex-shrink-0">
              <button onClick={handlePrevWeek} className="btn btn-sm btn-square btn-ghost"><ChevronLeftIcon /></button>
              <span className="font-semibold text-center text-sm w-64">
                  {`Semana: ${weeksInMonth[currentWeekIndex]?.[0]?.toLocaleDateString('es-ES', {day: 'numeric', month:'short', timeZone: 'UTC'})} - ${weeksInMonth[currentWeekIndex]?.[6]?.toLocaleDateString('es-ES', {day: 'numeric', month:'short', timeZone: 'UTC'})}`}
              </span>
              <button onClick={handleNextWeek} className="btn btn-sm btn-square btn-ghost"><ChevronRightIcon /></button>
          </div>
      )}

      {/* Unified Schedule Table */}
      <div className="overflow-auto flex-grow relative">
        <table className="w-full border-collapse text-xs whitespace-nowrap table-fixed">
          <thead className="sticky top-0 z-20 bg-base-300">
            <tr>
              <th className="p-1 text-left font-semibold border-r border-base-100 w-24 md:w-48 sticky left-0 z-30 bg-base-300">
                <div className="flex items-center justify-between">
                  {isGeneratingSchedule ? (
                      <div className="flex items-center gap-2 text-primary w-full">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"/>
                          <span>Generando...</span>
                      </div>
                  ) : (
                      <span>Empleado</span>
                  )}
                  {viewMode === 'week' && !isGeneratingSchedule && (
                      <button onClick={() => setIsMobileStatsVisible(p => !p)} className="md:hidden btn btn-xs btn-square btn-ghost transition-transform duration-300 ease-in-out" style={{ transform: isMobileStatsVisible ? 'scaleX(-1)' : 'scaleX(1)' }} aria-label={isMobileStatsVisible ? "Mostrar turnos" : "Mostrar estadísticas"} title={isMobileStatsVisible ? "Mostrar turnos" : "Mostrar estadísticas"}><FlipIcon /></button>
                  )}
                </div>
              </th>
              
              {isMobileStatsVisible && viewMode === 'week' ? (
                <>
                  <th className="md:hidden p-1 text-center font-semibold w-12">Total Sem.</th>
                  <th className="md:hidden p-1 text-center font-semibold w-12">Obj. Sem.</th>
                  <th className="md:hidden p-1 text-center font-semibold w-12">Bal. Sem.</th>
                  <th className="md:hidden p-1 text-center font-semibold w-12">Bal. Acum.</th>
                </>
              ) : (
                displayedDays.map(date => {
                  const isWeekend = [0, 6].includes(date.getUTCDay());
                  const isEvent = specialEventsMap.has(formatToISODate(date));
                  const dayWidthClass = viewMode === 'week' ? 'w-9 min-w-[2.25rem]' : 'w-6 min-w-[1.5rem]';
                  return (
                    <th key={date.toISOString()} className={`p-1 text-center font-semibold border-b border-base-100 ${dayWidthClass} ${isEvent ? 'bg-yellow-500/30' : ''}`}>
                      <div className={isWeekend ? 'text-primary' : ''}>{date.toLocaleString('es-ES', { weekday: 'short', timeZone: 'UTC' })}</div>
                      <div className={isWeekend ? 'text-primary' : ''}>{date.getUTCDate()}</div>
                    </th>
                  );
                })
              )}
              <th className="hidden md:table-cell p-1 text-center font-semibold border-l border-base-100 w-16 min-w-[4rem]">
                <div>Total</div>
                <div className="text-xs font-normal">{viewMode === 'week' ? 'Semanal' : 'Mensual'}</div>
              </th>
              <th className="hidden md:table-cell p-1 text-center font-semibold w-16 min-w-[4rem]">
                <div>Objetivo</div>
                <div className="text-xs font-normal">{viewMode === 'week' ? 'Semanal' : 'Mensual'}</div>
              </th>
               <th className="hidden md:table-cell p-1 text-center font-semibold w-16 min-w-[4rem]">
                <div>Balance</div>
                <div className="text-xs font-normal">{viewMode === 'week' ? 'Semanal' : 'Mensual'}</div>
              </th>
              <th className="hidden md:table-cell p-1 text-center font-semibold w-28 min-w-[7rem]">
                <div>Balance Desde</div>
                 <input 
                    type="date"
                    className="bg-base-100 text-base-content rounded-md p-1 mt-1 w-full text-xs no-calendar-icon"
                    value={balanceStartDate ? balanceStartDate.toISOString().split('T')[0] : ''}
                    onChange={e => {
                        const dateVal = e.target.value;
                        setBalanceStartDate(dateVal ? new Date(dateVal + 'T00:00:00Z') : null);
                    }}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => <EmployeeRow key={employee.id} employee={employee} days={displayedDays} schedule={schedule} shifts={shifts} onUpdateSchedule={onUpdateSchedule} onUpdateEmployee={onUpdateEmployee} onRemoveEmployee={onRemoveEmployee} showMobileStats={isMobileStatsVisible && viewMode === 'week'} viewMode={viewMode} cumulativeBalance={cumulativeBalances[employee.id] || 0} />)}
          </tbody>
        </table>
      </div>

      <div className="pt-4 flex-shrink-0">
          <button onClick={() => onAddEmployee('Nuevo Empleado', 160)} className="flex items-center font-medium text-base-content hover:text-primary transition-colors">
              <PlusIcon className="h-5 w-5 mr-1" />
              <span>Añadir Empleado</span>
          </button>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-xs pt-4 md:pt-6 flex-shrink-0">
          <ManagementSection title="Leyenda" isCollapsed={collapsedSections.legend} onToggle={() => toggleSection('legend')}><Legend offShifts={offShifts} onUpdateShift={onUpdateShift} /></ManagementSection>
          <ManagementSection title="Próximos Eventos" isCollapsed={collapsedSections.events} onToggle={() => toggleSection('events')}><Events specialEvents={specialEvents} onAddSpecialEvent={onAddSpecialEvent} onRemoveSpecialEvent={onRemoveSpecialEvent} /></ManagementSection>
          <ManagementSection title="Gestión del Personal" isCollapsed={collapsedSections.management} onToggle={() => toggleSection('management')}><PersonnelTable workShifts={workShifts} localPersonnelNeeds={localPersonnelNeeds} handlePersonnelNeedsChange={handlePersonnelNeedsChange} handlePersonnelNeedsBlur={handlePersonnelNeedsBlur} onUpdateShift={onUpdateShift}/></ManagementSection>
      </div>
    </div>
  );
};

const EmployeeRow: React.FC<{
    employee: Employee;
    days: Date[];
    schedule: FullSchedule;
    shifts: Shift[];
    onUpdateSchedule: (employeeId: string, date: string, shiftId: string | null) => void;
    onUpdateEmployee: (employee: Employee) => void;
    onRemoveEmployee: (employeeId: string) => void;
    showMobileStats: boolean;
    viewMode: 'month' | 'week';
    cumulativeBalance: number;
}> = ({ employee, days, schedule, shifts, onUpdateSchedule, onUpdateEmployee, onRemoveEmployee, showMobileStats, viewMode, cumulativeBalance }) => {
    const [name, setName] = useState(employee.name);
    const [displayTargetHours, setDisplayTargetHours] = useState('');

    useEffect(() => {
        setName(employee.name);
        if (viewMode === 'week') {
            setDisplayTargetHours((employee.targetHours / 4).toFixed(1));
        } else {
            setDisplayTargetHours(String(employee.targetHours));
        }
    }, [employee, viewMode]);

    const handleTargetHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayTargetHours(e.target.value);
    };
    
    const handleSaveEmployee = () => {
        const newTarget = parseFloat(displayTargetHours.replace(',', '.'));
        let monthlyTarget: number;

        if (isNaN(newTarget) || newTarget < 0) {
            monthlyTarget = employee.targetHours;
        } else {
            if (viewMode === 'week') {
                monthlyTarget = newTarget * 4;
            } else {
                monthlyTarget = newTarget;
            }
            monthlyTarget = Math.round(monthlyTarget);
        }
        
        onUpdateEmployee({ ...employee, name, targetHours: monthlyTarget });
    };

    const handleRemove = () => {
        onRemoveEmployee(employee.id);
    };

    const shiftsById = useMemo(() => shifts.reduce((acc, shift) => ({ ...acc, [shift.id]: shift }), {} as { [id: string]: Shift }), [shifts]);
    const totalHours = useMemo(() => days.reduce((acc, date) => {
        const dateStr = date.toISOString().split('T')[0];
        const shiftId = schedule[employee.id]?.[dateStr];
        return acc + (shiftId && shiftsById[shiftId] ? shiftsById[shiftId].hours : 0);
    }, 0), [days, schedule, employee.id, shiftsById]);

    const targetForPeriod = viewMode === 'week' ? employee.targetHours / 4 : employee.targetHours;
    const balanceForPeriod = totalHours - targetForPeriod;
    const balanceForPeriodColor = balanceForPeriod < 0 ? 'text-red-400' : 'text-green-400';

    const targetHoursInput = (className: string) => (
        <input
            type="number"
            step="0.1"
            value={displayTargetHours}
            onChange={handleTargetHoursChange}
            onBlur={handleSaveEmployee}
            className={`bg-base-300 text-center focus:outline-none focus:bg-base-100 rounded ${className}`}
            aria-label={`Horas objetivo para ${name}`}
        />
    );

    return (
        <tr className="group h-10">
            <td className="p-1 font-medium border-r border-base-100 sticky left-0 bg-base-200 z-10">
                <div className="flex items-center justify-between gap-1">
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        onBlur={handleSaveEmployee} 
                        className="bg-transparent flex-1 focus:outline-none focus:bg-base-300 rounded px-1 min-w-0"
                    />
                    <button 
                        onClick={handleRemove}
                        className="btn btn-xs btn-square btn-error opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        aria-label={`Eliminar a ${name}`}
                    >
                        <TrashIcon />
                    </button>
                </div>
            </td>
            {showMobileStats ? (
                <>
                    <td className="md:hidden p-1 text-center font-bold">{totalHours.toFixed(1)}H</td>
                    <td className="md:hidden p-1 text-center">{targetHoursInput("w-12")}</td>
                    <td className={`md:hidden p-1 text-center font-bold ${balanceForPeriodColor}`}>{balanceForPeriod > 0 ? `+${balanceForPeriod.toFixed(1)}` : balanceForPeriod.toFixed(1)}H</td>
                    <td className={`md:hidden p-1 text-center font-bold ${cumulativeBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>{cumulativeBalance > 0 ? `+${cumulativeBalance.toFixed(1)}` : cumulativeBalance.toFixed(1)}H</td>
                </>
            ) : (
                 days.map(date => <td key={date.toISOString()} className="p-0 border-t border-base-100"><ShiftSelectCell employee={employee} date={date} schedule={schedule} shifts={shifts} onUpdateSchedule={onUpdateSchedule} /></td>)
            )}
            <td className="hidden md:table-cell p-1 text-center font-bold border-l border-base-100">{totalHours.toFixed(1)}H</td>
            <td className="hidden md:table-cell p-1 text-center">{targetHoursInput("w-16 bg-base-300")}</td>
            <td className={`hidden md:table-cell p-1 text-center font-bold ${balanceForPeriodColor}`}>{balanceForPeriod > 0 ? `+${balanceForPeriod.toFixed(1)}` : balanceForPeriod.toFixed(1)}H</td>
            <td className={`hidden md:table-cell p-1 text-center font-bold ${cumulativeBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>{cumulativeBalance > 0 ? `+${cumulativeBalance.toFixed(1)}` : cumulativeBalance.toFixed(1)}H</td>
        </tr>
    );
};
const ShiftSelectCell: React.FC<{ employee: Employee; date: Date; schedule: FullSchedule; shifts: Shift[]; onUpdateSchedule: (employeeId: string, date: string, shiftId: string | null) => void; }> = ({ employee, date, schedule, shifts, onUpdateSchedule }) => {
    const dateStr = date.toISOString().split('T')[0];
    const shiftId = schedule[employee.id]?.[dateStr];
    const shiftsById = useMemo(() => shifts.reduce((acc, shift) => ({ ...acc, [shift.id]: shift }), {} as { [id: string]: Shift }), [shifts]);
    const shift = shiftId ? shiftsById[shiftId] : null;
    let textColor = shift?.textColor || '';
    
    const bgColor = (shift?.color && shift.color !== 'bg-transparent') 
        ? shift.color 
        : 'bg-base-200';

    return <select value={shiftId || ''} onChange={(e) => onUpdateSchedule(employee.id, dateStr, e.target.value || null)} className={`w-full h-10 text-center appearance-none focus:outline-none focus:bg-primary/20 font-bold accent-orange-600 ${textColor} ${bgColor}`}>
        <option value="" className="bg-base-200 text-base-content"></option>
        <optgroup label="Turnos" className="bg-base-300 text-white font-bold">
            {shifts.filter(s=>s.hours>0).map(s => <option key={s.id} value={s.id} className="bg-base-200 text-base-content">{s.id}</option>)}
        </optgroup>
        <optgroup label="Descansos" className="bg-base-300 text-white font-bold">
            {shifts.filter(s=>s.hours===0).map(s => <option key={s.id} value={s.id} className="bg-base-200 text-base-content">{s.id}</option>)}
        </optgroup>
    </select>;
};

const ManagementSection: React.FC<{
    title: string, 
    children: React.ReactNode,
    isCollapsed: boolean,
    onToggle: () => void
}> = ({ title, children, isCollapsed, onToggle }) => (
    <div className="bg-base-300 p-2 rounded-lg">
        <div className="flex justify-between items-center mb-2 border-b border-primary/20 pb-1">
            <h3 className="font-bold text-sm text-primary">{title}</h3>
            <div className="flex items-center space-x-2">
                {title === "Gestión del Personal" && (
                    <div className="flex items-center space-x-3 text-xs">
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"/>Falta</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-400 mr-1"/>OK</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-400 mr-1"/>Sobra</span>
                    </div>
                )}
                <button 
                    onClick={onToggle} 
                    className="btn btn-xs btn-square btn-ghost md:hidden"
                    aria-expanded={!isCollapsed}
                    aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
                >
                    {isCollapsed ? <PlusIcon className="h-4 w-4" /> : <MinusIcon className="h-4 w-4" />}
                </button>
            </div>
        </div>
        <div id={`section-content-${title.replace(/\s+/g, '-')}`} className={`${isCollapsed ? 'hidden md:block' : 'block'}`}>
            {children}
        </div>
    </div>
);

const PersonnelTable: React.FC<{
    workShifts: Shift[],
    localPersonnelNeeds: { [key: string]: { [key: string]: number | '' } },
    handlePersonnelNeedsChange: (shiftId: string, day: string, value: string) => void,
    handlePersonnelNeedsBlur: (shiftId: string, day: string) => void,
    onUpdateShift: (shift: Shift) => void
}> = ({ workShifts, localPersonnelNeeds, handlePersonnelNeedsChange, handlePersonnelNeedsBlur, onUpdateShift }) => {
    return (
        <table className="w-full text-center" style={{ fontSize: '0.7rem', lineHeight: '1rem' }}>
            <thead>
                <tr>
                    <th className="font-semibold p-1 text-left">Turno</th>
                    {WEEK_DAYS.map(d => <th key={d} className="font-semibold p-1 w-8">{d}</th>)}
                </tr>
            </thead>
            <tbody>
                {workShifts.map(s => (
                    <tr key={s.id}>
                        <td className="p-1 font-medium">
                            <div className="flex items-center gap-1">
                                <span className="font-bold w-8 text-center">{s.name}</span>
                                <input
                                    type="text"
                                    value={s.description || ''}
                                    placeholder="HH:MM/HH:MM..."
                                    onChange={e => {
                                        const desc = e.target.value;
                                        onUpdateShift({ ...s, description: desc, hours: calculateHoursFromString(desc) });
                                    }}
                                    className="bg-transparent flex-grow text-base-content/70 focus:outline-none focus:bg-base-100 rounded px-1 w-full"
                                />
                            </div>
                        </td>
                        {WEEK_DAYS.map(d => (
                            <td key={d}>
                                <input
                                    type="number"
                                    min="0"
                                    value={localPersonnelNeeds[s.id]?.[d] ?? ''}
                                    onChange={e => handlePersonnelNeedsChange(s.id, d, e.target.value)}
                                    onBlur={() => handlePersonnelNeedsBlur(s.id, d)}
                                    className="w-8 bg-base-100 text-center rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const Legend: React.FC<{ offShifts: Shift[]; onUpdateShift: (shift: Shift) => void }> = ({ offShifts, onUpdateShift }) => {
    const [editableShifts, setEditableShifts] = useState(offShifts);

    useEffect(() => {
        setEditableShifts(offShifts);
    }, [offShifts]);

    const handleDescriptionChange = (shiftId: string, newDescription: string) => {
        setEditableShifts(prev => prev.map(s => s.id === shiftId ? { ...s, description: newDescription } : s));
    };

    const handleBlur = (shiftId: string) => {
        const updatedShift = editableShifts.find(s => s.id === shiftId);
        if (updatedShift) {
            onUpdateShift(updatedShift);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-2">
            {editableShifts.map(s => (
                <div key={s.id} className="flex items-center space-x-2">
                    <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded font-bold ${s.color} ${s.textColor || 'text-white'}`}>{s.id}</div>
                    <input
                        type="text"
                        value={s.description || ''}
                        onChange={(e) => handleDescriptionChange(s.id, e.target.value)}
                        onBlur={() => handleBlur(s.id)}
                        className="bg-transparent w-full focus:outline-none focus:bg-base-100 rounded px-1 py-0.5"
                        placeholder="Descripción"
                    />
                </div>
            ))}
        </div>
    );
};


const Events: React.FC<{ specialEvents: SpecialEvent[], onAddSpecialEvent: (event: Omit<SpecialEvent, 'id'>) => void, onRemoveSpecialEvent: (id: string) => void }> = ({ specialEvents, onAddSpecialEvent, onRemoveSpecialEvent }) => {
    const [date, setDate] = useState('');
    const [desc, setDesc] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (date && desc) {
            onAddSpecialEvent({ date, description: desc });
            setDate('');
            setDesc('');
        }
    };
    return (
        <>
            <form onSubmit={handleSubmit} className="flex items-center space-x-1">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-xs bg-base-100 w-32" />
                <input type="text" placeholder="Descripción..." value={desc} onChange={e => setDesc(e.target.value)} className="input-xs bg-base-100 flex-grow" />
                <button type="submit" className="btn btn-xs btn-square bg-primary hover:bg-primary-focus text-primary-content"><PlusIcon /></button>
            </form>
            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                {specialEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => (
                    <div key={e.id} className="flex justify-between items-center bg-base-100 p-1 rounded">
                        <span>{new Date(e.date + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}: {e.description}</span>
                    </div>
                ))}
            </div>
        </>
    );
};
export enum IngredientUnit {
  KG = 'kg',
  L = 'l',
  PZ = 'pz'
}

export interface Ingredient {
  id: string;
  name: string;
  price: number; // Price per unit (kg, l, pz) - This is Precio Bruto
  supplier: string;
  unit: IngredientUnit;
  wastePercentage: number;
  supplierLink?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // in grams or ml
  wastePercentage: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  ingredients: RecipeIngredient[];
  preparationSteps: string[];
  allergens: string[];
  imageUrl?: string;
  description?: string;
  // New fields for escandallo
  coefficient?: number;
  pvp?: number; // Precio Venta Publico
  taxRate?: number; // e.g., 10 for 10%
  portionSize?: number; // in grams
}

export interface Shift {
  id: string;
  name: string;
  description?: string;
  hours: number;
  color: string;
  textColor?: string;
}

export interface Employee {
  id: string;
  name: string;
  targetHours: number;
}

export interface FullSchedule {
  [employeeId: string]: {
    [date: string]: string | null; // date is 'YYYY-MM-DD', value is shiftId
  };
}

export interface PersonnelNeeds {
  [shiftId: string]: {
    [dayOfWeek: string]: number; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  };
}

export interface SpecialEvent {
  id:string;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Settings {
  restaurantName: string;
  restaurantType: string;
  city: string;
  country: string;
  currency: string;
  defaultCoefficient: number;
  defaultTaxRate: number;
  logoUrl?: string;
}

export enum View {
  Menu = 'MENU',
  MenuPlanner = 'MENU_PLANNER',
  Database = 'DATABASE',
  Ingredients = 'INGREDIENTS',
  Schedules = 'SCHEDULES',
  Settings = 'SETTINGS',
  Records = 'RECORDS',
  FinancialReports = 'FINANCIAL_REPORTS',
}

export type ReportType = 'COST_DEVIATION' | 'MENU_ENGINEERING' | 'PREDICTIVE_INVENTORY' | 'LABOR_COST' | 'EXECUTIVE_SUMMARY';


export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface InvoiceProcessingResult {
  updates: {
    name: string;
    newPrice: number;
  }[];
  additions: {
    name: string;
    price: number;
    unit: IngredientUnit;
    supplier: string;
  }[];
}

export interface AllergenInfo {
  allergenName: string;
  status: 'ELIMINABLE' | 'NO ELIMINABLE' | 'SUSTITUIBLE';
  justification: string;
}

export interface KeyPoint {
  title: string;
  content: string;
}

export interface ServiceReportData {
  dishName: string;
  imageUrl?: string;
  keyPoints: KeyPoint[];
  allergenManagement: AllergenInfo[];
  ingredients: string[];
}

// --- New Records View Types ---
export interface RecordableItem {
  id: string;
  name: string;
}

export type RecordItemType = 'refrigerator' | 'freezer' | 'fryer' | 'cleaningZone';

export interface AppccRecord {
    id: string; // unique record ID
    itemId: string; // e.g., 'fridge-1'
    itemType: RecordItemType;
    employeeId: string;
    date: string; // 'YYYY-MM-DD'
    value: string | string[]; // Temp value, or ['Lim', 'Ace'] for fryer, or cleaned items for zone
    notes?: string;
}

export type RecordType = 'Temperatura Nevera' | 'Temperatura Congelador' | 'Limpieza Freidoras' | 'Limpieza General';

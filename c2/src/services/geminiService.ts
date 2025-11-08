import { Type } from "@google/genai";
// GoogleGenAI se importa dinámicamente para evitar problemas durante el build
import { Recipe, Settings, Ingredient, IngredientUnit, InvoiceProcessingResult, Employee, Shift, PersonnelNeeds, FullSchedule, ServiceReportData, RecordType } from '../types';

interface GeminiGeneratedRecipe {
  name: string;
  category: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: {
    name: string;
    quantity: number;
    wastePercentage: number;
  }[];
  preparationSteps: string[];
  allergens: string[];
}

export interface MenuSuggestions {
  'Entrantes Fríos': string[];
  'Entrantes Calientes': string[];
  'Platos Principales': string[];
  'Postres': string[];
}

export interface WeeklyMenuSuggestions {
    [day: string]: {
        [mealType: string]: string;
    };
}

export type AllEmployeesWeeklyScheduleResponse = {
    employeeId: string;
    schedule: {
        date: string;
        shiftId: string;
    }[];
}[];


const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the recipe." },
    category: {
        type: Type.STRING,
        description: "The most appropriate category for this recipe, chosen strictly from the provided list of available categories."
    },
    prepTime: { type: Type.INTEGER, description: "Preparation time in minutes." },
    cookTime: { type: Type.INTEGER, description: "Cooking time in minutes." },
    servings: { type: Type.INTEGER, description: "Number of servings the recipe makes." },
    ingredients: {
      type: Type.ARRAY,
      description: "List of ingredients for the recipe.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the ingredient." },
          quantity: { type: Type.NUMBER, description: "Quantity in grams (for solids) or ml (for liquids)." },
          wastePercentage: { type: Type.INTEGER, description: "Estimated waste percentage for this ingredient during prep (e.g., peeling, trimming). Integer from 0 to 100." },
        },
        required: ["name", "quantity", "wastePercentage"],
      }
    },
    preparationSteps: {
      type: Type.ARRAY,
      description: "Step-by-step instructions for preparing the dish.",
      items: { type: Type.STRING }
    },
    allergens: {
        type: Type.ARRAY,
        description: "List of potential allergens from the 14 major allergens list (e.g., Gluten, Lácteos, Frutos secos). If none, return an empty array.",
        items: { type: Type.STRING }
    }
  },
  required: ["name", "category", "prepTime", "cookTime", "servings", "ingredients", "preparationSteps", "allergens"],
};

const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        'Entrantes Fríos': {
            type: Type.ARRAY,
            description: "OBLIGATORIO: Un array con exactamente 10 sugerencias de entrantes fríos. Es fundamental que la respuesta contenga 10 elementos en este array.",
            items: { type: Type.STRING }
        },
        'Entrantes Calientes': {
            type: Type.ARRAY,
            description: "OBLIGATORIO: Un array con exactamente 10 sugerencias de entrantes calientes. Es fundamental que la respuesta contenga 10 elementos en este array.",
            items: { type: Type.STRING }
        },
        'Platos Principales': {
            type: Type.ARRAY,
            description: "OBLIGATORIO: Un array con exactamente 10 sugerencias de platos principales (carnes, pescados, etc.). Es fundamental que la respuesta contenga 10 elementos en este array.",
            items: { type: Type.STRING }
        },
        'Postres': {
            type: Type.ARRAY,
            description: "OBLIGATORIO: Un array con exactamente 10 sugerencias de postres. Es fundamental que la respuesta contenga 10 elementos en este array.",
            items: { type: Type.STRING }
        }
    },
    required: ['Entrantes Fríos', 'Entrantes Calientes', 'Platos Principales', 'Postres']
};

const invoiceSchema = {
  type: Type.OBJECT,
  properties: {
    updates: {
      type: Type.ARRAY,
      description: "List of existing ingredients to update.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the existing ingredient to update. Must match exactly one from the provided list." },
          newPrice: { type: Type.NUMBER, description: "The new price per unit (kg, l, or pz) extracted from the invoice." }
        },
        required: ["name", "newPrice"],
      },
    },
    additions: {
      type: Type.ARRAY,
      description: "List of new ingredients to add.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the new ingredient from the invoice." },
          price: { type: Type.NUMBER, description: "Price per unit (kg, l, or pz)." },
          unit: { type: Type.STRING, description: "The unit of measurement. Must be one of: 'kg', 'l', or 'pz'." },
          supplier: { type: Type.STRING, description: "Name of the supplier, if visible on the invoice. Otherwise, 'Desconocido'." },
        },
        required: ["name", "price", "unit", "supplier"],
      },
    }
  },
  required: ["updates", "additions"],
};

const serviceReportSchema = {
    type: Type.ARRAY,
    description: "An array of service report objects, one for each dish.",
    items: {
        type: Type.OBJECT,
        properties: {
            dishName: { type: Type.STRING, description: "The exact name of the dish." },
            keyPoints: {
                type: Type.ARRAY,
                description: "A list of key points and FAQs for the waitstaff.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The title of the key point (e.g., 'Descripción para el cliente', 'Maridaje Sugerido')." },
                        content: { type: Type.STRING, description: "The detailed content for the key point." }
                    },
                    required: ['title', 'content']
                }
            },
            allergenManagement: {
                type: Type.ARRAY,
                description: "Analysis of each allergen present in the dish.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        allergenName: { type: Type.STRING, description: "The name of the allergen." },
                        status: { type: Type.STRING, description: "The status of the allergen. Must be one of: 'ELIMINABLE', 'NO ELIMINABLE', 'SUSTITUIBLE'." },
                        justification: { type: Type.STRING, description: "A clear and concise explanation of why the allergen has that status and what can be done." }
                    },
                    required: ['allergenName', 'status', 'justification']
                }
            }
        },
        required: ['dishName', 'keyPoints', 'allergenManagement']
    }
};

export const askAIAssistant = async (query: string, recipes: Recipe[]): Promise<string> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) throw new Error("API Key is not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const recipeContext = recipes.map(r => ` - ${r.name} (Categoría: ${r.category}, Alérgenos: ${r.allergens.join(', ') || 'ninguno'})`).join('\n');
    
    const prompt = `Eres un asistente de IA experto en gestión de restaurantes y gastronomía.
    Contexto actual de la carta del restaurante:
    ${recipeContext}

    El usuario pregunta: "${query}"

    Proporciona una respuesta útil, concisa y profesional.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text ?? '';
};

const generateGenericReport = async (title: string, data: any, settings: Settings): Promise<string> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) throw new Error("API Key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
        Eres un analista financiero experto en el sector de la restauración.
        Genera un informe de tipo "${title}" para un restaurante de tipo "${settings.restaurantType}" en ${settings.city}.
        
        Datos proporcionados por el usuario:
        ${JSON.stringify(data, null, 2)}
        
        Elabora un informe detallado en formato de texto. Incluye un análisis de los datos, identifica puntos clave (positivos y negativos), y ofrece recomendaciones concretas y accionables.
        La respuesta debe ser solo el texto del informe, sin introducciones ni despedidas.
    `;
    
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
    return response.text ?? '';
};

export const generateCostDeviationReport = (data: any, settings: Settings) => generateGenericReport('Desviación de Costes', data, settings);
export const generateMenuEngineeringReport = (data: any, settings: Settings) => generateGenericReport('Ingeniería de Menú', data, settings);
export const generatePredictiveInventoryReport = (data: any, settings: Settings) => generateGenericReport('Inventario Predictivo', data, settings);
export const generateLaborCostReport = (data: any, settings: Settings) => generateGenericReport('Eficiencia Laboral', data, settings);
export const generateExecutiveSummaryReport = (data: any, settings: Settings) => generateGenericReport('Resumen Ejecutivo', data, settings);


export const processInvoiceWithGemini = async (
  invoiceImageBase64: string, 
  mimeType: string, 
  currentIngredients: Ingredient[]
): Promise<InvoiceProcessingResult> => {
  const { GoogleGenAI } = await import("@google/genai");
  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const ingredientList = currentIngredients.map(ing => ing.name).join(', ');

  const prompt = `
    Eres un asistente de IA para la gestión de restaurantes. Tu tarea es procesar la imagen de una factura de proveedor para actualizar una lista de ingredientes.

    Analiza la imagen de la factura adjunta. Extrae cada producto, su precio unitario (precio por kg, litro o pieza/unidad), y el nombre del proveedor si es visible.

    Aquí está la lista actual de ingredientes en la base de datos:
    [${ingredientList}]

    Basado en la factura:
    1.  Si un producto de la factura coincide con un nombre de la lista de ingredientes actual, añádelo a la lista de "updates". Usa el nombre exacto de la base de datos y el nuevo precio por unidad.
    2.  Si un producto de la factura NO está en la lista de ingredientes actual, añádelo a la lista de "additions" con su nombre, precio por unidad, la unidad ('kg', 'l', o 'pz'), y el nombre del proveedor (si lo encuentras, si no, usa "Desconocido").
    3.  Asegúrate de que los precios son por la unidad base (kg, l, pz), no el precio total de la línea de la factura. Por ejemplo, si la factura dice "2 cajas de tomates (20kg) a 40€", el precio unitario es 2€/kg.
    4.  Ignora impuestos como el IVA y otros cargos que no sean de productos.
    5.  Devuelve un objeto JSON que se ajuste estrictamente al esquema proporcionado. Si no encuentras nada, devuelve listas vacías.
  `;

  try {
    const imagePart = {
      inlineData: {
        data: invoiceImageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
      }
    });
    
    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error("Gemini returned an empty response. The content may have been blocked.");
    }
    return JSON.parse(jsonText) as InvoiceProcessingResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error processing invoice from Gemini:", errorMessage);
    throw new Error("Failed to process invoice from AI.");
  }
};

export const createRecipeFromImage = async (
  imageBase64: string,
  mimeType: string,
  availableCategories: string[]
): Promise<GeminiGeneratedRecipe> => {
  const { GoogleGenAI } = await import("@google/genai");
  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const categoriesList = availableCategories.join(', ');

  const prompt = `
    Eres un asistente de IA experto en gastronomía, especializado en digitalizar recetas a partir de imágenes. Tu objetivo es analizar la imagen de una receta y estructurar su contenido en formato JSON.

    Por favor, analiza la imagen adjunta y extrae la siguiente información:
    1.  **Nombre del plato (name):** El título principal de la receta.
    2.  **Categoría (category):** Elige la categoría más adecuada de esta lista obligatoria: [${categoriesList}].
    3.  **Ingredientes (ingredients):** Lista cada ingrediente con su nombre, cantidad (en gramos o ml) y una estimación del porcentaje de merma (waste) por preparación (ej. pelado).
    4.  **Tiempos (prepTime, cookTime):** Estima el tiempo de preparación y cocción en minutos. Si no se especifican, proporciona una estimación razonable.
    5.  **Raciones (servings):** Indica para cuántas personas es la receta. Si no se especifica, asume 4.
    6.  **Pasos de Preparación (preparationSteps):** Transcribe las instrucciones de preparación de la forma más fiel posible al texto de la imagen. Intenta no inventar pasos ni traducir el contenido si está en otro idioma.
    7.  **Alérgenos (allergens):** Identifica los alérgenos principales (Gluten, Lácteos, Huevos, etc.). Si no encuentras ninguno, devuelve una lista vacía.
    
    Tu respuesta DEBE ser un único objeto JSON que se ajuste al esquema proporcionado. No incluyas ningún texto o explicación fuera del objeto JSON. Si un campo requerido no se puede determinar desde la imagen, haz tu mejor esfuerzo para proporcionar un valor predeterminado o una estimación lógica.
  `;

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });
    
    if (!response.candidates || response.candidates.length === 0 || !response.text?.trim()) {
        let reason = "respuesta vacía";
        if (response.promptFeedback?.blockReason) {
            reason = `bloqueo del prompt (${response.promptFeedback.blockReason})`;
        } else if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            reason = `finalización inesperada (${response.candidates[0].finishReason})`;
        }
        throw new Error(`Gemini devolvió una ${reason}. El contenido podría haber sido bloqueado por seguridad o la imagen no es clara.`);
    }

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeminiGeneratedRecipe;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating recipe from image via Gemini:", errorMessage);
    throw new Error(`La IA no pudo procesar la receta desde la imagen. Asegúrate de que la imagen es clara y legible. (${errorMessage})`);
  }
};

export const generateMenuSuggestions = async (settings: Settings, currentDate: Date): Promise<MenuSuggestions> => {
  const { GoogleGenAI } = await import("@google/genai");
  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const month = currentDate.toLocaleString('es-ES', { month: 'long' });

  const prompt = `
    Eres un consultor gastronómico de élite especializado en ingeniería de cartas.
    Tu tarea es generar un array con **exactamente 10 sugerencias de platos** para cada una de las siguientes categorías de carta: 'Entrantes Fríos', 'Entrantes Calientes', 'Platos Principales' y 'Postres'.

    El restaurante tiene las siguientes características:
    - Tipo de Restaurante: ${settings.restaurantType}
    - Ubicación: ${settings.city}, ${settings.country}
    
    El mes actual es ${month}. Las sugerencias deben ser muy creativas, variadas, atractivas y, lo más importante, utilizar ingredientes de temporada disponibles en ${settings.city} durante ${month}.
    
    Considera el perfil del restaurante (${settings.restaurantType}) para el estilo de los platos. No sugieras nombres de platos genéricos; deben sonar apetecibles y adecuados para la carta.
    Cada vez que se te pida, intenta ofrecer ideas diferentes a las anteriores.

    Genera una respuesta en formato JSON que se ajuste al esquema proporcionado. La respuesta DEBE contener **exactamente 10 sugerencias por categoría**. Esto es un requisito CRÍTICO e INNEGOCIABLE.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionsSchema,
        temperature: 0.9,
      }
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error("Gemini returned an empty response. The content may have been blocked.");
    }
    return JSON.parse(jsonText) as MenuSuggestions;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating menu suggestions from Gemini:", errorMessage);
    throw new Error("Failed to generate menu suggestions from AI.");
  }
};

export const generateWeeklyMenuSuggestions = async (
    settings: Settings,
    currentDate: Date,
    mealTypes: string[]
): Promise<WeeklyMenuSuggestions> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const month = currentDate.toLocaleString('es-ES', { month: 'long' });
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Dynamically build the schema based on the provided mealTypes
    const mealTypesForSchema = mealTypes.reduce((acc, mealType) => {
        acc[mealType] = { type: Type.STRING, description: `Sugerencia para ${mealType}` };
        return acc;
    }, {} as Record<string, { type: Type, description: string }>);

    const weeklyMenuSuggestionsSchema = {
        type: Type.OBJECT,
        properties: days.reduce((acc, day) => {
            acc[day] = {
                type: Type.OBJECT,
                properties: mealTypesForSchema,
                required: mealTypes
            };
            return acc;
        }, {} as Record<string, object>),
        required: days,
    };

    const prompt = `
        Eres un chef ejecutivo y consultor gastronómico experto en crear menús semanales equilibrados y rentables.
        Tu tarea es generar un menú semanal completo, desde el Lunes hasta el Domingo, para un restaurante con las siguientes características:
        - Tipo de Restaurante: ${settings.restaurantType}
        - Ubicación: ${settings.city}, ${settings.country}

        El mes actual es ${month}. Las sugerencias deben ser creativas, variadas, atractivas y, lo más importante, utilizar ingredientes de temporada disponibles en ${settings.city} durante ${month}.
        El menú debe ser nutricionalmente equilibrado a lo largo de la semana.
        
        Para cada día de la semana, proporciona una sugerencia de plato para cada una de las siguientes categorías personalizadas:
        ${mealTypes.map(type => `- ${type}`).join('\n')}

        Los nombres de los platos deben ser específicos y sonar apetecibles, no genéricos.
        Genera una respuesta en formato JSON que se ajuste estrictamente al esquema proporcionado.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: weeklyMenuSuggestionsSchema,
                temperature: 0.8,
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Gemini returned an empty response. The content may have been blocked.");
        }
        return JSON.parse(jsonText) as WeeklyMenuSuggestions;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error generating weekly menu suggestions from Gemini:", errorMessage);
        throw new Error("Failed to generate weekly menu suggestions from AI.");
    }
};

export const generateRecipeFromGemini = async (recipeName: string, availableCategories: string[]): Promise<GeminiGeneratedRecipe> => {
  const { GoogleGenAI } = await import("@google/genai");
  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const categoriesList = availableCategories.join(', ');

  const recipePrompt = `
    Eres un chef ejecutivo experto creando "escandallos" (recipe costing breakdowns) para un restaurante profesional.
    Tu tarea es generar una receta detallada para "${recipeName}".
    
    Primero, basándote en el nombre y los ingredientes típicos de "${recipeName}", elige la categoría más apropiada de la siguiente lista de categorías disponibles. Debes elegir una y solo una opción de esta lista:
    [${categoriesList}]

    Después de elegir la categoría, genera el resto de la receta.
    La receta debe ser para un entorno de restaurante profesional, realista, y bien estructurada.
    Proporciona cantidades para 4 raciones (4 people).
    Calcula un porcentaje de merma (waste) realista para cada ingrediente.
    IMPORTANTE: En la lista de alérgenos, incluye ÚNICAMENTE los que pertenzcan a la lista oficial de 14 alérgenos principales (Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos). No incluyas ingredientes como "Pork" (cerdo) o "Beef" (ternera) como alérgenos. Si no hay ninguno de los 14, devuelve una lista vacía.
    Genera una respuesta en formato JSON que se ajuste al esquema proporcionado, asegurándote de incluir el campo "category" con el valor que elegiste de la lista.
  `;
  
  try {
    const recipeResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: recipePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });

    const jsonText = recipeResponse.text?.trim();
    if (!jsonText) {
        throw new Error("Gemini returned an empty recipe. The content may have been blocked.");
    }
    const recipeData = JSON.parse(jsonText) as GeminiGeneratedRecipe;
    
    return recipeData;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating recipe from Gemini:", errorMessage);
    throw new Error("Failed to generate recipe from AI.");
  }
};

export const generateImageForRecipe = async (recipeName: string): Promise<string> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Professional food photography of a delicious plate of "${recipeName}", presented in a high-end restaurant style. Realistic, appetizing, and well-lit.`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (imageResponse && imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            const base64ImageBytes: string | undefined = imageResponse.generatedImages[0]?.image?.imageBytes;
            if (base64ImageBytes) {
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
        }
        return "";
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Image generation failed:", errorMessage);
        throw new Error("Failed to generate image from AI.");
    }
};

export const generateMultipleDescriptions = async (recipes: Recipe[], allIngredients: Ingredient[]): Promise<{[recipeId: string]: string}> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    if (recipes.length === 0) {
        return {};
    }

    const recipesData = recipes.map(recipe => {
        const ingredientList = recipe.ingredients.map(ing => {
            const details = allIngredients.find(i => i.id === ing.ingredientId || i.name.toLowerCase() === ing.ingredientId.toLowerCase());
            return details ? details.name : ing.ingredientId;
        }).join(', ');
        return {
            id: recipe.id,
            name: recipe.name,
            ingredients: ingredientList,
        };
    });

    const prompt = `
        Eres un "food copywriter" experto en crear descripciones de platos para cartas de restaurantes.
        Tu tarea es generar una descripción corta (máximo 25 palabras), apetitosa y atractiva para CADA UNO de los siguientes platos.
        La descripción debe ser evocadora y despertar el apetito del cliente. Céntrate en los sabores, texturas y la calidad de los ingredientes.
        
        Platos a describir:
        ${recipesData.map(r => `- ID: ${r.id}\n  Nombre: "${r.name}"\n  Ingredientes: ${r.ingredients}`).join('\n\n')}

        Devuelve la respuesta en formato JSON que se ajuste estrictamente al esquema proporcionado, usando el ID de la receta como clave y la descripción como valor. No incluyas ninguna introducción ni texto adicional fuera del JSON.
    `;
    
    const responseSchemaProperties = recipes.reduce((acc, recipe) => {
        acc[recipe.id] = { 
            type: Type.STRING, 
            description: `A short, appetizing description for the dish "${recipe.name}". Max 25 words.` 
        };
        return acc;
    }, {} as Record<string, { type: Type, description: string }>);

    const multipleDescriptionsSchema = {
        type: Type.OBJECT,
        properties: responseSchemaProperties,
        required: recipes.map(r => r.id),
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: multipleDescriptionsSchema,
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Gemini returned an empty response.");
        }
        return JSON.parse(jsonText);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error generating multiple descriptions:", errorMessage);
        throw new Error("Failed to generate descriptions from AI.");
    }
};

export const generateServiceReport = async (recipes: Recipe[], settings: Settings): Promise<Omit<ServiceReportData, 'imageUrl' | 'ingredients'>[]> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) {
        throw new Error("API Key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Eres un Maitre D' y Jefe de Sala experto, encargado de preparar al equipo de camareros para el servicio.
        Tu tarea es crear un "Informe para Servicio" detallado para los siguientes platos de la carta de un restaurante de tipo "${settings.restaurantType}" en ${settings.city}.

        Para CADA plato de la lista, debes generar:
        1.  **keyPoints (Puntos Clave):** Exactamente TRES puntos clave:
            -   **'Descripción para el cliente':** Una frase corta, apetitosa y fácil de entender para describir el plato al cliente.
            -   **'Maridaje Sugerido':** Una sugerencia de maridaje (vino, cerveza, etc.) que complemente bien el plato, considerando el tipo de restaurante.
            -   **'Posibles Preguntas (FAQs)':** Una pregunta frecuente que un cliente podría hacer sobre el plato y su respuesta concisa.
        2.  **allergenManagement (Gestión de Alérgenos):** Para CADA alérgeno presente en el plato:
            -   **allergenName:** El nombre del alérgeno.
            -   **status:** Clasifícalo como 'ELIMINABLE', 'NO ELIMINABLE', o 'SUSTITUIBLE'.
            -   **justification:** Explica por qué tiene ese estado. Si es eliminable o sustituible, indica claramente cómo (ej: "Se puede servir sin la salsa de nueces", "Se puede usar pan sin gluten"). Si no es eliminable, explica por qué (ej: "El gluten está en la masa base de la croqueta").

        Lista de platos a analizar:
        ${recipes.map(r => `- Nombre: "${r.name}", Alérgenos: [${r.allergens.join(', ')}]`).join('\n')}

        Devuelve un array de objetos en formato JSON que se ajuste estrictamente al esquema proporcionado. La respuesta debe contener un objeto por cada plato de la lista.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: serviceReportSchema,
                temperature: 0.5,
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Gemini returned an empty response. The content may have been blocked.");
        }
        
        return JSON.parse(jsonText);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error generating service report:", errorMessage);
        throw new Error("Failed to generate service report from AI.");
    }
};

export const generateWeeklyScheduleForAllEmployees = async (
    employees: Employee[],
    shifts: Shift[],
    personnelNeeds: PersonnelNeeds,
    weekDates: Date[]
): Promise<AllEmployeesWeeklyScheduleResponse> => {
    const { GoogleGenAI } = await import("@google/genai");
    const API_KEY = import.meta.env.VITE_API_KEY;
    if (!API_KEY) throw new Error("API Key is not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    const employeeData = employees.map(e => `ID: ${e.id}, Nombre: ${e.name}, Horas objetivo mensuales: ${e.targetHours}`).join('; ');
    const shiftData = shifts.map(s => `ID: ${s.id}, Nombre: ${s.name}, Duración: ${s.hours} horas`).join('; ');

    const dateData = weekDates.map((date, index) => {
        return `Fecha: ${date.toISOString().split('T')[0]}, Día de la semana: ${weekDays[index]}`;
    }).join('; ');

    const personnelNeedsData = Object.entries(personnelNeeds).map(([shiftId, needs]) => {
        const dailyNeeds = Object.entries(needs).map(([day, count]) => `${day}: ${count}`).join(', ');
        return `Turno ${shiftId}: ${dailyNeeds}`;
    }).join('\n');

    const allEmployeesScheduleSchema = {
        type: Type.ARRAY,
        description: "An array of weekly schedule objects, one for each employee provided in the prompt.",
        items: {
            type: Type.OBJECT,
            properties: {
                employeeId: { type: Type.STRING, description: "The unique ID of the employee (e.g., 'emp1')." },
                schedule: {
                    type: Type.ARRAY,
                    description: "An array of scheduled shifts for the employee for the given week.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            date: { type: Type.STRING, description: "The date of the shift in YYYY-MM-DD format." },
                            shiftId: { type: Type.STRING, description: "The unique ID of the shift (e.g., 'T1', 'L')." }
                        },
                        required: ["date", "shiftId"]
                    }
                }
            },
            required: ["employeeId", "schedule"]
        }
    };

    const prompt = `
        Eres un manager de restaurante experto en crear horarios de personal eficientes y justos. Tu tarea es generar el horario para la próxima semana para TODOS los empleados.

        **1. Datos de Entrada:**
        - **Semana:** ${dateData}
        - **Empleados:** ${employeeData}
        - **Turnos Disponibles:** ${shiftData}
        - **Necesidades de Personal por Turno:**
        ${personnelNeedsData}

        **2. Reglas y Objetivos:**
        - **Cubrir Necesidades:** Asegúrate de que el número de empleados en cada turno de trabajo ('T1', 'T3', etc.) para cada día de la semana coincida con las "Necesidades de Personal".
        - **Equilibrio de Horas:** Intenta que las horas trabajadas por cada empleado en la semana se aproximen a su objetivo semanal (horas mensuales / 4).
        - **Descanso:** Generalmente, los empleados no deben trabajar más de 5-6 días seguidos. Asigna los turnos 'L' (Libre) para los días de descanso.
        - **Consistencia:** Si es posible, mantén cierta consistencia en los turnos de los empleados.
        
        **3. Formato de Salida:**
        - Devuelve un array de objetos en formato JSON que se ajuste estrictamente al esquema proporcionado.
        - DEBE haber un objeto en el array por CADA empleado listado, incluso si no trabajan esa semana (en ese caso, su array 'schedule' estará vacío o contendrá solo días libres).
        - Para cada empleado, su 'schedule' debe contener un objeto por cada día que tiene un turno asignado en la semana especificada.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: allEmployeesScheduleSchema,
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Gemini returned an empty schedule.");
        }
        return JSON.parse(jsonText);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error generating weekly schedule:", errorMessage);
        throw new Error("Failed to generate weekly schedule from AI.");
    }
};
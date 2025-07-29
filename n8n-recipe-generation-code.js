// Process recipe generation request
const input = $json;

// Log incoming data for debugging
console.log('Incoming webhook data:', JSON.stringify(input, null, 2));

// Extract request data - handle multiple possible data structures
let requestData;
if (input.data) {
  requestData = input.data;
} else if (input.type === 'recipe_generation' && input.data) {
  requestData = input.data;
} else {
  requestData = input;
}

console.log('Extracted request data:', JSON.stringify(requestData, null, 2));

// Validate and extract ingredients with better error handling
let ingredients = [];
if (requestData.ingredients && Array.isArray(requestData.ingredients)) {
  ingredients = requestData.ingredients.filter(ing => ing && typeof ing === 'string' && ing.trim());
} else if (requestData.ingredients && typeof requestData.ingredients === 'string') {
  // Handle single ingredient as string
  ingredients = [requestData.ingredients.trim()];
} else {
  // Provide default ingredients for testing
  console.log('No valid ingredients found, using defaults for testing');
  ingredients = ['chicken breast', 'rice', 'vegetables'];
}

// Ensure we have at least one ingredient
if (ingredients.length === 0) {
  console.log('Empty ingredients array, using default ingredients');
  ingredients = ['chicken breast', 'rice', 'vegetables'];
}

// Extract and set defaults for optional fields with better validation
const dietaryRestrictions = Array.isArray(requestData.dietaryRestrictions) 
  ? requestData.dietaryRestrictions.filter(rest => rest && typeof rest === 'string' && rest.trim())
  : [];

const cuisine = (requestData.cuisine && typeof requestData.cuisine === 'string') 
  ? requestData.cuisine.trim() 
  : 'Any';

const servings = Math.max(1, Math.min(20, parseInt(requestData.servings) || 4));
const difficulty = ['easy', 'medium', 'hard'].includes(requestData.difficulty) 
  ? requestData.difficulty 
  : 'medium';
const cookingTime = Math.max(5, Math.min(480, parseInt(requestData.cookingTime) || 30));

// Create detailed AI prompt
const prompt = `Create a detailed, practical recipe with the following specifications:

AVAILABLE INGREDIENTS: ${ingredients.join(', ')}
DIETARY RESTRICTIONS: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
CUISINE STYLE: ${cuisine}
NUMBER OF SERVINGS: ${servings}
DIFFICULTY LEVEL: ${difficulty}
MAXIMUM COOKING TIME: ${cookingTime} minutes

REQUIREMENTS:
1. Use primarily the provided ingredients
2. Create a recipe that can be completed within the time limit
3. Match the specified difficulty level
4. Respect all dietary restrictions
5. Provide clear, step-by-step instructions
6. Include preparation and cooking times
7. Suggest cooking tips for best results

RESPONSE FORMAT (must be valid JSON):
{
  "title": "Descriptive recipe name",
  "description": "Brief, appetizing description (2-3 sentences)",
  "ingredients": [
    "Exact ingredient with measurement (e.g., '2 cups diced chicken breast')",
    "Include seasonings and cooking liquids",
    "List in order of use"
  ],
  "instructions": [
    "Step 1: Clear, specific instruction",
    "Step 2: Include temperatures and timing",
    "Step 3: Cooking techniques and tips",
    "Continue with numbered steps"
  ],
  "prepTime": numeric_minutes_for_preparation,
  "cookTime": numeric_minutes_for_cooking,
  "totalTime": numeric_total_minutes,
  "difficulty": "${difficulty}",
  "servings": ${servings},
  "tips": "Helpful cooking tips and variations",
  "nutritionNotes": "Brief nutritional highlights"
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.`;

// Prepare data for next node
const processedData = {
  prompt: prompt,
  originalRequest: {
    ingredients: ingredients,
    dietaryRestrictions: dietaryRestrictions,
    cuisine: cuisine,
    servings: servings,
    difficulty: difficulty,
    cookingTime: cookingTime
  },
  requestId: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString()
};

console.log('Successfully processed request data:', JSON.stringify(processedData.originalRequest, null, 2));

return {
  json: processedData
}; 
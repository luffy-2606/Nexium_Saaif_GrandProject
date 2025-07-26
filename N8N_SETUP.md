# n8n Setup Guide for Recipe Generator AI Workflows

This guide will help you set up n8n to handle AI-powered recipe generation and translation workflows as an alternative to direct API calls.

## 1. What is n8n?

n8n is a workflow automation tool that allows you to connect different services and APIs without writing code. For the Recipe Generator, we'll use it to:

- Generate recipes using AI APIs (OpenAI, Hugging Face, etc.)
- Translate recipes to different languages
- Process and format AI responses
- Handle fallbacks and error handling

## 2. Setup Options

### Option A: n8n Cloud (Recommended for Beginners)

The hosted version with easy setup and management.

### Option B: Self-hosted n8n

More control and customization options.

## 3. Setting up n8n Cloud

### 3.1 Create Account

1. Go to [n8n.cloud](https://n8n.cloud)
2. Sign up for a free account
3. Verify your email address
4. Choose your plan (Free tier available)

### 3.2 Create Your First Workflow

1. Click **"New workflow"**
2. Start with a blank workflow
3. You'll see the n8n workflow editor

## 4. Setting up Self-hosted n8n

### 4.1 Using Docker (Recommended)

```bash
# Create data directory
mkdir n8n-data

# Run n8n with Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/n8n-data:/home/node/.n8n \
  n8nio/n8n
```

### 4.2 Using npm

```bash
# Install n8n globally
npm install n8n -g

# Start n8n
n8n start
```

### 4.3 Access n8n

Open your browser and go to: `http://localhost:5678`

## 5. Recipe Generation Workflow

### 5.1 Create Recipe Generation Workflow

1. **Webhook Node** (Trigger):
   - Add a new **Webhook** node
   - Set method to **POST**
   - Copy the webhook URL (you'll need this)

2. **Function Node** (Process Input):
   - Add a **Function** node
   - Process the incoming recipe request:

```javascript
// Process recipe generation request
const input = $json;

// Extract request data
const ingredients = input.data.ingredients || [];
const dietaryRestrictions = input.data.dietaryRestrictions || [];
const cuisine = input.data.cuisine || 'Any';
const servings = input.data.servings || 4;
const difficulty = input.data.difficulty || 'medium';
const cookingTime = input.data.cookingTime || 30;

// Create AI prompt
const prompt = `
Create a detailed recipe with the following requirements:
- Ingredients available: ${ingredients.join(', ')}
- Dietary restrictions: ${dietaryRestrictions.join(', ') || 'None'}
- Cuisine style: ${cuisine}
- Servings: ${servings}
- Difficulty: ${difficulty}
- Maximum cooking time: ${cookingTime} minutes

Please provide:
1. Recipe title
2. Brief description
3. Complete ingredients list with measurements
4. Step-by-step instructions
5. Estimated prep time and cook time

Format the response as JSON with the following structure:
{
  "title": "Recipe Title",
  "description": "Brief description",
  "ingredients": ["ingredient with measurement", ...],
  "instructions": ["step 1", "step 2", ...],
  "prepTime": number_in_minutes,
  "cookTime": number_in_minutes,
  "tips": "optional cooking tips"
}
`;

return {
  json: {
    prompt: prompt,
    originalRequest: input.data
  }
};
```

3. **OpenAI Node** (Generate Recipe):
   - Add an **OpenAI** node
   - Set up your OpenAI credentials
   - Configure the node:
     - **Operation**: Chat
     - **Model**: gpt-3.5-turbo
     - **Messages**: 
       - System: "You are a professional chef who creates detailed, practical recipes. Always respond with valid JSON."
       - User: `={{$json.prompt}}`
     - **Max Tokens**: 1500
     - **Temperature**: 0.7

4. **Function Node** (Format Response):
   - Add another **Function** node
   - Format the AI response:

```javascript
// Parse and format the OpenAI response
const aiResponse = $json.choices[0].message.content;

try {
  const recipe = JSON.parse(aiResponse);
  
  return {
    json: {
      success: true,
      recipe: recipe,
      originalRequest: $node["Function"].json.originalRequest
    }
  };
} catch (error) {
  // If JSON parsing fails, create a fallback response
  return {
    json: {
      success: false,
      error: "Failed to parse AI response",
      fallback: {
        title: "Simple Recipe",
        description: "A basic recipe using your ingredients",
        ingredients: $node["Function"].json.originalRequest.ingredients.map(ing => `1 cup ${ing}`),
        instructions: [
          "Prepare all ingredients",
          "Cook according to standard methods",
          "Season to taste",
          "Serve and enjoy"
        ],
        prepTime: 15,
        cookTime: 25,
        tips: "Adjust seasonings to your preference"
      }
    }
  };
}
```

5. **Respond to Webhook**:
   - Add a **Respond to Webhook** node
   - Set **Response Body**: `={{$json}}`

### 5.2 Test the Workflow

1. **Activate** the workflow
2. Copy the webhook URL
3. Test with curl:

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recipe_generation",
    "data": {
      "ingredients": ["chicken", "rice", "vegetables"],
      "dietaryRestrictions": [],
      "cuisine": "Asian",
      "servings": 4,
      "difficulty": "medium",
      "cookingTime": 45
    }
  }'
```

## 6. Recipe Translation Workflow

### 6.1 Create Translation Workflow

1. **Webhook Node** (Trigger):
   - Create a new workflow
   - Add a **Webhook** node
   - Set method to **POST**

2. **Function Node** (Process Translation Request):

```javascript
// Process translation request
const input = $json;
const recipe = input.recipe;
const targetLanguage = input.targetLanguage;

const prompt = `
Translate the following recipe to ${targetLanguage}. Maintain the original structure and measurements.

Title: ${recipe.title}
Ingredients: ${recipe.ingredients.join('\n')}
Instructions: ${recipe.instructions.join('\n')}

Please provide the translation in JSON format:
{
  "title": "translated title",
  "ingredients": ["translated ingredient 1", "translated ingredient 2", ...],
  "instructions": ["translated instruction 1", "translated instruction 2", ...]
}
`;

return {
  json: {
    prompt: prompt,
    targetLanguage: targetLanguage,
    originalRecipe: recipe
  }
};
```

3. **OpenAI Node** (Translate Recipe):
   - Configure similar to recipe generation
   - System message: "You are a professional translator specializing in culinary translations. Always respond with valid JSON and maintain cooking measurements and techniques accurately."
   - Temperature: 0.3 (lower for more consistent translations)

4. **Function Node** (Format Translation):

```javascript
// Parse and format the translation
const aiResponse = $json.choices[0].message.content;

try {
  const translation = JSON.parse(aiResponse);
  
  return {
    json: {
      success: true,
      translation: translation,
      targetLanguage: $node["Function"].json.targetLanguage
    }
  };
} catch (error) {
  // Fallback translation
  const original = $node["Function"].json.originalRecipe;
  return {
    json: {
      success: false,
      error: "Translation failed",
      fallback: {
        title: `[${$node["Function"].json.targetLanguage.toUpperCase()}] ${original.title}`,
        ingredients: original.ingredients.map(ing => `[${$node["Function"].json.targetLanguage.toUpperCase()}] ${ing}`),
        instructions: original.instructions.map(inst => `[${$node["Function"].json.targetLanguage.toUpperCase()}] ${inst}`)
      }
    }
  };
}
```

## 7. Alternative AI Providers

### 7.1 Using Hugging Face

1. **HTTP Request Node** instead of OpenAI:
   - **Method**: POST
   - **URL**: `https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium`
   - **Headers**: `Authorization: Bearer YOUR_HF_TOKEN`
   - **Body**:

```javascript
{
  "inputs": $json.prompt,
  "parameters": {
    "max_length": 1500,
    "temperature": 0.7
  }
}
```

### 7.2 Using Claude API

Similar setup with HTTP Request node pointing to Anthropic's API.

## 8. Error Handling and Fallbacks

### 8.1 Add Error Handling

1. **IF Node** to check for errors:
   - Condition: `={{$json.error === undefined}}`

2. **Different paths** for success and error cases

3. **HTTP Request Node** for fallback APIs if primary fails

### 8.2 Rate Limiting

1. **Wait Node** between API calls
2. **Function Node** to track API usage
3. **Switch Node** to route to different providers based on limits

## 9. Environment Variables in n8n

### 9.1 Set Credentials

1. Go to **Settings** > **Credentials**
2. Add your API keys:
   - OpenAI API Key
   - Hugging Face Token
   - Any other service tokens

### 9.2 Use Environment Variables

In self-hosted n8n, set environment variables:

```bash
export OPENAI_API_KEY="your_openai_key"
export HUGGINGFACE_API_KEY="your_hf_key"
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER="admin"
export N8N_BASIC_AUTH_PASSWORD="your_password"
```

## 10. Connecting to Your Next.js App

### 10.1 Update Environment Variables

Add your n8n webhook URLs to `.env.local`:

```env
# n8n Webhook URLs
N8N_RECIPE_GENERATION_WEBHOOK=https://your-n8n-instance.com/webhook/recipe-generation
N8N_TRANSLATION_WEBHOOK=https://your-n8n-instance.com/webhook/translation
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/recipe-generation
```

### 10.2 Update API Routes

Your Next.js API routes are already configured to use n8n webhooks as a fallback.

## 11. Monitoring and Debugging

### 11.1 Workflow Execution

- View execution history in n8n dashboard
- Check execution logs for errors
- Monitor API usage and rate limits

### 11.2 Performance Optimization

1. **Caching**: Add Redis nodes for frequently requested recipes
2. **Parallel Processing**: Use multiple AI providers simultaneously
3. **Queue Management**: Handle high-volume requests

## 12. Advanced Workflows

### 12.1 Recipe Enhancement

Create workflows to:
- Add nutritional information
- Generate recipe variations
- Create cooking videos or images
- Suggest wine pairings

### 12.2 User Personalization

- Track user preferences
- Generate personalized recipe recommendations
- Create dietary-specific meal plans

## 13. Deployment

### 13.1 Production Deployment

**Using Docker Compose:**

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
      - WEBHOOK_URL=https://your-domain.com
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```

### 13.2 Security

1. **Enable Basic Auth** for production
2. **Use HTTPS** for all webhook URLs
3. **Restrict IP access** if possible
4. **Rotate API keys** regularly

## 14. Troubleshooting

### Common Issues:

1. **Webhook not responding**:
   - Check if workflow is activated
   - Verify webhook URL
   - Check n8n logs

2. **AI API errors**:
   - Verify API keys
   - Check rate limits
   - Monitor API quotas

3. **JSON parsing errors**:
   - Add better error handling
   - Use fallback responses
   - Validate AI responses

## 15. Cost Optimization

1. **Use cheaper models** for simple tasks
2. **Implement caching** for repeated requests
3. **Set usage limits** to prevent overages
4. **Monitor API costs** regularly

## Next Steps

After setting up n8n:
1. Test all workflows thoroughly
2. Set up monitoring and alerts
3. Create backup workflows for high availability
4. Optimize for performance and cost
5. Consider adding more AI providers for redundancy

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
- [Workflow Templates](https://n8n.io/workflows/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Hugging Face API Documentation](https://huggingface.co/docs/api-inference) 
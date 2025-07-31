'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ChefHat, Loader2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface RecipeFormData {
  ingredients: string[]
  dietaryRestrictions: string[]
  cuisine: string
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number
}

interface RecipeGeneratorProps {
  onRecipeGenerated: (recipe: any) => void
}

export default function RecipeGenerator({ onRecipeGenerated }: RecipeGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([''])
  const [currentIngredient, setCurrentIngredient] = useState('')
  const [currentRestriction, setCurrentRestriction] = useState('')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RecipeFormData>({
    defaultValues: {
      servings: 4,
      difficulty: 'medium',
      cookingTime: 30,
    }
  })

  const addIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients.filter(i => i), currentIngredient.trim()])
      setCurrentIngredient('')
    }
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const addDietaryRestriction = () => {
    if (currentRestriction.trim()) {
      setDietaryRestrictions([...dietaryRestrictions.filter(r => r), currentRestriction.trim()])
      setCurrentRestriction('')
    }
  }

  const removeDietaryRestriction = (index: number) => {
    setDietaryRestrictions(dietaryRestrictions.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: RecipeFormData) => {
    const validIngredients = ingredients.filter(i => i.trim())
    if (validIngredients.length === 0) {
      toast.error('Please add at least one ingredient')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        ...data,
        ingredients: validIngredients,
        dietaryRestrictions: dietaryRestrictions.filter(r => r.trim()),
      }

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Please log in to generate recipes')
        return
      }

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Recipe generation failed:', response.status, errorText)
        throw new Error(`Failed to generate recipe: ${response.status} ${response.statusText}`)
      }

      const recipe = await response.json()
      console.log('🍳 Recipe received from API:', JSON.stringify(recipe, null, 2))
      
      // More detailed validation
      if (!recipe) {
        console.error('❌ No recipe object received')
        throw new Error('No recipe data received from server')
      }
      
      if (!recipe.title) {
        console.error('❌ Recipe missing title:', recipe)
        throw new Error('Recipe is missing a title')
      }
      
      if (!recipe.ingredients || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        console.error('❌ Recipe missing or invalid ingredients:', recipe)
        throw new Error('Recipe is missing ingredients')
      }
      
      if (!recipe.instructions || !Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
        console.error('❌ Recipe missing or invalid instructions:', recipe)
        throw new Error('Recipe is missing instructions')
      }
      
      console.log('✅ Recipe validation passed')
      
      onRecipeGenerated(recipe)
      toast.success('Recipe generated successfully!')
      
      // Reset form
      reset()
      setIngredients([''])
      setDietaryRestrictions([''])
      setCurrentIngredient('')
      setCurrentRestriction('')
    } catch (error) {
      console.error('Recipe generation error:', error)
      toast.error('Failed to generate recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <ChefHat className="w-8 h-8 text-orange-600" />
        </div>
        <CardTitle>Generate Your Perfect Recipe</CardTitle>
        <CardDescription>
          Tell us what ingredients you have and we'll create a delicious recipe for you!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Ingredients Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ingredients</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Add an ingredient..."
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addIngredient()
                  }
                }}
              />
              <Button type="button" onClick={addIngredient} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.filter(i => i).map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{ingredient}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dietary Restrictions (Optional)</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Add dietary restriction..."
                value={currentRestriction}
                onChange={(e) => setCurrentRestriction(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDietaryRestriction()
                  }
                }}
              />
              <Button type="button" onClick={addDietaryRestriction} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dietaryRestrictions.filter(r => r).map((restriction, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{restriction}</span>
                  <button
                    type="button"
                    onClick={() => removeDietaryRestriction(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recipe Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cuisine (Optional)</label>
              <Input
                {...register('cuisine')}
                placeholder="e.g., Italian, Chinese"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Servings</label>
              <Input
                type="number"
                {...register('servings', { min: 1, max: 20 })}
                min="1"
                max="20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cooking Time (minutes)</label>
              <Input
                type="number"
                {...register('cookingTime', { min: 5, max: 480 })}
                min="5"
                max="480"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
            <select
              {...register('difficulty')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || ingredients.filter(i => i).length === 0}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating your recipe...
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4 mr-2" />
                Generate Recipe
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 
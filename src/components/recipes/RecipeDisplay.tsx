'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, ChefHat, Heart, Globe, Star } from 'lucide-react'
import { formatCookTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Recipe {
  id: string
  title: string
  description?: string
  ingredients: string[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine?: string
  dietaryRestrictions: string[]
  isFavorite?: boolean
  tips?: string[]
}

interface RecipeDisplayProps {
  recipe: Recipe
  onSave?: (recipe: Recipe) => void
  showActions?: boolean
}

export default function RecipeDisplay({ 
  recipe, 
  onSave, 
  showActions = true 
}: RecipeDisplayProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite || false)

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      await onSave(recipe)
      toast.success('Recipe saved successfully!')
    } catch (error) {
      toast.error('Failed to save recipe')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const response = await fetch('/api/recipes/toggle-favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeId: recipe.id }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
      }
    } catch (error) {
      toast.error('Failed to update favorites')
    }
  }



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              {recipe.title}
            </CardTitle>
            {recipe.description && (
              <CardDescription className="text-lg">
                {recipe.description}
              </CardDescription>
            )}
          </div>
          {showActions && (
            <div className="flex space-x-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className={isFavorite ? 'text-red-500' : 'text-gray-400'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {totalTime > 0 && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatCookTime(totalTime)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChefHat className="w-4 h-4" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          </div>
          {recipe.cuisine && (
            <div className="flex items-center space-x-1 text-gray-600">
              <Globe className="w-4 h-4" />
              <span>{recipe.cuisine}</span>
            </div>
          )}
        </div>

        {recipe.dietaryRestrictions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.dietaryRestrictions.map((restriction, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {restriction}
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Ingredients */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🥄</span>
            Ingredients
          </h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-orange-500 mt-1">•</span>
                <span className="flex-1">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📝</span>
            Instructions
          </h3>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex space-x-4">
                <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="flex-1 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        {recipe.tips && recipe.tips.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Cooking Tips
            </h3>
            <ul className="space-y-2">
              {recipe.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="flex-1">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="border-t pt-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Recipe'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Heart, 
  Clock, 
  Users, 
  ChefHat, 
  Star,
  Globe,
  Calendar,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

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
  aiGenerated?: boolean
  originalLanguage?: string
  createdAt: string
  updatedAt: string
  tips?: string[]
}

interface User {
  id: string
  email: string
}

export default function RecipeDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user as User)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (user && recipeId) {
      loadRecipe()
    }
  }, [user, recipeId])

  const loadRecipe = async () => {
    setLoadingRecipe(true)
    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`/api/recipes/${recipeId}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecipe(data)
      } else if (response.status === 404) {
        toast.error('Recipe not found')
        router.push('/recipes')
      } else {
        throw new Error('Failed to load recipe')
      }
    } catch (error) {
      console.error('Error loading recipe:', error)
      toast.error('Failed to load recipe')
      router.push('/recipes')
    } finally {
      setLoadingRecipe(false)
    }
  }

  const toggleFavorite = async () => {
    if (!recipe) return

    try {
      const session = await supabase.auth.getSession()
      const response = await fetch('/api/recipes/toggle-favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ recipeId: recipe.id })
      })

      if (response.ok) {
        const data = await response.json()
        setRecipe({ ...recipe, isFavorite: data.isFavorite })
        toast.success(data.message)
      } else {
        throw new Error('Failed to toggle favorite')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to update favorite status')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading || loadingRecipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe not found</h1>
            <Link href="/recipes">
              <Button>Back to Recipes</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster position="top-right" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/recipes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Recipes
              </Button>
            </Link>
          </div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-gray-600">{recipe.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleFavorite}
              className="h-12 w-12 p-0"
            >
              <Heart 
                className={`w-6 h-6 ${
                  recipe.isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400'
                }`} 
              />
            </Button>
          </div>

          {/* Recipe Meta */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
            {recipe.cuisine && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {recipe.cuisine}
              </span>
            )}
            
          </div>

          {/* Recipe Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{recipe.servings} servings</span>
            </div>
            {recipe.prepTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>{recipe.prepTime} min prep</span>
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <ChefHat className="w-5 h-5" />
                <span>{recipe.cookTime} min cook</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(recipe.createdAt)}</span>
            </div>
          </div>

          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li 
                    key={index} 
                    className="flex gap-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Dietary Restrictions */}
        {recipe.dietaryRestrictions && recipe.dietaryRestrictions.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Dietary Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryRestrictions.map((restriction, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {restriction}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChefHat, Heart, Clock, Users, Filter, ArrowLeft, Star } from 'lucide-react'
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
  createdAt: string
  tips?: string[]
}

interface User {
  id: string
  email: string
}

export default function RecipesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const router = useRouter()

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
    if (user) {
      loadRecipes()
    }
  }, [user, filter, page])

  const loadRecipes = async () => {
    console.log('📚 Loading recipes...', { page, filter })
    setLoadingRecipes(true)
    try {
      const session = await supabase.auth.getSession()
      console.log('🔐 Session check:', !!session.data.session)
      
      const url = `/api/recipes?page=${page}&limit=12&filter=${filter}`
      console.log('🌐 API call:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Recipes loaded:', data)
        setRecipes(data.recipes || [])
        setTotalCount(data.pagination?.totalCount || 0)
      } else {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        throw new Error(`Failed to load recipes: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Error loading recipes:', error)
      toast.error('Failed to load recipes')
      // Set empty state on error
      setRecipes([])
      setTotalCount(0)
    } finally {
      setLoadingRecipes(false)
    }
  }

  const toggleFavorite = async (recipeId: string) => {
    try {
      const session = await supabase.auth.getSession()
      const response = await fetch('/api/recipes/toggle-favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ recipeId })
      })

      if (response.ok) {
        const data = await response.json()
        setRecipes(recipes.map(recipe => 
          recipe.id === recipeId 
            ? { ...recipe, isFavorite: data.isFavorite }
            : recipe
        ))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toaster position="top-right" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipes</h1>
          <p className="text-gray-600">
            Your collection of delicious recipes ({totalCount} total)
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setFilter('all')
              setPage(1)
            }}
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            All Recipes
          </Button>
          <Button
            variant={filter === 'favorites' ? 'default' : 'outline'}
            onClick={() => {
              setFilter('favorites')
              setPage(1)
            }}
            size="sm"
          >
            <Heart className="w-4 h-4 mr-2" />
            Favorites
          </Button>
        </div>

        {/* Loading State */}
        {loadingRecipes ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Recipes Grid */}
            {recipes.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'favorites' ? 'No favorite recipes yet' : 'No recipes yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {filter === 'favorites' 
                      ? 'Start favoriting recipes to see them here!' 
                      : 'Create your first recipe to get started!'
                    }
                  </p>
                  <Link href="/dashboard">
                    <Button>
                      <ChefHat className="w-4 h-4 mr-2" />
                      Generate Recipe
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <Card key={recipe.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href={`/recipes/${recipe.id}`} className="block">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{recipe.title}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleFavorite(recipe.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Heart 
                              className={`w-4 h-4 ${
                                recipe.isFavorite 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </Button>
                        </div>
                        {recipe.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                              {recipe.difficulty}
                            </span>
                            {recipe.cuisine && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {recipe.cuisine}
                              </span>
                            )}
                            
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {recipe.servings} servings
                            </div>
                            {recipe.prepTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {recipe.prepTime + (recipe.cookTime || 0)} min
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium">Ingredients:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {recipe.ingredients.slice(0, 3).join(', ')}
                              {recipe.ingredients.length > 3 && '...'}
                            </p>
                          </div>

                          <div className="text-xs text-gray-400">
                            Created {new Date(recipe.createdAt).toLocaleDateString()}
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-sm text-blue-600 font-medium">
                              Click to view full recipe →
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalCount > 12 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {page} of {Math.ceil(totalCount / 12)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(totalCount / 12)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import RecipeGenerator from '@/components/recipes/RecipeGenerator'
import RecipeDisplay from '@/components/recipes/RecipeDisplay'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChefHat, History, BookOpen, TrendingUp } from 'lucide-react'
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
  tips?: string[]
}

interface User {
  id: string
  email: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null)
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [stats, setStats] = useState({
    totalRecipes: 0,
    favoriteRecipes: 0,
    recentSearches: 0
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user as User)
      await loadUserData(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const loadUserData = async (userId: string) => {
    try {
      // Load recent recipes and stats from MongoDB via API
      const response = await fetch('/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecentRecipes(data.recentRecipes || [])
        setStats(data.stats || { totalRecipes: 0, favoriteRecipes: 0, recentSearches: 0 })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleRecipeGenerated = async (recipe: Recipe) => {
    setGeneratedRecipe(recipe)
    // Reload user data to update stats
    if (user) {
      await loadUserData(user.id)
    }
  }

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ recipeId: recipe.id })
      })

      if (response.ok) {
        toast.success('Recipe saved to your collection!')
        // Reload data to update stats
        if (user) {
          await loadUserData(user.id)
        }
      } else {
        throw new Error('Failed to save recipe')
      }
    } catch (error) {
      throw error
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email}!
          </h1>
          <p className="text-gray-600">
            Ready to create some delicious recipes? Let's get cooking!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.favoriteRecipes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentSearches}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipe Generator */}
          <div className="lg:col-span-2">
            {!generatedRecipe ? (
              <RecipeGenerator onRecipeGenerated={handleRecipeGenerated} />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Your Generated Recipe</h2>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedRecipe(null)}
                  >
                    Generate New Recipe
                  </Button>
                </div>
                <RecipeDisplay
                  recipe={generatedRecipe}
                  onSave={handleSaveRecipe}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/recipes" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View All Recipes
                  </Button>
                </Link>
                <Link href="/history" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <History className="w-4 h-4 mr-2" />
                    Search History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Recipes */}
            {recentRecipes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Recipes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentRecipes.slice(0, 3).map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipes/${recipe.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-sm">{recipe.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {recipe.servings} servings • {recipe.difficulty}
                      </p>
                    </Link>
                  ))}
                  {recentRecipes.length > 3 && (
                    <Link href="/recipes" className="block">
                      <Button variant="ghost" size="sm" className="w-full">
                        View all recipes →
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 
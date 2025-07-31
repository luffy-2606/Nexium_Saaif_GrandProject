'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, ArrowLeft, Search, Calendar, ChefHat } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

interface HistoryItem {
  id: string
  searchQuery: string
  ingredients: string[]
  dietaryRestrictions: string[]
  generatedRecipeId: string
  timestamp: string
}

interface User {
  id: string
  email: string
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(false)
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
      loadHistory()
    }
  }, [user, page])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const session = await supabase.auth.getSession()
      const response = await fetch(`/api/user/history?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
        setTotalCount(data.pagination.totalCount)
      } else {
        throw new Error('Failed to load history')
      }
    } catch (error) {
      console.error('Error loading history:', error)
      toast.error('Failed to load search history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search History</h1>
          <p className="text-gray-600">
            Your recipe generation history ({totalCount} searches)
          </p>
        </div>

        {/* Loading State */}
        {loadingHistory ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* History List */}
            {history.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No search history yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start generating recipes to see your search history here!
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
              <div className="space-y-4">
                {history.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Search className="w-5 h-5 text-gray-500" />
                          {item.searchQuery}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(item.timestamp)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients Used:</h4>
                          <div className="flex flex-wrap gap-1">
                            {item.ingredients.map((ingredient, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs"
                              >
                                {ingredient}
                              </span>
                            ))}
                          </div>
                        </div>

                        {item.dietaryRestrictions && item.dietaryRestrictions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions:</h4>
                            <div className="flex flex-wrap gap-1">
                              {item.dietaryRestrictions.map((restriction, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                >
                                  {restriction}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.generatedRecipeId && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-gray-600">
                              Recipe ID: {item.generatedRecipeId}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalCount > 20 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {page} of {Math.ceil(totalCount / 20)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(totalCount / 20)}
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
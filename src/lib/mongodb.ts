import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB_NAME || 'recipe_generator'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db(dbName)
}

export interface Recipe {
  _id?: string
  userId: string
  title: string
  ingredients: string[]
  instructions: string[]
  dietaryRestrictions: string[]
  cuisine: string | null
  prepTime: number | null
  cookTime: number | null
  servings: number | null
  difficulty: 'easy' | 'medium' | 'hard'
  aiGenerated: boolean
  originalLanguage: string
  translations?: {
    [language: string]: {
      title: string
      ingredients: string[]
      instructions: string[]
    }
  }
  createdAt: Date
  updatedAt: Date
  isFavorite: boolean
}

export interface UserHistory {
  _id?: string
  userId: string
  searchQuery: string
  ingredients: string[]
  dietaryRestrictions: string[]
  generatedRecipeId: string
  timestamp: Date
}

export default clientPromise 
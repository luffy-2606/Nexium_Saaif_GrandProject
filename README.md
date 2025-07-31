# Recipe Generator - AI-Powered Recipe Creation

A modern web application that transforms your available ingredients into delicious recipes using AI technology. Built with Next.js, Supabase, MongoDB, and integrates with AI services through n8n workflows or direct API calls.

## 🌟 Features

- **Magic Link Authentication**: Secure, passwordless login using Supabase Auth
- **AI Recipe Generation**: Create unique recipes based on available ingredients
- **Search History**: Track and revisit your recipe generation history
- **Dietary Restrictions**: Support for various dietary preferences and restrictions
- **Real-time Updates**: Live updates and notifications

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth (Magic Link)
- **Database**: MongoDB
- **AI Integration**: n8n workflows & Gemini
- **Deployment**: Vercel (with automatic CI/CD)
- **UI Components**: Custom components with Radix UI primitives

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account
- A MongoDB Atlas account 
- n8n instance (with Gemini API Key)

## 📖 Setup Requirements

- **Supabase** - Authentication and user management
- **MongoDB Atlas** - Database for recipes and user data  
- **n8n Cloud** - AI workflow automation

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── generate-recipe/ # Recipe generation endpoint
│   │   ├── recipes/         # Recipe management endpoints
│   │   └── user/            # User data endpoints
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Main dashboard
│   └── login/              # Login page
├── components/
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components
│   ├── recipes/            # Recipe-related components
│   └── ui/                 # Reusable UI components
└── lib/
    ├── supabase.ts         # Supabase client configuration
    ├── mongodb.ts          # MongoDB connection
    └── utils.ts            # Utility functions
```

## 🎯 Usage

### 1. Sign In
- Visit the application homepage
- Click "Get Started" or "Sign In"
- Enter your email address
- Check your email for the magic link
- Click the link to authenticate

### 2. Generate Recipes
- Navigate to the dashboard
- Add your available ingredients
- Set dietary restrictions (optional)
- Choose cuisine preferences
- Set servings and difficulty level
- Click "Generate Recipe"

### 3. Manage Recipes
- Save generated recipes to your collection
- Mark recipes as favorites
- Translate recipes to different languages
- View your recipe history


## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Monitoring

- **Supabase Dashboard**: Monitor authentication and database usage
- **MongoDB Atlas**: Track database performance and usage
- **Vercel Analytics**: Monitor application performance
- **n8n Dashboard**: Track workflow executions and errors


## 🎉 Features Roadmap

- [ ] Meal planning capabilities
- [ ] Nutritional information integration
- [ ] Recipe sharing and social features
- [ ] Mobile app version
- [ ] Recipe video generation
- [ ] Grocery list generation
- [ ] Recipe ratings and reviews


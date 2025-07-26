# Recipe Generator - AI-Powered Recipe Creation

A modern web application that transforms your available ingredients into delicious recipes using AI technology. Built with Next.js, Supabase, MongoDB, and integrates with AI services through n8n workflows or direct API calls.

## 🌟 Features

- **Magic Link Authentication**: Secure, passwordless login using Supabase Auth
- **AI Recipe Generation**: Create unique recipes based on available ingredients
- **Multi-Language Support**: Translate recipes into multiple languages
- **Recipe Management**: Save, organize, and favorite your recipes
- **Search History**: Track and revisit your recipe generation history
- **Dietary Restrictions**: Support for various dietary preferences and restrictions
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Updates**: Live updates and notifications

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth (Magic Link)
- **Database**: Supabase (PostgreSQL) + MongoDB
- **AI Integration**: OpenAI GPT-3.5/4, Hugging Face, n8n workflows
- **Deployment**: Vercel (with automatic CI/CD)
- **UI Components**: Custom components with Radix UI primitives

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account
- A MongoDB Atlas account (or local MongoDB)
- OpenAI API key (optional, for AI features)
- n8n instance (optional, for workflow automation)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd grand-project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=recipe_generator

# AI Service Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# n8n Webhook URLs (Optional)
N8N_WEBHOOK_URL=your_n8n_webhook_url

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

#### Supabase Setup
Follow the detailed guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

#### MongoDB Setup
Follow the detailed guide: [MONGODB_SETUP.md](./MONGODB_SETUP.md)

### 5. AI Integration (Optional)

#### n8n Workflows
Follow the detailed guide: [N8N_SETUP.md](./N8N_SETUP.md)

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Detailed Setup Guides

- **[Supabase Setup](./SUPABASE_SETUP.md)** - Complete guide for authentication and user management
- **[MongoDB Setup](./MONGODB_SETUP.md)** - Database configuration for recipes and user data
- **[n8n Setup](./N8N_SETUP.md)** - AI workflow automation setup

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

## 🔄 API Endpoints

### Recipe Generation
```http
POST /api/generate-recipe
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "ingredients": ["chicken", "rice", "vegetables"],
  "dietaryRestrictions": ["gluten-free"],
  "cuisine": "Asian",
  "servings": 4,
  "difficulty": "medium",
  "cookingTime": 45
}
```

### Recipe Translation
```http
POST /api/recipes/translate
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "recipeId": "recipe_id_here",
  "language": "spanish"
}
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Environment Variables**:
   - Add all environment variables in Vercel dashboard
   - Update Supabase redirect URLs for production

3. **Database Configuration**:
   - Update MongoDB network access for Vercel IPs
   - Configure Supabase for production domain

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

## 🔒 Security Considerations

- **Environment Variables**: Never commit sensitive keys to version control
- **Database Security**: Use MongoDB Atlas with IP whitelisting
- **Authentication**: Supabase handles secure authentication flows
- **API Protection**: All API routes require authentication
- **Rate Limiting**: Consider implementing rate limiting for AI API calls

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

- **Supabase Dashboard**: Monitor authentication and database usage
- **MongoDB Atlas**: Track database performance and usage
- **Vercel Analytics**: Monitor application performance
- **n8n Dashboard**: Track workflow executions and errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Authentication not working**:
   - Check Supabase configuration
   - Verify redirect URLs
   - Check environment variables

2. **Recipe generation failing**:
   - Verify API keys (OpenAI/Hugging Face)
   - Check n8n webhook URLs
   - Review API rate limits

3. **Database connection issues**:
   - Verify MongoDB connection string
   - Check network access settings
   - Ensure database user permissions

### Getting Help

- Check the detailed setup guides
- Review the troubleshooting sections in each guide
- Open an issue on GitHub
- Check the documentation links in each setup guide

## 🔄 Updates and Maintenance

- **Dependencies**: Regularly update packages for security
- **Database**: Monitor and optimize query performance
- **AI APIs**: Track usage and costs
- **Backups**: Ensure regular database backups

## 🎉 Features Roadmap

- [ ] Meal planning capabilities
- [ ] Nutritional information integration
- [ ] Recipe sharing and social features
- [ ] Mobile app version
- [ ] Recipe video generation
- [ ] Grocery list generation
- [ ] Recipe ratings and reviews

---

Built with ❤️ for food lovers who want to discover new recipes with AI technology.

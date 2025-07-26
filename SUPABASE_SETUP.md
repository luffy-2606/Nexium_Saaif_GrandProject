# Supabase Setup Guide for Recipe Generator

This guide will walk you through setting up Supabase for the Recipe Generator application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project" in your dashboard
3. Choose your organization
4. Enter project details:
   - **Name**: `recipe-generator`
   - **Database Password**: Generate a secure password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy the following values to your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 3. Set Up Database Tables

### 3.1 Create the profiles table

1. Go to **SQL Editor** in your Supabase dashboard
2. Run this SQL to create the profiles table:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 4. Configure Authentication

### 4.1 Enable Magic Link Authentication

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure the following settings:
   - **Enable email confirmations**: ON (recommended)
   - **Enable secure password change**: ON
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

### 4.2 Email Templates (Optional)

1. Go to **Authentication > Email Templates**
2. Customize the Magic Link email template:
   - **Subject**: "Your Magic Link for Recipe Generator"
   - **Body**: Customize with your branding

### 4.3 Custom SMTP (Optional)

For production, set up custom SMTP:
1. Go to **Authentication > Settings**
2. Scroll to **SMTP Settings**
3. Configure with your email provider (SendGrid, Mailgun, etc.)

## 5. Environment Variables

Update your `.env.local` file with all Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 6. Testing the Setup

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Enter your email address and click "Send magic link"

4. Check your email for the magic link

5. Click the link to authenticate

6. You should be redirected to the dashboard

## 7. Production Configuration

When deploying to production:

1. Update **Authentication > Settings**:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: `https://yourdomain.com/auth/callback`

2. Update your production environment variables

3. Set up custom domain (optional):
   - Go to **Settings > Custom Domain**
   - Follow the DNS configuration steps

## 8. Database Backups

1. Go to **Settings > Database**
2. Enable **Point in Time Recovery** for production
3. Set up daily backups

## 9. Monitoring and Analytics

1. Go to **Reports** to monitor:
   - Database performance
   - API usage
   - Authentication metrics

2. Set up alerts for important events

## Troubleshooting

### Common Issues:

1. **Magic link not working**:
   - Check your redirect URLs configuration
   - Verify SMTP settings
   - Check spam folder

2. **Authentication errors**:
   - Verify your environment variables
   - Check RLS policies
   - Ensure profiles table exists

3. **Database connection issues**:
   - Verify your database password
   - Check connection string format
   - Ensure proper network access

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After completing this setup:
1. Follow the MongoDB setup guide
2. Configure n8n workflows (optional)
3. Deploy your application
4. Set up monitoring and analytics 
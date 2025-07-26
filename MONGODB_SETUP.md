# MongoDB Setup Guide for Recipe Generator

This guide will walk you through setting up MongoDB for storing recipes and user data.

## 1. Choose Your MongoDB Option

### Option A: MongoDB Atlas (Recommended for Production)

MongoDB Atlas is the cloud database service - easiest for deployment.

### Option B: Local MongoDB

For development and testing.

## 2. Setting Up MongoDB Atlas

### 2.1 Create an Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Verify your email address

### 2.2 Create a Cluster

1. Click **"Build a Database"**
2. Choose **"FREE"** shared cluster
3. Select your preferred cloud provider and region
4. Choose cluster name: `recipe-generator-cluster`
5. Click **"Create Cluster"**

### 2.3 Configure Database Access

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Create a user:
   - **Authentication Method**: Password
   - **Username**: `recipe-app`
   - **Password**: Generate a secure password (save this!)
   - **Database User Privileges**: Read and write to any database
4. Click **"Add User"**

### 2.4 Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For production, add specific IP addresses
4. Click **"Confirm"**

### 2.5 Get Connection String

1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.0 or later"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://recipe-app:<password>@recipe-generator-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password

## 3. Setting Up Local MongoDB (Alternative)

### 3.1 Install MongoDB

**Windows:**
1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Follow the installation wizard

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 3.2 Start MongoDB

**Windows:** MongoDB should start automatically as a service

**macOS:**
```bash
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3.3 Local Connection String

For local MongoDB, use:
```
mongodb://localhost:27017/recipe_generator
```

## 4. Configure Environment Variables

Add to your `.env.local` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://recipe-app:YOUR_PASSWORD@recipe-generator-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=recipe_generator
```

For local MongoDB:
```env
# Local MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/recipe_generator
MONGODB_DB_NAME=recipe_generator
```

## 5. Database Collections

The application will automatically create these collections:

### 5.1 recipes Collection

```javascript
{
  _id: ObjectId,
  userId: String,           // Supabase user ID
  title: String,
  description: String,
  ingredients: Array,       // Array of strings
  instructions: Array,      // Array of strings
  dietaryRestrictions: Array,
  cuisine: String,
  prepTime: Number,         // Minutes
  cookTime: Number,         // Minutes
  servings: Number,
  difficulty: String,       // 'easy', 'medium', 'hard'
  aiGenerated: Boolean,
  originalLanguage: String,
  translations: {           // Nested object
    language: {
      title: String,
      ingredients: Array,
      instructions: Array
    }
  },
  createdAt: Date,
  updatedAt: Date,
  isFavorite: Boolean
}
```

### 5.2 userHistory Collection

```javascript
{
  _id: ObjectId,
  userId: String,           // Supabase user ID
  searchQuery: String,
  ingredients: Array,
  dietaryRestrictions: Array,
  generatedRecipeId: String,
  timestamp: Date
}
```

## 6. Setting Up Indexes (Recommended)

Create indexes for better performance:

1. Open MongoDB Compass or Atlas web interface
2. Navigate to your database collections
3. Create these indexes:

### For recipes collection:
```javascript
// Index on userId for faster user-specific queries
{ userId: 1 }

// Compound index for search functionality
{ userId: 1, createdAt: -1 }

// Index for favorites
{ userId: 1, isFavorite: 1 }

// Text index for recipe search
{ title: "text", description: "text", "ingredients": "text" }
```

### For userHistory collection:
```javascript
// Index on userId and timestamp
{ userId: 1, timestamp: -1 }
```

## 7. Database Security Best Practices

### 7.1 MongoDB Atlas Security

1. **Network Security:**
   - Use specific IP whitelisting in production
   - Enable VPC peering for advanced setups

2. **Authentication:**
   - Use strong passwords for database users
   - Rotate passwords regularly
   - Use role-based access control

3. **Encryption:**
   - Atlas encrypts data at rest by default
   - Enable client-side field level encryption for sensitive data

### 7.2 Local MongoDB Security

1. **Enable Authentication:**
   ```bash
   # Create admin user
   mongo
   use admin
   db.createUser({
     user: "admin",
     pwd: "strongpassword",
     roles: ["userAdminAnyDatabase"]
   })
   ```

2. **Enable auth in config:**
   ```yaml
   # /etc/mongod.conf
   security:
     authorization: enabled
   ```

## 8. Monitoring and Backup

### 8.1 MongoDB Atlas

- **Monitoring**: Built-in monitoring dashboard
- **Backup**: Automatic backups with point-in-time recovery
- **Alerts**: Set up alerts for performance issues

### 8.2 Local MongoDB

- **Backup**:
  ```bash
  mongodump --db recipe_generator --out /backup/path
  ```
- **Restore**:
  ```bash
  mongorestore --db recipe_generator /backup/path/recipe_generator
  ```

## 9. Testing the Connection

Create a test script to verify your MongoDB connection:

```javascript
// test-mongo.js
const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  } finally {
    await client.close();
  }
}

testConnection();
```

Run the test:
```bash
node test-mongo.js
```

## 10. Troubleshooting

### Common Issues:

1. **Connection timeout**:
   - Check network access settings in Atlas
   - Verify IP whitelist
   - Check firewall settings

2. **Authentication failed**:
   - Verify username and password
   - Check connection string format
   - Ensure user has proper permissions

3. **Database not found**:
   - Database is created automatically on first write
   - Verify database name in connection string

4. **Performance issues**:
   - Add appropriate indexes
   - Monitor query performance
   - Consider connection pooling

### Getting Help:

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Community Forums](https://community.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/) (Free courses)

## 11. Production Optimization

1. **Connection Pooling**: Already handled by the MongoDB driver
2. **Indexing**: Create indexes for all frequently queried fields
3. **Sharding**: For very large datasets (Atlas handles this)
4. **Monitoring**: Set up alerts for performance metrics
5. **Backup Strategy**: Configure automated backups with retention policies

## Next Steps

After completing this setup:
1. Test the database connection
2. Run your Next.js application
3. Generate a few recipes to test data storage
4. Set up monitoring and alerts
5. Configure n8n workflows (optional) 
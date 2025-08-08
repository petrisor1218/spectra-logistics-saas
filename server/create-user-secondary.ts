import { dbSecondary } from './db-secondary';
import { usersSecondary } from '../shared/schema-secondary';
import bcrypt from 'bcryptjs';

export async function createUserInSecondaryDB() {
  try {
    console.log('Testing connection to secondary database...');
    
    // Test connection
    const result = await dbSecondary.execute(/* sql */`SELECT NOW() as current_time`);
    console.log('✅ Connection successful:', result);
    
    // Create tables if they don't exist
    console.log('Creating tables...');
    await dbSecondary.execute(/* sql */`
      CREATE TABLE IF NOT EXISTS users_secondary (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await dbSecondary.execute(/* sql */`
      CREATE TABLE IF NOT EXISTS projects_secondary (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users_secondary(id),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await dbSecondary.execute(/* sql */`
      CREATE TABLE IF NOT EXISTS tasks_secondary (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        project_id INTEGER REFERENCES projects_secondary(id),
        assigned_to INTEGER REFERENCES users_secondary(id),
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tables created successfully');
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [newUser] = await dbSecondary.insert(usersSecondary).values({
      username: 'testuser',
      password: hashedPassword,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    }).returning();
    
    console.log('✅ User created successfully:', newUser);
    return newUser;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createUserInSecondaryDB()
    .then(() => {
      console.log('✅ All operations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
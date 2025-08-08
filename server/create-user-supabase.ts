import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export async function createUserInSupabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL_SECONDARY
  });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully to Supabase');

    // Create tables if they don't exist
    console.log('Creating tables...');
    
    await client.query(`
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
    
    await client.query(`
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
    
    await client.query(`
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
    
    const result = await client.query(`
      INSERT INTO users_secondary (username, password, email, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['testuser', hashedPassword, 'test@example.com', 'Test', 'User', 'user']);
    
    const newUser = result.rows[0];
    console.log('✅ User created successfully:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: newUser.role,
      createdAt: newUser.created_at
    });
    
    // Create a sample project for the user
    const projectResult = await client.query(`
      INSERT INTO projects_secondary (name, description, user_id, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['Primul Proiect', 'Acesta este primul proiect de test în baza de date secundară', newUser.id, 'active']);
    
    const newProject = projectResult.rows[0];
    console.log('✅ Project created successfully:', {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      userId: newProject.user_id,
      status: newProject.status
    });
    
    // Create a sample task for the project
    const taskResult = await client.query(`
      INSERT INTO tasks_secondary (title, description, project_id, assigned_to, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['Prima sarcină', 'Aceasta este prima sarcină de test', newProject.id, newUser.id, 'pending', 'high']);
    
    const newTask = taskResult.rows[0];
    console.log('✅ Task created successfully:', {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      projectId: newTask.project_id,
      assignedTo: newTask.assigned_to,
      status: newTask.status,
      priority: newTask.priority
    });
    
    return {
      user: newUser,
      project: newProject,
      task: newTask
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('📦 Connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createUserInSupabase()
    .then((result) => {
      console.log('\n🎉 SUCCESS! Toate datele au fost create în baza de date secundară:');
      console.log('- User:', result.user.username);
      console.log('- Project:', result.project.name);
      console.log('- Task:', result.task.title);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
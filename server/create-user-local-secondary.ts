import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export async function createUserInLocalSecondaryDB() {
  // Use the existing DATABASE_URL but create a separate schema
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to local PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Connected successfully to local PostgreSQL');

    // Create a separate schema for the secondary database
    console.log('Creating secondary schema...');
    await client.query('CREATE SCHEMA IF NOT EXISTS secondary_db');
    console.log('✅ Secondary schema created');

    // Create tables in the secondary schema
    console.log('Creating tables in secondary schema...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS secondary_db.users_secondary (
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
      CREATE TABLE IF NOT EXISTS secondary_db.projects_secondary (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES secondary_db.users_secondary(id),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS secondary_db.tasks_secondary (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        project_id INTEGER REFERENCES secondary_db.projects_secondary(id),
        assigned_to INTEGER REFERENCES secondary_db.users_secondary(id),
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tables created successfully in secondary schema');
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const result = await client.query(`
      INSERT INTO secondary_db.users_secondary (username, password, email, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['alexandru', hashedPassword, 'alexandru@example.com', 'Alexandru', 'Test', 'user']);
    
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
      INSERT INTO secondary_db.projects_secondary (name, description, user_id, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['Proiect Personal', 'Primul meu proiect în baza de date secundară', newUser.id, 'active']);
    
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
      INSERT INTO secondary_db.tasks_secondary (title, description, project_id, assigned_to, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['Configurare inițială', 'Setează baza de date secundară și creează primul user', newProject.id, newUser.id, 'completed', 'high']);
    
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
    
    // Verify data isolation - check that main database is unaffected
    const mainTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const secondaryTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'secondary_db' AND table_type = 'BASE TABLE'
    `);
    
    console.log('📊 Database verification:');
    console.log('Main database tables:', mainTablesResult.rows.map(r => r.table_name));
    console.log('Secondary database tables:', secondaryTablesResult.rows.map(r => r.table_name));
    
    client.release();
    
    return {
      user: newUser,
      project: newProject,
      task: newTask,
      schema: 'secondary_db'
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('📦 Connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createUserInLocalSecondaryDB()
    .then((result) => {
      console.log('\n🎉 SUCCESS! Baza de date secundară a fost creată cu succes!');
      console.log('📍 Schema:', result.schema);
      console.log('👤 User:', result.user.username);
      console.log('📁 Project:', result.project.name);
      console.log('📋 Task:', result.task.title);
      console.log('\n✅ Datele principale sunt complet separate și neatinse!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
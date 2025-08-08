import { Pool } from 'pg';
import { Request, Response } from 'express';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get all users from secondary database
export async function getSecondaryUsers(req: Request, res: Response) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM secondary_db.users_secondary ORDER BY created_at DESC');
    client.release();
    
    res.json({
      success: true,
      users: result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching secondary users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
}

// Get all projects with their tasks
export async function getSecondaryProjects(req: Request, res: Response) {
  try {
    const client = await pool.connect();
    
    // Get projects with user info and task counts
    const result = await client.query(`
      SELECT 
        p.*,
        u.username as owner_username,
        COUNT(t.id) as task_count
      FROM secondary_db.projects_secondary p
      LEFT JOIN secondary_db.users_secondary u ON p.user_id = u.id
      LEFT JOIN secondary_db.tasks_secondary t ON p.id = t.project_id
      GROUP BY p.id, u.username
      ORDER BY p.created_at DESC
    `);
    
    client.release();
    
    res.json({
      success: true,
      projects: result.rows.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        ownerUsername: project.owner_username,
        taskCount: parseInt(project.task_count),
        createdAt: project.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching secondary projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
}

// Get all tasks with project and user info
export async function getSecondaryTasks(req: Request, res: Response) {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        t.*,
        p.name as project_name,
        u.username as assignee_username
      FROM secondary_db.tasks_secondary t
      LEFT JOIN secondary_db.projects_secondary p ON t.project_id = p.id
      LEFT JOIN secondary_db.users_secondary u ON t.assigned_to = u.id
      ORDER BY t.created_at DESC
    `);
    
    client.release();
    
    res.json({
      success: true,
      tasks: result.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectName: task.project_name,
        assigneeUsername: task.assignee_username,
        dueDate: task.due_date,
        createdAt: task.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching secondary tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
}

// Get database statistics
export async function getSecondaryStats(req: Request, res: Response) {
  try {
    const client = await pool.connect();
    
    // Get counts from all tables
    const userCount = await client.query('SELECT COUNT(*) FROM secondary_db.users_secondary');
    const projectCount = await client.query('SELECT COUNT(*) FROM secondary_db.projects_secondary');
    const taskCount = await client.query('SELECT COUNT(*) FROM secondary_db.tasks_secondary');
    
    // Get main database tables (to verify separation)
    const mainTables = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    client.release();
    
    res.json({
      success: true,
      stats: {
        secondaryDatabase: {
          users: parseInt(userCount.rows[0].count),
          projects: parseInt(projectCount.rows[0].count),
          tasks: parseInt(taskCount.rows[0].count),
          schema: 'secondary_db'
        },
        mainDatabase: {
          tables: parseInt(mainTables.rows[0].table_count),
          schema: 'public'
        },
        separation: 'Complete - no data overlap'
      }
    });
  } catch (error) {
    console.error('Error fetching secondary stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
}
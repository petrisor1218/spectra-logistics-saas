// Exemplu de utilizare a ambelor baze de date simultan

import { db } from './db';                              // Baza de date principală
import { dbSecondary } from './db-secondary';           // Baza de date secundară

// Schema pentru baza de date principală
import { users, companies } from '../shared/schema';

// Schema pentru baza de date secundară  
import { usersSecondary, projectsSecondary, tasksSecondary } from '../shared/schema-secondary';

import { eq } from 'drizzle-orm';

export class DualDatabaseService {
  
  // Operații pe baza de date principală (existentă)
  async getMainUsers() {
    return await db.select().from(users);
  }
  
  async getMainCompanies() {
    return await db.select().from(companies);
  }
  
  // Operații pe baza de date secundară (nouă)
  async getSecondaryUsers() {
    return await dbSecondary.select().from(usersSecondary);
  }
  
  async createProject(projectData: any) {
    return await dbSecondary.insert(projectsSecondary).values(projectData).returning();
  }
  
  async getProjectsWithTasks() {
    return await dbSecondary
      .select()
      .from(projectsSecondary)
      .leftJoin(tasksSecondary, eq(projectsSecondary.id, tasksSecondary.projectId));
  }
  
  // Exemplu de operație care folosește ambele baze de date
  async migrateUserToSecondarySystem(userId: number) {
    // Citește user din baza de date principală
    const [mainUser] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!mainUser) {
      throw new Error('User not found in main database');
    }
    
    // Creează user în baza de date secundară
    const [secondaryUser] = await dbSecondary.insert(usersSecondary).values({
      username: mainUser.username,
      password: mainUser.password,
      email: mainUser.email,
      firstName: mainUser.firstName,
      lastName: mainUser.lastName,
      role: 'user'
    }).returning();
    
    return {
      mainUser,
      secondaryUser,
      message: 'User successfully created in secondary system'
    };
  }
  
  // Statistici din ambele sisteme
  async getSystemStats() {
    const [mainUsersCount] = await db.select().from(users);
    const [secondaryUsersCount] = await dbSecondary.select().from(usersSecondary);
    const [projectsCount] = await dbSecondary.select().from(projectsSecondary);
    
    return {
      mainDatabase: {
        usersCount: mainUsersCount ? 1 : 0, // Simplificat pentru exemplu
      },
      secondaryDatabase: {
        usersCount: secondaryUsersCount ? 1 : 0,
        projectsCount: projectsCount ? 1 : 0,
      }
    };
  }
}

export const dualDbService = new DualDatabaseService();
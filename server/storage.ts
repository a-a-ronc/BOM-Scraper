import { 
  type User, 
  type InsertUser, 
  type Project, 
  type InsertProject, 
  type ProjectFile, 
  type InsertProjectFile,
  type BomItem, 
  type InsertBomItem,
  type AgentLog,
  type InsertAgentLog,
  users,
  projects,
  projectFiles,
  bomItems,
  agentLogs
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;

  // Project file operations
  getProjectFiles(projectId: string): Promise<ProjectFile[]>;
  getProjectFile(id: string): Promise<ProjectFile | undefined>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  updateProjectFile(id: string, updates: Partial<ProjectFile>): Promise<ProjectFile>;
  deleteProjectFile(id: string): Promise<void>;

  // BOM operations
  getBomItemsByProject(projectId: string, vendor?: string): Promise<BomItem[]>;
  createBomItem(item: InsertBomItem): Promise<BomItem>;
  clearBomItems(projectId: string): Promise<void>;

  // Agent log operations
  getAgentLogsByProject(projectId: string): Promise<AgentLog[]>;
  createAgentLog(log: InsertAgentLog): Promise<AgentLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private projectFiles: Map<string, ProjectFile> = new Map();
  private bomItems: Map<string, BomItem> = new Map();
  private agentLogs: Map<string, AgentLog> = new Map();

  constructor() {
    // Initialize with sample data for Falcon Fulfillment project
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample user
    const sampleUser: User = {
      id: "sample-user-id",
      email: "john@engineering.com",
      password: "$2b$10$...", // placeholder hash
      createdAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);

    // Create sample project
    const sampleProject: Project = {
      id: "sample-project-id",
      name: "Falcon Fulfillment Rack System",
      customer: "Falcon Fulfillment",
      projectName: "Falcon Fulfillment Rack System",
      address: "1065 Conestoga Pkwy, Shepherdsville, KY 40165",
      drawingNo: "D-241254-R-180",
      revision: "0",
      metadata: {
        palletSize: "40\"×48\"×52\"",
        loadCapacity: 1000,
        clearHeight: "6'-0\"",
        trussHeight: "35'-4\"",
        views: ["TOP VIEW", "ELEVATION VIEW"],
      } as any,
      createdBy: sampleUser.id,
      createdAt: new Date(),
    };
    this.projects.set(sampleProject.id, sampleProject);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.createdBy === userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      address: insertProject.address || null,
      customer: insertProject.customer || null,
      projectName: insertProject.projectName || null,
      drawingNo: insertProject.drawingNo || null,
      revision: insertProject.revision || null,
      metadata: (insertProject.metadata as any) || null,
      createdBy: insertProject.createdBy || null,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) {
      throw new Error("Project not found");
    }
    const updated = { ...existing, ...updates };
    this.projects.set(id, updated);
    return updated;
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return Array.from(this.projectFiles.values()).filter(file => file.projectId === projectId);
  }

  async createProjectFile(insertFile: InsertProjectFile): Promise<ProjectFile> {
    const id = randomUUID();
    const file: ProjectFile = {
      ...insertFile,
      id,
      uploadedAt: new Date(),
      projectId: insertFile.projectId || null,
      filePath: (insertFile as any).filePath || null,
      fileType: insertFile.fileType || null,
      pageCount: insertFile.pageCount || null,
      parsedData: insertFile.parsedData || null,
    };
    this.projectFiles.set(id, file);
    return file;
  }

  async getProjectFile(id: string): Promise<ProjectFile | undefined> {
    return this.projectFiles.get(id);
  }

  async updateProjectFile(id: string, updates: Partial<ProjectFile>): Promise<ProjectFile> {
    const existing = this.projectFiles.get(id);
    if (!existing) {
      throw new Error("Project file not found");
    }
    const updated = { ...existing, ...updates };
    this.projectFiles.set(id, updated);
    return updated;
  }

  async deleteProjectFile(id: string): Promise<void> {
    this.projectFiles.delete(id);
  }

  async getBomItemsByProject(projectId: string, vendor?: string): Promise<BomItem[]> {
    return Array.from(this.bomItems.values())
      .filter(item => item.projectId === projectId && (!vendor || item.vendor === vendor));
  }

  async createBomItem(insertItem: InsertBomItem): Promise<BomItem> {
    const id = randomUUID();
    const item: BomItem = {
      ...insertItem,
      id,
      projectId: insertItem.projectId || null,
      unitPrice: insertItem.unitPrice || null,
      totalPrice: insertItem.totalPrice || null,
      calcInputs: insertItem.calcInputs || null,
    };
    this.bomItems.set(id, item);
    return item;
  }

  async clearBomItems(projectId: string): Promise<void> {
    const itemsToDelete = Array.from(this.bomItems.entries())
      .filter(([_, item]) => item.projectId === projectId);
    
    itemsToDelete.forEach(([id, _]) => {
      this.bomItems.delete(id);
    });
  }

  async getAgentLogsByProject(projectId: string): Promise<AgentLog[]> {
    return Array.from(this.agentLogs.values())
      .filter(log => log.projectId === projectId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const id = randomUUID();
    const log: AgentLog = {
      ...insertLog,
      id,
      createdAt: new Date(),
      projectId: insertLog.projectId || null,
      details: insertLog.details || null,
    };
    this.agentLogs.set(id, log);
    return log;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.createdBy, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject as any)
      .returning();
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));
  }

  async getProjectFile(id: string): Promise<ProjectFile | undefined> {
    const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, id));
    return file || undefined;
  }

  async createProjectFile(insertFile: InsertProjectFile): Promise<ProjectFile> {
    const [file] = await db
      .insert(projectFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateProjectFile(id: string, updates: Partial<ProjectFile>): Promise<ProjectFile> {
    const [file] = await db
      .update(projectFiles)
      .set(updates)
      .where(eq(projectFiles.id, id))
      .returning();
    
    if (!file) {
      throw new Error("Project file not found");
    }
    return file;
  }

  async deleteProjectFile(id: string): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }

  async getBomItemsByProject(projectId: string, vendor?: string): Promise<BomItem[]> {
    return await db.select().from(bomItems).where(
      vendor 
        ? and(eq(bomItems.projectId, projectId), eq(bomItems.vendor, vendor))
        : eq(bomItems.projectId, projectId)
    );
  }

  async createBomItem(insertItem: InsertBomItem): Promise<BomItem> {
    const [item] = await db
      .insert(bomItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async clearBomItems(projectId: string): Promise<void> {
    await db.delete(bomItems).where(eq(bomItems.projectId, projectId));
  }

  async getAgentLogsByProject(projectId: string): Promise<AgentLog[]> {
    return await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.projectId, projectId))
      .orderBy(desc(agentLogs.createdAt));
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const [log] = await db
      .insert(agentLogs)
      .values(insertLog)
      .returning();
    return log;
  }
}

export const storage = new DatabaseStorage();

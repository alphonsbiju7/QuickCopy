import { type User, type InsertUser, type File, type InsertFile, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File methods
  getAllFiles(): Promise<File[]>;
  getFileById(id: string): Promise<File | undefined>;
  getFilesByStudentId(studentId: string): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, updates: Partial<File>): Promise<File | undefined>;
  deleteFile(id: string): Promise<boolean>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByFileId(fileId: string): Promise<Notification[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private files: Map<string, File>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.notifications = new Map();
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin"
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllFiles(): Promise<File[]> {
    return Array.from(this.files.values()).sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }

  async getFileById(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByStudentId(studentId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.studentId === studentId
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = {
      ...insertFile,
      id,
      uploadDate: new Date(),
      downloadDate: null,
      status: insertFile.status || "uploaded",
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: string): Promise<boolean> {
    return this.files.delete(id);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      sentDate: new Date(),
      status: insertNotification.status || "sent",
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotificationsByFileId(fileId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.fileId === fileId
    );
  }
}

export const storage = new MemStorage();

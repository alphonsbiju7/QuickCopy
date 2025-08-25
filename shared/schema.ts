import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadDate: timestamp("upload_date").notNull().default(sql`now()`),
  status: text("status").notNull().default("uploaded"), // uploaded, downloaded, notified
  token: text("token"),
  downloadDate: timestamp("download_date"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull(),
  studentId: text("student_id").notNull(),
  token: text("token").notNull(),
  message: text("message").notNull(),
  sentDate: timestamp("sent_date").notNull().default(sql`now()`),
  status: text("status").notNull().default("sent"), // sent, delivered, failed
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).extend({
  role: z.string().default("admin"),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadDate: true,
  downloadDate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentDate: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LoginData = z.infer<typeof loginSchema>;

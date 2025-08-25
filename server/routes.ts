import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const file = await storage.getFileById(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Generate token
      const token = `QC-${randomBytes(2).toString('hex').toUpperCase()}${Math.floor(Math.random() * 1000)}`;
      
      // Update file status
      const updatedFile = await storage.updateFile(id, {
        status: "downloaded",
        token,
        downloadDate: new Date(),
      });
      
      if (!updatedFile) {
        return res.status(500).json({ message: "Failed to update file" });
      }
      
      // Create notification
      await storage.createNotification({
        fileId: id,
        studentId: file.studentId,
        token,
        message: `Your file ${file.fileName} has been downloaded. Collection token: ${token}`,
        status: "sent",
      });
      
      res.json({ message: "File downloaded and notification sent", token, file: updatedFile });
    } catch (error) {
      res.status(500).json({ message: "Download failed" });
    }
  });

  app.post("/api/files/batch-download", async (req, res) => {
    try {
      const { fileIds } = req.body;
      
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({ message: "Invalid file IDs" });
      }
      
      const results = [];
      
      for (const fileId of fileIds) {
        const file = await storage.getFileById(fileId);
        if (file && file.status === "uploaded") {
          const token = `QC-${randomBytes(2).toString('hex').toUpperCase()}${Math.floor(Math.random() * 1000)}`;
          
          const updatedFile = await storage.updateFile(fileId, {
            status: "downloaded",
            token,
            downloadDate: new Date(),
          });
          
          if (updatedFile) {
            await storage.createNotification({
              fileId,
              studentId: file.studentId,
              token,
              message: `Your file ${file.fileName} has been downloaded. Collection token: ${token}`,
              status: "sent",
            });
            
            results.push({ file: updatedFile, token });
          }
        }
      }
      
      res.json({ 
        message: `${results.length} files downloaded and notifications sent`, 
        results 
      });
    } catch (error) {
      res.status(500).json({ message: "Batch download failed" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFile(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.post("/api/files/:id/resend-notification", async (req, res) => {
    try {
      const { id } = req.params;
      const file = await storage.getFileById(id);
      
      if (!file || !file.token) {
        return res.status(404).json({ message: "File not found or no token available" });
      }
      
      await storage.createNotification({
        fileId: id,
        studentId: file.studentId,
        token: file.token,
        message: `Reminder: Your file ${file.fileName} has been downloaded. Collection token: ${file.token}`,
        status: "sent",
      });
      
      res.json({ message: "Notification resent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resend notification" });
    }
  });

  // Demo: Create sample files
  app.post("/api/files/demo", async (req, res) => {
    try {
      const sampleFiles = [
        {
          studentId: "CS21001",
          studentName: "Rahul Sharma",
          fileName: "Assignment_1.pdf",
          fileSize: "2.4 MB",
          filePath: "/uploads/assignment_1.pdf",
          status: "uploaded",
          token: null,
        },
        {
          studentId: "CS21002",
          studentName: "Priya Patel",
          fileName: "Project_Report.docx",
          fileSize: "1.8 MB",
          filePath: "/uploads/project_report.docx",
          status: "downloaded",
          token: "QC-7829",
        },
        {
          studentId: "CS21003",
          studentName: "Arjun Kumar",
          fileName: "Presentation.pptx",
          fileSize: "5.2 MB",
          filePath: "/uploads/presentation.pptx",
          status: "uploaded",
          token: null,
        },
        {
          studentId: "CS21004",
          studentName: "Sneha Singh",
          fileName: "Data_Analysis.xlsx",
          fileSize: "3.1 MB",
          filePath: "/uploads/data_analysis.xlsx",
          status: "notified",
          token: "QC-7830",
        },
      ];

      const createdFiles = [];
      for (const fileData of sampleFiles) {
        const file = await storage.createFile(fileData);
        createdFiles.push(file);
      }

      res.json({ message: "Sample files created", files: createdFiles });
    } catch (error) {
      res.status(500).json({ message: "Failed to create sample files" });
    }
  });

  // Statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const files = await storage.getAllFiles();
      
      const stats = {
        totalFiles: files.length,
        downloaded: files.filter(f => f.status === "downloaded").length,
        pending: files.filter(f => f.status === "uploaded").length,
        notified: files.filter(f => f.status === "notified").length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

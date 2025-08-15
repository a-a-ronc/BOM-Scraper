import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseDocument } from "./services/parser";
import { calculateBOM } from "./services/rules-engine";
import { mapToVendor } from "./services/vendor-mapper";
import { insertUserSchema, insertProjectSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ user: { id: user.id, email: user.email } });
  });

  // Middleware to check authentication
  const requireAuth = async (req: Request, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Project routes
  app.get("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjectsByUser(req.session.userId!);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const files = await storage.getProjectFiles(project.id);
      const bomItems = await storage.getBomItemsByProject(project.id);
      const logs = await storage.getAgentLogsByProject(project.id);

      res.json({
        ...project,
        files,
        bomItems,
        logs,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        createdBy: req.session.userId,
      });

      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.post("/api/projects/:id/files", requireAuth, upload.single('pdf'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Parse the PDF document
      const parsedData = await parseDocument(req.file.path);

      const projectFile = await storage.createProjectFile({
        projectId: project.id,
        filename: req.file.originalname, // Store the original filename for display
        filePath: req.file.path, // Store the filesystem path for parsing
        fileType: req.file.mimetype,
        pageCount: parsedData.pageCount || 1,
        parsedData,
      });

      // If this is the first file and contains project metadata, update project
      if (parsedData.customer || parsedData.drawingNo) {
        const updatedProject = await storage.updateProject(project.id, {
          customer: parsedData.customer || project.customer,
          drawingNo: parsedData.drawingNo || project.drawingNo,
          address: parsedData.address || project.address,
          metadata: {
            ...project.metadata,
            ...parsedData.metadata,
          },
        });
        
        res.json({ file: projectFile, project: updatedProject });
      } else {
        res.json({ file: projectFile });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing file upload" });
    }
  });

  // Delete project file
  app.delete("/api/projects/:id/files/:fileId", requireAuth, async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const file = await storage.getProjectFile(req.params.fileId);
      if (!file || file.projectId !== project.id) {
        return res.status(404).json({ message: "File not found" });
      }

      await storage.deleteProjectFile(req.params.fileId);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting file" });
    }
  });

  app.post("/api/projects/:id/parse", requireAuth, async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const files = await storage.getProjectFiles(project.id);
      let combinedParsedData = {};

      // Re-parse all files
      for (const file of files) {
        // Use the stored filepath for parsing, fallback to filename if no filePath
        const filePath = (file as any).filePath || file.filename;
        const parsedData = await parseDocument(filePath);
        combinedParsedData = { ...combinedParsedData, ...parsedData };
        
        await storage.updateProjectFile(file.id, { parsedData });
      }

      // Update project with combined metadata
      const updatedProject = await storage.updateProject(project.id, {
        customer: (combinedParsedData as any).customer || project.customer,
        drawingNo: (combinedParsedData as any).drawingNo || project.drawingNo,
        address: (combinedParsedData as any).address || project.address,
        metadata: {
          ...project.metadata,
          ...(combinedParsedData as any).metadata,
        },
      });

      res.json({ project: updatedProject, parsedData: combinedParsedData });
    } catch (error) {
      res.status(500).json({ message: "Error re-parsing project files" });
    }
  });

  app.post("/api/projects/:id/bom", requireAuth, async (req: Request, res: Response) => {
    try {
      const { vendors } = req.body;
      if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
        return res.status(400).json({ message: "Vendors array is required" });
      }

      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Clear existing BOM items
      await storage.clearBomItems(project.id);

      // Calculate BOM for each vendor
      const results: Record<string, any> = {};
      for (const vendor of vendors) {
        const bomCalculation = await calculateBOM(project);
        const vendorBomItems = await mapToVendor(bomCalculation, vendor);
        
        // Store BOM items
        for (const item of vendorBomItems) {
          await storage.createBomItem({
            ...item,
            projectId: project.id,
            vendor,
          });
        }

        results[vendor] = vendorBomItems;
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Error generating BOM" });
    }
  });

  app.get("/api/projects/:id/bom", requireAuth, async (req: Request, res: Response) => {
    try {
      const { vendor } = req.query;
      
      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const bomItems = await storage.getBomItemsByProject(project.id, vendor as string);
      res.json(bomItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching BOM items" });
    }
  });

  app.get("/api/projects/:id/bom/export", requireAuth, async (req: Request, res: Response) => {
    try {
      const { format, vendor } = req.query;
      
      const project = await storage.getProject(req.params.id);
      if (!project || project.createdBy !== req.session.userId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const bomItems = await storage.getBomItemsByProject(project.id, vendor as string);
      
      if (format === 'csv') {
        // Generate CSV
        let csv = 'Family,Part Code,Description,Quantity,UOM,Unit Price,Total Price\n';
        bomItems.forEach(item => {
          csv += `${item.family},${item.partCode},${item.description},${item.quantity},${item.uom},${item.unitPrice || 0},${item.totalPrice || 0}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}_BOM_${vendor || 'all'}.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error exporting BOM" });
    }
  });

  app.get("/api/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

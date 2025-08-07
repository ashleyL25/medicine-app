import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Try multiple possible locations for the client template
      const possibleTemplates = [
        "/app/client/index.html",
        "./client/index.html", 
        "client/index.html"
      ];
      
      let clientTemplate: string | null = null;
      for (const template of possibleTemplates) {
        if (fs.existsSync(template)) {
          clientTemplate = template;
          break;
        }
      }
      
      if (!clientTemplate) {
        throw new Error("Could not find client/index.html template");
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use hardcoded paths that we know will work on Railway
  const possiblePaths = [
    "/app/dist/public",        // Railway working directory
    "./dist/public",           // Relative to current directory
    "dist/public",             // Another relative option
    "/app/public",             // Alternative Railway path
    "./public"                 // Fallback
  ];
  
  console.log("Searching for static files in possible paths...");
  
  let staticPath: string | null = null;
  
  for (const testPath of possiblePaths) {
    console.log(`Checking: ${testPath}`);
    if (fs.existsSync(testPath)) {
      console.log(`✓ Found static files at: ${testPath}`);
      if (fs.existsSync(path.join(testPath, "index.html"))) {
        console.log("✓ index.html found");
        staticPath = testPath;
        break;
      } else {
        console.log("✗ No index.html found");
      }
    } else {
      console.log("✗ Path does not exist");
    }
  }
  
  if (!staticPath) {
    console.error("Could not find static files in any of the expected locations");
    console.error("Available paths:", possiblePaths);
    
    // Last resort - try to serve something
    app.use("*", (_req, res) => {
      res.status(200).json({ 
        error: "Static files not found",
        message: "The React app could not be loaded",
        possiblePaths: possiblePaths
      });
    });
    return;
  }
  
  console.log(`Using static path: ${staticPath}`);
  
  // Serve static files
  app.use(express.static(staticPath));
  
  // Fallback to index.html for SPA routing
  app.use("*", (_req, res) => {
    const indexPath = path.join(staticPath!, "index.html");
    console.log(`Serving index.html from: ${indexPath}`);
    res.sendFile(path.resolve(indexPath));
  });
}

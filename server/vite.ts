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
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html",
      );

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
  const cwd = process.cwd();
  console.log("Current working directory:", cwd);
  console.log("Process argv:", process.argv);
  console.log("__dirname available:", typeof __dirname !== 'undefined' ? __dirname : 'undefined');
  
  const distPath = path.resolve(cwd, "dist", "public");
  console.log("Looking for static files in:", distPath);
  console.log("Directory exists:", fs.existsSync(distPath));
  
  if (fs.existsSync(distPath)) {
    console.log("Contents of dist/public:", fs.readdirSync(distPath));
  }

  if (!fs.existsSync(distPath)) {
    // Try alternative paths
    const altPath1 = path.resolve(cwd, "public");
    const altPath2 = path.resolve("/app", "dist", "public");
    
    console.log("Trying alternative paths:");
    console.log("Alt path 1:", altPath1, "exists:", fs.existsSync(altPath1));
    console.log("Alt path 2:", altPath2, "exists:", fs.existsSync(altPath2));
    
    if (fs.existsSync(altPath1)) {
      console.log("Using alternative path:", altPath1);
      app.use(express.static(altPath1));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(altPath1, "index.html"));
      });
      return;
    }
    
    if (fs.existsSync(altPath2)) {
      console.log("Using alternative path:", altPath2);
      app.use(express.static(altPath2));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(altPath2, "index.html"));
      });
      return;
    }
    
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { defaultRateLimiter } from "./middleware/rateLimiter";
import { GameOrchestrator } from "./agent/GameOrchestrator";
import { BattleResolver } from "./agent/battleResolver";
import EventEmitter from "events";
import CacheManager from "./agent/CacheManager";
import TwitterManager from "./agent/TwitterManager";
import { DecisionEngine } from "./agent/DecisionEngine";
import { checkDatabaseConnection } from "./utils";
import { getProgramWithWallet } from "./utils/program";
import { PrismaClient } from "@prisma/client";

import { GameManager } from "./agent/GameManager";
import { createServer } from "http";

import { expressCspHeader, NONE, SELF } from "express-csp-header";
import { ActionManager } from "./agent/actionManager";

const app = express();
const server = createServer(app);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        sandbox: ["allow-forms", "allow-scripts", "allow-same-origin"],
        reportUri: "/api/csp-report",
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
      reportOnly: false,
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);

// Additional CSP headers
app.use(
  expressCspHeader({
    directives: {
      "default-src": [SELF],
      "script-src": [SELF],
      "style-src": [SELF],
      "img-src": [SELF],
      "connect-src": [SELF],
      "font-src": [SELF],
      "object-src": [NONE],
      "media-src": [SELF],
      "frame-src": [NONE],
      sandbox: [
        "allow-forms",
        "allow-same-origin",
        "allow-popups-to-escape-sandbox",
        "allow-popups",
        "allow-modals",
        "allow-pointer-lock",
      ],
      "report-uri": "/api/csp-report",
      "base-uri": [SELF],
      "form-action": [SELF],
      "frame-ancestors": [NONE],
    },
  })
);

// SQL Injection Prevention Middleware
app.use((req, res, next) => {
  // Sanitize request body and parameters
  const sanitizeValue = (value: any): any => {
    if (typeof value === "string") {
      // Remove SQL injection patterns
      return value.replace(/['";\\]/g, "");
    }
    if (typeof value === "object" && value !== null) {
      return Object.keys(value).reduce(
        (acc: any, key) => {
          acc[key] = sanitizeValue(value[key]);
          return acc;
        },
        Array.isArray(value) ? [] : {}
      );
    }
    return value;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);

  next();
});

// CORS configuration - Strict
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Body parsing middleware with strict limits
app.use(
  express.json({
    limit: "10kb",
    verify: (req: express.Request, res: express.Response, buf: Buffer) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        res.status(400).json({ error: "Invalid JSON" });
        throw new Error("Invalid JSON");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Route-specific rate limiting
app.use(defaultRateLimiter);

// Security headers check middleware
app.use((req, res, next) => {
  // Set security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-Download-Options", "noopen");

  // Remove sensitive headers
  res.removeHeader("X-Powered-By");

  // Prevent clickjacking
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");

  next();
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route does not exist",
  });
});

// Global error handler with security in mind
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", {
      name: err.name,
      message: err.message,
    });

    // Don't expose error details in production
    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
);

export async function startServer() {
  await checkDatabaseConnection();

  const program = await getProgramWithWallet();
  const prisma = new PrismaClient();
  const gameManager = new GameManager(program, prisma);
  const gameInfo = await gameManager.getOrCreateActiveGame();
  if (!gameInfo) {
    console.error("No active game found");
    process.exit(1);
  }

  const eventEmitter = new EventEmitter();
  const engine = new DecisionEngine(prisma, eventEmitter, program);
  const twitter = new TwitterManager();

  const cache = new CacheManager();

  const battleResolver = new BattleResolver(program, prisma, gameManager);
  const actionManager = new ActionManager(program, prisma);

  const orchestrator = new GameOrchestrator(
    gameInfo.gameAccount.gameId,
    gameInfo.dbGame.id,
    actionManager,
    twitter,
    cache,
    engine,
    prisma,
    eventEmitter,
    battleResolver
  );

  try {
    await orchestrator.start();
  } catch (error) {
    console.error("Failed to start system", { error });
    process.exit(1);
  }

  try {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log({
        level: "INFO",
        message: `Server started on port ${PORT}`,
        type: "SYSTEM",
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.info("Shutting down server...");

      server.close(async () => {
        console.info("HTTP server closed");

        try {
          await prisma.$disconnect();
          console.info("Database connection closed");
          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10s
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();

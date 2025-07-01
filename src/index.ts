#!/usr/bin/env node

import { MCPServer } from "./server.js";
import { Logger } from "./utils/index.js";

const logger = Logger.getInstance();

// Set log level from environment variable
const logLevel =
  (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info";
logger.setLogLevel(logLevel);

const serverConfig = {
  name: "mcp-server-nodejs",
  version: "1.0.0",
  description: "A comprehensive MCP server implementation in Node.js",
};

async function main(): Promise<void> {
  // Check for port configuration
  const port = process.env.MCP_PORT
    ? parseInt(process.env.MCP_PORT)
    : process.argv.includes("--port")
    ? parseInt(process.argv[process.argv.indexOf("--port") + 1])
    : undefined;

  const server = new MCPServer(serverConfig, port);

  if (port) {
    logger.info(`Configured to run on HTTP port: ${port}`);
  } else {
    logger.info("Configured to run on stdio transport");
  }

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down gracefully...");
    await server.stop();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  try {
    await server.start();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});

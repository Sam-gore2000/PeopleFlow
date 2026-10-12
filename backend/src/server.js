import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { useMemoryModels } from "./data/memoryStore.js";
import { API_VERSION, mountedRoutes } from "./routes/index.js";
import { ensureInitialAccounts } from "./scripts/initialAccounts.js";

const app = createApp();

try {
  await connectDb();
  app.locals.dataMode = "mongo";
  await ensureInitialAccounts().catch((error) => console.error("Creating first-start accounts failed:", error.message));
} catch (error) {
  if (env.disableMemoryFallback) throw error;
  useMemoryModels();
  app.locals.dataMode = "memory";
  console.warn(`MongoDB unavailable (${error.message}). Starting in localhost memory mode.`);
  console.warn("Memory mode login: testuser / test123 (data is lost on restart)");
}

const server = app.listen(env.port, () => {
  console.log(`HRMS API ${API_VERSION} running on http://localhost:${env.port} (mode: ${app.locals.dataMode}, timezone: ${env.timezone})`);
  console.log(`Routes: ${mountedRoutes.join(", ")}`);
});

// If an old server still holds the port, it keeps answering with stale routes ("Route not found").
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\nPort ${env.port} is already in use - an older HRMS server is probably still running and answering requests.`);
    console.error("Stop it, then start this one again:");
    console.error(`  Windows:     netstat -ano | findstr :${env.port}   then   taskkill /PID <pid> /F`);
    console.error(`  macOS/Linux: lsof -i :${env.port}   then   kill <pid>\n`);
    process.exit(1);
  }
  throw error;
});

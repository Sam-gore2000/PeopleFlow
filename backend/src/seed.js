import { connectDb } from "./config/db.js";
import { seedData } from "./data/seedData.js";
import { models } from "./models/index.js";

try {
  await connectDb();
} catch (error) {
  console.warn(`MongoDB unavailable (${error.message}).`);
  console.warn("You can still run npm run dev and log in with memory mode: testuser / test123.");
  process.exit(0);
}

for (const [modelKey, { key, records }] of Object.entries(seedData)) {
  for (const record of records) {
    await models[modelKey].updateOne({ [key]: record[key] }, { $setOnInsert: record }, { upsert: true });
  }
}

console.log("Seed data ready. Login with testuser/test123, admin/admin123, EMP001/employee123, or MGR001/manager123.");
process.exit(0);

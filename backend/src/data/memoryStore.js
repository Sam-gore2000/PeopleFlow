import { models, mongooseModels, useModels } from "../models/index.js";
import { createMemoryModel } from "./memoryModel.js";
import { seedData } from "./seedData.js";

function schemaDefaults(mongooseModel) {
  const defaults = {};
  for (const [path, type] of Object.entries(mongooseModel.schema.paths)) {
    if (type.defaultValue !== undefined && typeof type.defaultValue !== "function") defaults[path] = type.defaultValue;
  }
  return defaults;
}

// Swaps every registered model for an in-memory one pre-filled with the seed data.
export function useMemoryModels() {
  const memoryModels = Object.fromEntries(
    Object.entries(mongooseModels).map(([key, mongooseModel]) => [
      key,
      createMemoryModel(mongooseModel.modelName, { records: seedData[key]?.records, defaults: schemaDefaults(mongooseModel) })
    ])
  );
  useModels(memoryModels);
  return models;
}

import mongoose from "mongoose";

// strict: false keeps the extra columns carried over from the legacy MySQL tables.
export const baseOptions = { strict: false, timestamps: true, versionKey: false };

// For legacy collections that have no fixed shape yet.
export function looseModel(name, collection) {
  return mongoose.model(name, new mongoose.Schema({}, baseOptions), collection);
}

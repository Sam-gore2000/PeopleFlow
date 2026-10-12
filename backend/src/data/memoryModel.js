// A small in-memory stand-in for a Mongoose model, used when MongoDB is not
// reachable. It implements only the subset of the Mongoose API the services use,
// so every service runs the same code (and the same access rules) in both modes.
// Data lives in process memory and is lost on restart.

let idCounter = 0;

// 24 hex chars, increasing like a MongoDB ObjectId so `_id` sorting keeps insertion order.
function newId() {
  idCounter += 1;
  return Date.now().toString(16).padStart(12, "0") + idCounter.toString(16).padStart(12, "0");
}

function toPlain(doc) {
  return structuredClone({ ...doc });
}

function getPath(doc, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), doc);
}

function isOperatorObject(value) {
  return value && typeof value === "object" && !(value instanceof Date) && !(value instanceof RegExp) && Object.keys(value).some((key) => key.startsWith("$"));
}

function equals(a, b) {
  if (a instanceof Date || b instanceof Date) return a != null && b != null && new Date(a).getTime() === new Date(b).getTime();
  if (a === b) return true;
  if (a == null || b == null || typeof a === "object" || typeof b === "object") return false;
  return String(a) === String(b);
}

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a instanceof Date || b instanceof Date) return new Date(a).getTime() - new Date(b).getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  const [x, y] = [String(a), String(b)];
  return x < y ? -1 : x > y ? 1 : 0;
}

function matchesOperator(value, op, arg, condition) {
  switch (op) {
    case "$exists": return (value !== undefined) === Boolean(arg);
    case "$eq": return equals(value, arg);
    case "$ne": return !equals(value, arg);
    case "$gt": return value != null && compare(value, arg) > 0;
    case "$gte": return value != null && compare(value, arg) >= 0;
    case "$lt": return value != null && compare(value, arg) < 0;
    case "$lte": return value != null && compare(value, arg) <= 0;
    case "$in": return arg.some((item) => equals(value, item));
    case "$nin": return !arg.some((item) => equals(value, item));
    case "$regex": return value != null && new RegExp(arg, condition.$options || "").test(String(value));
    case "$options": return true;
    default: throw new Error(`Memory store does not support query operator ${op}`);
  }
}

function matchesCondition(value, condition) {
  if (condition instanceof RegExp) return value != null && condition.test(String(value));
  if (isOperatorObject(condition)) return Object.entries(condition).every(([op, arg]) => matchesOperator(value, op, arg, condition));
  if (condition === null) return value == null;
  if (Array.isArray(value)) return value.some((item) => equals(item, condition));
  return equals(value, condition);
}

export function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === "$or") return condition.some((sub) => matches(doc, sub));
    if (key === "$and") return condition.every((sub) => matches(doc, sub));
    return matchesCondition(getPath(doc, key), condition);
  });
}

function sortDocs(docs, sort) {
  if (!sort) return docs;
  const keys = Object.entries(sort);
  return [...docs].sort((a, b) => {
    for (const [key, direction] of keys) {
      const result = compare(getPath(a, key), getPath(b, key));
      if (result !== 0) return Number(direction) < 0 ? -result : result;
    }
    return 0;
  });
}

// Chainable, awaitable query mirroring Mongoose's find()/findOne() API.
class MemoryQuery {
  constructor(run) {
    this.run = run;
    this.options = { sort: null, skip: 0, limit: 0, lean: false };
  }

  sort(sort) { this.options.sort = sort; return this; }
  skip(count) { this.options.skip = Number(count) || 0; return this; }
  limit(count) { this.options.limit = Number(count) || 0; return this; }
  lean() { this.options.lean = true; return this; }
  exec() { return Promise.resolve().then(() => this.run(this.options)); }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
}

function applyUpdate(doc, update = {}) {
  const hasOperators = Object.keys(update).some((key) => key.startsWith("$"));
  const set = hasOperators ? update.$set || {} : update;
  for (const [key, value] of Object.entries(set)) if (key !== "_id") doc[key] = value;
  for (const key of Object.keys(update.$unset || {})) delete doc[key];
  doc.updatedAt = new Date();
}

function equalityFields(filter) {
  return Object.fromEntries(Object.entries(filter).filter(([key, value]) => !key.startsWith("$") && !isOperatorObject(value)));
}

// `defaults` mirrors the Mongoose schema defaults (e.g. leave status 0).
export function createMemoryModel(name, { records = [], defaults = {} } = {}) {
  const docs = [];

  function hydrate(data) {
    const now = new Date();
    const doc = { ...structuredClone(defaults), _id: newId(), createdAt: now, updatedAt: now, ...structuredClone(data) };
    Object.defineProperties(doc, {
      save: { value: async function save() { this.updatedAt = new Date(); return this; } },
      toObject: { value: function toObject() { return toPlain(this); } }
    });
    return doc;
  }

  function query(filter, { single = false } = {}) {
    return new MemoryQuery(({ sort, skip, limit, lean }) => {
      let result = sortDocs(docs.filter((doc) => matches(doc, filter)), sort);
      if (skip) result = result.slice(skip);
      if (limit) result = result.slice(0, limit);
      if (single) result = result.slice(0, 1);
      const output = lean ? result.map(toPlain) : result;
      return single ? output[0] ?? null : output;
    });
  }

  function findOneAndUpdate(filter, update, options = {}) {
    return new MemoryQuery(({ lean }) => {
      const doc = docs.find((item) => matches(item, filter));
      if (!doc) return null;
      const before = toPlain(doc);
      applyUpdate(doc, update);
      if (!options.new) return before;
      return lean ? toPlain(doc) : doc;
    });
  }

  const model = {
    modelName: name,
    find: (filter = {}) => query(filter),
    findOne: (filter = {}) => query(filter, { single: true }),
    findById: (id) => query({ _id: String(id) }, { single: true }),
    findOneAndUpdate,
    findByIdAndUpdate: (id, update, options) => findOneAndUpdate({ _id: String(id) }, update, options),
    findOneAndDelete: (filter = {}) =>
      new MemoryQuery(() => {
        const index = docs.findIndex((doc) => matches(doc, filter));
        return index >= 0 ? docs.splice(index, 1)[0] : null;
      }),
    findByIdAndDelete: (id) => model.findOneAndDelete({ _id: String(id) }),
    async deleteMany(filter = {}) {
      const before = docs.length;
      for (let index = docs.length - 1; index >= 0; index -= 1) if (matches(docs[index], filter)) docs.splice(index, 1);
      return { acknowledged: true, deletedCount: before - docs.length };
    },
    async countDocuments(filter = {}) {
      return docs.filter((doc) => matches(doc, filter)).length;
    },
    async distinct(field, filter = {}) {
      return [...new Set(docs.filter((doc) => matches(doc, filter)).map((doc) => getPath(doc, field)).filter((value) => value !== undefined))];
    },
    async create(data) {
      if (Array.isArray(data)) return Promise.all(data.map((item) => model.create(item)));
      const doc = hydrate(data);
      docs.push(doc);
      return doc;
    },
    async updateOne(filter, update, options = {}) {
      const doc = docs.find((item) => matches(item, filter));
      if (doc) {
        applyUpdate(doc, update);
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
      }
      if (!options.upsert) return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
      const hasOperators = Object.keys(update).some((key) => key.startsWith("$"));
      await model.create({ ...equalityFields(filter), ...(hasOperators ? { ...update.$setOnInsert, ...update.$set } : update) });
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
    }
  };

  records.forEach((record) => docs.push(hydrate(record)));
  return model;
}

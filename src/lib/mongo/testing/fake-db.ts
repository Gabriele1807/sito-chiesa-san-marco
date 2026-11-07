/**
 * Database MongoDB in memoria, minimo, per i test: supporta solo le
 * operazioni usate dal calendario (filtri per uguaglianza e $in, $set,
 * $setOnInsert, upsert, indici unici).
 */

type Doc = Record<string, unknown>;
type Filter = Record<string, unknown>;

function matches(doc: Doc, filter: Filter): boolean {
  return Object.entries(filter).every(([key, cond]) => {
    const value = doc[key];
    if (cond && typeof cond === "object" && "$in" in (cond as object)) {
      return ((cond as { $in: unknown[] }).$in ?? []).includes(value);
    }
    return value === cond;
  });
}

export class FakeCollection {
  docs: Doc[] = [];
  private unique: string[][] = [];

  async createIndex(spec: Record<string, number>, options?: { unique?: boolean }) {
    if (options?.unique) this.unique.push(Object.keys(spec));
    return "ok";
  }

  private checkUnique(candidate: Doc, ignore?: Doc) {
    for (const fields of this.unique) {
      const clash = this.docs.find(
        (d) => d !== ignore && fields.every((f) => d[f] !== undefined && d[f] === candidate[f])
      );
      if (clash) throw Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    }
  }

  async findOne(filter: Filter) {
    const d = this.docs.find((x) => matches(x, filter));
    return d ? { ...d } : null;
  }

  find(filter: Filter = {}) {
    let result = this.docs.filter((x) => matches(x, filter)).map((d) => ({ ...d }));
    const cursor = {
      sort: (spec: Record<string, 1 | -1>) => {
        const keys = Object.entries(spec);
        result = result.sort((a, b) => {
          for (const [k, dir] of keys) {
            const av = a[k] as string | number;
            const bv = b[k] as string | number;
            if (av < bv) return -dir;
            if (av > bv) return dir;
          }
          return 0;
        });
        return cursor;
      },
      limit: (n: number) => {
        result = result.slice(0, n);
        return cursor;
      },
      toArray: async () => result,
    };
    return cursor;
  }

  async insertOne(doc: Doc) {
    const copy = { _id: `oid-${this.docs.length + 1}`, ...doc };
    this.checkUnique(copy);
    this.docs.push(copy);
    return { insertedId: copy._id };
  }

  async updateOne(
    filter: Filter,
    update: { $set?: Doc; $setOnInsert?: Doc },
    options?: { upsert?: boolean }
  ) {
    const existing = this.docs.find((x) => matches(x, filter));
    if (existing) {
      const next = { ...existing, ...(update.$set ?? {}) };
      this.checkUnique(next, existing);
      Object.assign(existing, update.$set ?? {});
      return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
    }
    if (!options?.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
    const plainFilter = Object.fromEntries(
      Object.entries(filter).filter(([, v]) => typeof v !== "object" || v === null)
    );
    await this.insertOne({
      ...plainFilter,
      ...(update.$setOnInsert ?? {}),
      ...(update.$set ?? {}),
    });
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
  }

  async findOneAndUpdate(filter: Filter, update: { $set?: Doc }) {
    const existing = this.docs.find((x) => matches(x, filter));
    if (!existing) return null;
    Object.assign(existing, update.$set ?? {});
    return { ...existing };
  }

  async deleteOne(filter: Filter) {
    const i = this.docs.findIndex((x) => matches(x, filter));
    if (i === -1) return { deletedCount: 0 };
    this.docs.splice(i, 1);
    return { deletedCount: 1 };
  }

  async countDocuments(filter: Filter = {}) {
    return this.docs.filter((x) => matches(x, filter)).length;
  }
}

export class FakeDb {
  collections = new Map<string, FakeCollection>();
  commands: unknown[] = [];

  collection(name: string): FakeCollection {
    let c = this.collections.get(name);
    if (!c) {
      c = new FakeCollection();
      this.collections.set(name, c);
    }
    return c;
  }

  listCollections() {
    return { toArray: async () => [...this.collections.keys()].map((name) => ({ name })) };
  }

  async command(cmd: unknown) {
    this.commands.push(cmd);
    return { ok: 1 };
  }

  async createCollection(name: string, options: unknown) {
    this.commands.push({ create: name, ...(options as object) });
    return this.collection(name);
  }
}

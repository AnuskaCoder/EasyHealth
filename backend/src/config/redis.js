// Redis Caching and Session Client with In-Memory Fallback
class CacheClient {
  constructor() {
    this.memoryStore = new Map();
    this.isRedisConnected = false;
  }

  async get(key) {
    if (this.memoryStore.has(key)) {
      const item = this.memoryStore.get(key);
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      return item.value;
    }
    return null;
  }

  async set(key, value, ttlSeconds = 3600) {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key) {
    return this.memoryStore.delete(key);
  }

  async flush() {
    this.memoryStore.clear();
  }
}

const cache = new CacheClient();

module.exports = cache;

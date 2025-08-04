// Cache proudly stolen by me :)

import { RedisClient } from 'bun';
import pino from 'pino';

const logger = pino();

/**
 * Storage engine configuration blueprint
 */
interface CacheStorageConfig {
  /** Primary storage endpoint */
  primaryEndpoint?: string;
  /** Entry lifespan in seconds */
  entryLifespan?: number;
  /** In-memory tier capacity limit */
  memoryTierLimit?: number;
  /** Primary storage connection parameters */
  connectionParams?: {
    connectionTimeout?: number;
    idleTimeout?: number;
    autoReconnect?: boolean;
    maxRetries?: number;
    enableOfflineQueue?: boolean;
    enableAutoPipelining?: boolean;
    tls?: boolean;
  };
}

/**
 * Memory tier data container
 */
interface InMemoryCacheEntry<T> {
  value: T;
  expiration?: number;
  lastAccessed: number;
}

/**
 * Performance metrics tracker
 */
interface CachePerformanceMetrics {
  successful: number;
  failed: number;
  writes: number;
  removals: number;
  currentSize: number;
  efficiency: number;
}

/**
 * Operation outcome wrapper
 */
interface CacheOperationResult<T> {
  completed: boolean;
  data?: T;
  message?: string;
}

/**
 * Traffic control response
 */
interface CacheTrafficControlResult {
  permitted: boolean;
  quota: number;
  windowReset: number;
  requestCount: number;
}

/**
 * User session container
 */
interface CacheUserSession<T = Record<string, unknown>> {
  userId?: string | number;
  data: T;
  createdAt: number;
  lastActive: number;
}

/**
 * Adaptive Dual-Tier Storage Engine
 * Dynamically balances between distributed and local storage layers
 */
export class CacheEngine {
  private primaryClient: RedisClient | null = null;
  private memoryCache = new Map<string, InMemoryCacheEntry<unknown>>();
  private metrics: CachePerformanceMetrics = {
    successful: 0,
    failed: 0,
    writes: 0,
    removals: 0,
    currentSize: 0,
    efficiency: 0
  };

  private readonly config: Required<CacheStorageConfig>;
  private primaryActive = false;
  private connectionReady = false;

  constructor(config: CacheStorageConfig = {}) {
    this.config = {
      primaryEndpoint: config.primaryEndpoint ?? process.env.REDIS_URL ?? '',
      entryLifespan: config.entryLifespan ?? 3600,
      memoryTierLimit: config.memoryTierLimit ?? 10000,
      connectionParams: config.connectionParams ?? {}
    };

    if (this.config.primaryEndpoint) {
      void this.establishPrimaryConnection();
    }
  }

  /**
   * Establish connection to primary storage tier
   */
  private async establishPrimaryConnection(): Promise<void> {
    if (this.connectionReady) return;
    this.connectionReady = true;

    try {
      this.primaryClient = new RedisClient(this.config.primaryEndpoint, this.config.connectionParams);

      // Verify connectivity
      await this.primaryClient.send('PING', []);
      this.primaryActive = true;

      // Connection event handlers
      this.primaryClient.onclose = (err): void => {
        logger.warn('Primary storage disconnected:', err);
        this.primaryActive = false;
      };

      this.primaryClient.onconnect = (): void => {
        logger.info('Primary storage connection active');
        this.primaryActive = true;
      };
    } catch (error) {
      logger.warn('Primary storage unavailable, using local tier only:', error);
      this.primaryActive = false;
      this.primaryClient = null;
    }
  }

  /**
   * Check current storage tier in use
   */
  get isPrimaryActive(): boolean {
    return this.primaryActive && this.primaryClient !== null;
  }

  /**
   * Retrieve performance metrics
   */
  getMetrics(): CachePerformanceMetrics {
    const totalOps = this.metrics.successful + this.metrics.failed;
    this.metrics.efficiency = totalOps > 0 ? this.metrics.successful / totalOps : 0;
    this.metrics.currentSize = this.isPrimaryActive ? -1 : this.memoryCache.size;
    return { ...this.metrics };
  }

  /**
   * Store data entry
   */
  async set<T>(key: string, value: T, lifespan?: number): Promise<boolean> {
    try {
      if (!this.connectionReady && this.config.primaryEndpoint) {
        await this.establishPrimaryConnection();
      }

      if (this.isPrimaryActive && this.primaryClient) {
        const encoded = JSON.stringify(value);
        await this.primaryClient.set(key, encoded);

        const ttl = lifespan ?? this.config.entryLifespan;
        if (ttl > 0) {
          await this.primaryClient.expire(key, ttl);
        }
      } else {
        // Local tier with capacity management
        if (this.memoryCache.size >= this.config.memoryTierLimit) {
          this.evict();
        }

        const expiration =
          lifespan !== undefined
            ? Date.now() + lifespan * 1000
            : this.config.entryLifespan > 0
              ? Date.now() + this.config.entryLifespan * 1000
              : undefined;

        this.memoryCache.set(key, {
          value,
          expiration,
          lastAccessed: Date.now()
        });
      }

      this.metrics.writes++;
      return true;
    } catch (error) {
      logger.error('Cache set operation failed:', error);
      return false;
    }
  }

  /**
   * Retrieve data entry
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.connectionReady && this.config.primaryEndpoint) {
        await this.establishPrimaryConnection();
      }

      if (this.isPrimaryActive && this.primaryClient) {
        const raw = await this.primaryClient.get(key);
        if (raw) {
          this.metrics.successful++;
          return JSON.parse(raw) as T;
        }
      } else {
        const entry = this.memoryCache.get(key);
        if (entry) {
          // Validate expiration
          if (entry.expiration && Date.now() > entry.expiration) {
            this.memoryCache.delete(key);
            this.metrics.failed++;
            return null;
          }

          // Update access tracking
          entry.lastAccessed = Date.now();
          this.metrics.successful++;
          return entry.value as T;
        }
      }

      this.metrics.failed++;
      return null;
    } catch (error) {
      logger.error('Cache get operation failed:', error);
      this.metrics.failed++;
      return null;
    }
  }

  /**
   * Verify entry existence
   */
  async has(key: string): Promise<boolean> {
    try {
      if (!this.connectionReady && this.config.primaryEndpoint) {
        await this.establishPrimaryConnection();
      }

      if (this.isPrimaryActive && this.primaryClient) {
        return await this.primaryClient.exists(key);
      } else {
        const entry = this.memoryCache.get(key);
        if (entry?.expiration && Date.now() > entry.expiration) {
          this.memoryCache.delete(key);
          return false;
        }
        return entry !== undefined;
      }
    } catch (error) {
      logger.error('Cache existence check failed:', error);
      return false;
    }
  }

  /**
   * Remove data entry
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.connectionReady && this.config.primaryEndpoint) {
        await this.establishPrimaryConnection();
      }

      if (this.isPrimaryActive && this.primaryClient) {
        const result = await this.primaryClient.del(key);
        this.metrics.removals++;
        return result > 0;
      } else {
        const wasPresent = this.memoryCache.delete(key);
        if (wasPresent) this.metrics.removals++;
        return wasPresent;
      }
    } catch (error) {
      logger.error('Cache delete operation failed:', error);
      return false;
    }
  }

  /**
   * Increment numeric counter
   */
  async increment(key: string, step = 1): Promise<number> {
    try {
      if (!this.connectionReady && this.config.primaryEndpoint) {
        await this.establishPrimaryConnection();
      }

      if (this.isPrimaryActive && this.primaryClient) {
        return step === 1
          ? await this.primaryClient.incr(key)
          : ((await this.primaryClient.send('INCRBY', [key, step.toString()])) as number);
      } else {
        const entry = this.memoryCache.get(key);
        let currentVal = 0;

        if (entry && (!entry.expiration || Date.now() <= entry.expiration)) {
          currentVal = typeof entry.value === 'number' ? entry.value : 0;
        }

        const updatedVal = currentVal + step;
        await this.set(key, updatedVal);
        return updatedVal;
      }
    } catch (error) {
      logger.error('Cache increment failed:', error);
      throw error;
    }
  }

  /**
   * Batch store operation
   */
  async setBatch<T>(data: Record<string, T>, lifespan?: number): Promise<boolean> {
    try {
      const operations = Object.entries(data).map(([key, value]) => this.set(key, value, lifespan));
      const outcomes = await Promise.all(operations);
      return outcomes.every((outcome) => outcome);
    } catch (error) {
      logger.error('Cache batch set failed:', error);
      return false;
    }
  }

  /**
   * Batch retrieve operation
   */
  async getBatch<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const operations = keys.map(async (key) => ({
        key,
        value: await this.get<T>(key)
      }));

      const outcomes = await Promise.all(operations);
      return outcomes.reduce(
        (result, { key, value }) => {
          result[key] = value;
          return result;
        },
        {} as Record<string, T | null>
      );
    } catch (error) {
      logger.error('Cache batch get failed:', error);
      return keys.reduce(
        (result, key) => {
          result[key] = null;
          return result;
        },
        {} as Record<string, T | null>
      );
    }
  }

  /**
   * Lazy loading pattern
   */
  async getOrSet<T>(key: string, generator: () => Promise<T> | T, lifespan?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await generator();
    await this.set(key, fresh, lifespan);
    return fresh;
  }

  /**
   * Traffic control mechanism
   */
  async rateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<CacheTrafficControlResult> {
    try {
      const timestamp = Date.now();
      const window = Math.floor(timestamp / (windowSeconds * 1000));
      const controlKey = `traffic:${key}:${window}`;

      const current = await this.increment(controlKey);

      if (current === 1) {
        await this.set(controlKey, current, windowSeconds);
      }

      const permitted = current <= maxRequests;
      const remaining = Math.max(0, maxRequests - current);
      const resetTime = (window + 1) * windowSeconds * 1000;

      return {
        permitted,
        quota: remaining,
        windowReset: resetTime,
        requestCount: current
      };
    } catch (error) {
      logger.error('Cache rate limit error:', error);
      return {
        permitted: true,
        quota: maxRequests - 1,
        windowReset: Date.now() + windowSeconds * 1000,
        requestCount: 1
      };
    }
  }

  /**
   * Initialize user session
   */
  async createSession<T = Record<string, unknown>>(
    sessionId: string,
    userId: string | number,
    sessionData: T,
    lifespan?: number
  ): Promise<boolean> {
    const session: CacheUserSession<T> = {
      userId,
      data: sessionData,
      createdAt: Date.now(),
      lastActive: Date.now()
    };

    return await this.set(`user_session:${sessionId}`, session, lifespan ?? 86400);
  }

  /**
   * Access user session
   */
  async getSession<T = Record<string, unknown>>(sessionId: string): Promise<CacheUserSession<T> | null> {
    const session = await this.get<CacheUserSession<T>>(`user_session:${sessionId}`);
    if (session) {
      session.lastActive = Date.now();
      await this.set(`user_session:${sessionId}`, session);
    }
    return session;
  }

  /**
   * Terminate user session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.delete(`user_session:${sessionId}`);
  }

  /**
   * Purge all stored data
   */
  async clear(): Promise<boolean> {
    try {
      if (this.isPrimaryActive && this.primaryClient) {
        await this.primaryClient.send('FLUSHDB', []);
      } else {
        this.memoryCache.clear();
      }

      this.metrics = {
        successful: 0,
        failed: 0,
        writes: 0,
        removals: 0,
        currentSize: 0,
        efficiency: 0
      };

      return true;
    } catch (error) {
      logger.error('Cache clear operation failed:', error);
      return false;
    }
  }

  /**
   * Get remaining lifespan for entry
   */
  async getTTL(key: string): Promise<number> {
    try {
      if (this.isPrimaryActive && this.primaryClient) {
        return await this.primaryClient.ttl(key);
      } else {
        const entry = this.memoryCache.get(key);
        if (!entry) return -2;
        if (!entry.expiration) return -1;

        const remaining = Math.max(0, entry.expiration - Date.now());
        return Math.floor(remaining / 1000);
      }
    } catch (error) {
      logger.error('Cache TTL check failed:', error);
      return -2;
    }
  }

  /**
   * Update entry lifespan
   */
  async setTTL(key: string, seconds: number): Promise<boolean> {
    try {
      if (this.isPrimaryActive && this.primaryClient) {
        await this.primaryClient.expire(key, seconds);
        return true;
      } else {
        const entry = this.memoryCache.get(key);
        if (entry) {
          entry.expiration = Date.now() + seconds * 1000;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Cache TTL update failed:', error);
      return false;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evict(): void {
    let candidateKey = '';
    let oldestAccess = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        candidateKey = key;
      }
    }

    if (candidateKey) {
      this.memoryCache.delete(candidateKey);
    }
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.primaryClient) {
      this.primaryClient.close();
      this.primaryClient = null;
    }
    this.memoryCache.clear();
    this.primaryActive = false;
  }

  /**
   * System health diagnostics
   */
  async diagnostics(): Promise<{
    primaryActive: boolean;
    memoryActive: boolean;
    metrics: CachePerformanceMetrics;
  }> {
    let primaryHealthy = false;

    if (this.primaryClient) {
      try {
        await this.primaryClient.send('PING', []);
        primaryHealthy = true;
      } catch {
        primaryHealthy = false;
      }
    }

    return {
      primaryActive: primaryHealthy,
      memoryActive: true,
      metrics: this.getMetrics()
    };
  }
}

// Export interfaces for external consumption
export type {
  CacheStorageConfig,
  CacheOperationResult,
  CachePerformanceMetrics,
  CacheTrafficControlResult,
  CacheUserSession
};

// Factory function for engine creation
export function createCacheEngine(config?: CacheStorageConfig): CacheEngine {
  return new CacheEngine(config);
}

// Service wrapper implementations
export class CacheService {
  private engine: CacheEngine;

  constructor(config?: CacheStorageConfig) {
    this.engine = new CacheEngine(config);
  }

  /**
   * JSON-aware storage wrapper
   */
  async setJson<T>(key: string, value: T, lifespan?: number): Promise<boolean> {
    return this.engine.set(key, value, lifespan);
  }

  /**
   * Memoization decorator
   */
  memoize<TParams extends unknown[], TResult>(
    // eslint-disable-next-line no-unused-vars
    fn: (...params: TParams) => Promise<TResult>,
    // eslint-disable-next-line no-unused-vars
    keyBuilder: (...params: TParams) => string,
    lifespan?: number
  ) {
    return async (...params: TParams): Promise<TResult> => {
      const cacheKey = keyBuilder(...params);
      return this.engine.getOrSet(cacheKey, () => fn(...params), lifespan);
    };
  }

  /**
   * Distributed mutex implementation
   */
  async acquireLock(lockKey: string, duration: number = 30, timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    const lockToken = Math.random().toString(36);

    while (Date.now() - startTime < timeout) {
      const existing = await this.engine.get(lockKey);
      if (!existing) {
        const acquired = await this.engine.set(lockKey, lockToken, duration);
        if (acquired) return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    return false;
  }

  /**
   * Release distributed mutex
   */
  async releaseLock(lockKey: string): Promise<boolean> {
    return this.engine.delete(lockKey);
  }

  /**
   * Access underlying engine
   */
  getEngine(): CacheEngine {
    return this.engine;
  }
}

export const cacheService = new CacheService();
export const cacheEngine = new CacheEngine();

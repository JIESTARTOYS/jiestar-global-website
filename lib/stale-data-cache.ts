export type StaleDataCacheSource = "fresh" | "loaded" | "stale";

export type StaleDataCacheResult<T> = {
  value: T;
  source: StaleDataCacheSource;
  error?: unknown;
};

type CacheEntry<T> = {
  value: T;
  updatedAt: number;
};

export class StaleDataCache<T> {
  private entry: CacheEntry<T> | undefined;
  private inFlight: Promise<StaleDataCacheResult<T>> | undefined;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(ttlMs: number, now: () => number = Date.now) {
    this.ttlMs = ttlMs;
    this.now = now;
  }

  peek() {
    return this.entry?.value;
  }

  async get(loader: () => Promise<T>): Promise<StaleDataCacheResult<T>> {
    if (this.entry && this.now() - this.entry.updatedAt < this.ttlMs) {
      return { value: this.entry.value, source: "fresh" };
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = loader()
      .then((value) => {
        this.entry = {
          value,
          updatedAt: this.now(),
        };

        return { value, source: "loaded" as const };
      })
      .catch((error: unknown) => {
        if (this.entry) {
          return {
            value: this.entry.value,
            source: "stale" as const,
            error,
          };
        }

        throw error;
      })
      .finally(() => {
        this.inFlight = undefined;
      });

    return this.inFlight;
  }
}

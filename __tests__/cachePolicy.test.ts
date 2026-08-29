import { CachePolicy } from '../src/core/database/cachePolicy';
import { sqlite } from '../src/core/database/sqlite';

jest.mock('../src/core/database/sqlite', () => ({
  sqlite: {
    executeSql: jest.fn(),
  },
}));

describe('CachePolicy Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should treat missing cache key as expired', async () => {
    (sqlite.executeSql as jest.Mock).mockResolvedValue({
      rows: { length: 0, _array: [], item: () => null },
    });

    const isExpired = await CachePolicy.isCacheExpired('test_key', 3600000);
    expect(isExpired).toBe(true);
  });

  it('should identify expired cache correctly', async () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    (sqlite.executeSql as jest.Mock).mockResolvedValue({
      rows: {
        length: 1,
        _array: [{ lastFetchedAt: twoHoursAgo }],
        item: () => ({ lastFetchedAt: twoHoursAgo }),
      },
    });

    const isExpired = await CachePolicy.isCacheExpired('test_key', 3600000);
    expect(isExpired).toBe(true);
  });

  it('should identify fresh cache correctly', async () => {
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    (sqlite.executeSql as jest.Mock).mockResolvedValue({
      rows: {
        length: 1,
        _array: [{ lastFetchedAt: thirtyMinsAgo }],
        item: () => ({ lastFetchedAt: thirtyMinsAgo }),
      },
    });

    const isExpired = await CachePolicy.isCacheExpired('test_key', 3600000);
    expect(isExpired).toBe(false);
  });

  it('should always expire cache when duration limit is 0', async () => {
    const now = Date.now();
    (sqlite.executeSql as jest.Mock).mockResolvedValue({
      rows: {
        length: 1,
        _array: [{ lastFetchedAt: now }],
        item: () => ({ lastFetchedAt: now }),
      },
    });

    const isExpired = await CachePolicy.isCacheExpired('health_records_list', 0);
    expect(isExpired).toBe(true);
  });
});


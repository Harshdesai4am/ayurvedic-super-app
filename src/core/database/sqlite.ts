import { Storage } from '../storage/storage';
import { Logger } from '../logger/logger';

export interface DBResult {
  rows: {
    _array: any[];
    length: number;
    item: (idx: number) => any;
  };
  rowsAffected: number;
  insertId?: number;
}

export interface SQLiteTransaction {
  executeSql: (
    sqlStatement: string,
    argumentsOrParams?: any[],
    successCallback?: (tx: SQLiteTransaction, result: DBResult) => void,
    errorCallback?: (tx: SQLiteTransaction, error: any) => boolean
  ) => void;
}

class SQLiteDatabaseSimulator {
  private cache: Record<string, any[]> = {};
  private dirtyTables: Set<string> = new Set();
  private pendingCount = 0;
  private inTransaction = false;

  private getTableData(tableName: string): any[] {
    if (!this.cache[tableName]) {
      const data = Storage.getObject<any[]>(`sqlite_table_${tableName}`);
      this.cache[tableName] = data || [];
    }
    return this.cache[tableName];
  }

  private saveTableData(tableName: string, data: any[]): void {
    this.cache[tableName] = data;
    this.dirtyTables.add(tableName);
    this.persistIfNeeded();
  }

  private persistIfNeeded(): void {
    if (this.pendingCount === 0 && !this.inTransaction) {
      this.dirtyTables.forEach((tableName) => {
        Storage.setObject(`sqlite_table_${tableName}`, this.cache[tableName]);
      });
      this.dirtyTables.clear();
    }
  }

  public async executeSql(sql: string, params: any[] = []): Promise<DBResult> {
    this.pendingCount++;
    const cleanSql = sql.trim().replace(/\s+/g, ' ');
    Logger.info(`[SQLite Simulation] Executing: ${cleanSql} | Params: ${JSON.stringify(params)}`);

    try {
      // 1. CREATE TABLE
      if (cleanSql.toUpperCase().startsWith('CREATE TABLE')) {
        const match = cleanSql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
        if (match) {
          const tableName = match[1];
          if (!Storage.getObject(`sqlite_table_${tableName}`)) {
            this.saveTableData(tableName, []);
          }
        }
        return { rows: { _array: [], length: 0, item: () => null }, rowsAffected: 0 };
      }

      // 2. INSERT INTO
      if (cleanSql.toUpperCase().startsWith('INSERT INTO')) {
        const match = cleanSql.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
        let tableName = '';
        let columns: string[] = [];

        if (match) {
          tableName = match[1];
          columns = match[2].split(',').map((c) => c.trim());
        } else {
          const altMatch = cleanSql.match(/INSERT INTO\s+(\w+)\s+VALUES/i);
          if (altMatch) {
            tableName = altMatch[1];
          }
        }

        if (!tableName) throw new Error('Could not parse INSERT statement');

        const data = this.getTableData(tableName);
        const newRecord: any = {};

        if (columns.length > 0) {
          columns.forEach((col, idx) => {
            let val = params[idx];
            if (val === undefined) {
              val = null;
            }
            newRecord[col] = val;
          });
        } else {
          params.forEach((val, idx) => {
            newRecord[`col_${idx}`] = val;
          });
        }

        if (!newRecord.id && !newRecord.productId) {
          newRecord.id = `sqlite_row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
        const insertId = newRecord.id || Date.now();

        data.push(newRecord);
        this.saveTableData(tableName, data);

        return {
          rows: { _array: [newRecord], length: 1, item: () => newRecord },
          rowsAffected: 1,
          insertId: typeof insertId === 'number' ? insertId : Date.now(),
        };
      }

      // 3. SELECT
      if (cleanSql.toUpperCase().startsWith('SELECT')) {
        const fromMatch = cleanSql.match(/FROM\s+(\w+)/i);
        if (!fromMatch) throw new Error('Could not parse SELECT statement table');
        const tableName = fromMatch[1];
        let result = this.getTableData(tableName);

        // Simple mock filtering
        const whereMatch = cleanSql.match(/WHERE\s+([\w.]+)\s*=\s*\?/i);
        if (whereMatch && params.length > 0) {
          const colName = whereMatch[1];
          result = result.filter((item) => String(item[colName]) === String(params[0]));
        }

        const orderMatch = cleanSql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
        if (orderMatch) {
          const col = orderMatch[1];
          const dir = orderMatch[2].toUpperCase();
          result.sort((a, b) => {
            const valA = a[col];
            const valB = b[col];
            if (valA < valB) return dir === 'ASC' ? -1 : 1;
            if (valA > valB) return dir === 'ASC' ? 1 : -1;
            return 0;
          });
        }

        return {
          rows: {
            _array: result,
            length: result.length,
            item: (idx: number) => result[idx],
          },
          rowsAffected: 0,
        };
      }

      // 4. UPDATE
      if (cleanSql.toUpperCase().startsWith('UPDATE')) {
        const updateMatch = cleanSql.match(/UPDATE\s+(\w+)/i);
        if (!updateMatch) throw new Error('Could not parse UPDATE table');
        const tableName = updateMatch[1];
        const data = this.getTableData(tableName);

        const setMatch = cleanSql.match(/SET\s+(.+?)(?:\s+WHERE\s+|$)/i);
        const whereMatch = cleanSql.match(/WHERE\s+(.+)$/i);

        if (!setMatch) throw new Error('Could not parse UPDATE SET clause');

        // Parse SET clauses
        const setParts = setMatch[1].split(',');
        const updates: { col: string; val: any; isPlaceholder: boolean }[] = [];
        let paramIdx = 0;

        setParts.forEach((part) => {
          const eqIdx = part.indexOf('=');
          if (eqIdx === -1) return;
          const col = part.substring(0, eqIdx).trim();
          const valExpr = part.substring(eqIdx + 1).trim();

          if (valExpr === '?') {
            updates.push({ col, val: params[paramIdx++], isPlaceholder: true });
          } else {
            // Parse literal value
            let val: any = valExpr;
            if (valExpr.startsWith("'") && valExpr.endsWith("'")) {
              val = valExpr.slice(1, -1);
            } else if (!isNaN(Number(valExpr))) {
              val = Number(valExpr);
            } else if (valExpr.toUpperCase() === 'NULL') {
              val = null;
            }
            updates.push({ col, val, isPlaceholder: false });
          }
        });

        // Parse WHERE clause
        let whereCol = '';
        let whereVal: any = null;
        if (whereMatch) {
          const whereParts = whereMatch[1].split('=');
          if (whereParts.length === 2) {
            whereCol = whereParts[0].trim();
            const whereExpr = whereParts[1].trim();
            if (whereExpr === '?') {
              whereVal = params[paramIdx++];
            } else {
              if (whereExpr.startsWith("'") && whereExpr.endsWith("'")) {
                whereVal = whereExpr.slice(1, -1);
              } else if (!isNaN(Number(whereExpr))) {
                whereVal = Number(whereExpr);
              } else if (whereExpr.toUpperCase() === 'NULL') {
                whereVal = null;
              }
            }
          }
        }

        let rowsAffected = 0;
        data.forEach((item) => {
          let matches = true;
          if (whereCol) {
            matches = String(item[whereCol]) === String(whereVal);
          }
          if (matches) {
            updates.forEach(({ col, val }) => {
              item[col] = val;
            });
            rowsAffected++;
          }
        });

        if (rowsAffected > 0) {
          this.saveTableData(tableName, data);
        }

        return { rows: { _array: [], length: 0, item: () => null }, rowsAffected };
      }

      // 5. DELETE
      if (cleanSql.toUpperCase().startsWith('DELETE')) {
        const deleteMatch = cleanSql.match(/DELETE\s+FROM\s+(\w+)/i);
        if (!deleteMatch) throw new Error('Could not parse DELETE statement');
        const tableName = deleteMatch[1];
        let data = this.getTableData(tableName);
        const initialLen = data.length;

        const whereMatch = cleanSql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
        if (whereMatch && params.length > 0) {
          const colName = whereMatch[1];
          data = data.filter((item) => String(item[colName]) !== String(params[0]));
        } else {
          data = [];
        }

        this.saveTableData(tableName, data);
        return {
          rows: { _array: [], length: 0, item: () => null },
          rowsAffected: initialLen - data.length,
        };
      }

      throw new Error(`Unsupported SQL command in simulation: ${cleanSql}`);
    } catch (error) {
      Logger.error(`[SQLite Simulation] Error executing SQL statement: ${sql}`, error);
      throw error;
    } finally {
      this.pendingCount--;
        this.persistIfNeeded();
    }
  }

  public async transaction(callback: (tx: SQLiteTransaction) => void): Promise<void> {
    this.inTransaction = true;
    const promises: Promise<any>[] = [];
    const tx: SQLiteTransaction = {
      executeSql: (sql, args = [], successCb, errorCb) => {
        const promise = this.executeSql(sql, args)
          .then((res) => {
            if (successCb) successCb(tx, res);
            return res;
          })
          .catch((err) => {
            if (errorCb) {
              errorCb(tx, err);
            } else {
              Logger.error('[SQLite Transaction] Error during execution', err);
            }
            throw err;
          });
        promises.push(promise);
      },
    };

    try {
      callback(tx);
      await Promise.all(promises);
    } catch (e) {
      Logger.error('[SQLite Transaction] Error inside transaction block', e);
      throw e;
    } finally {
      this.inTransaction = false;
      this.persistIfNeeded();
    }
  }
}

export const sqlite = new SQLiteDatabaseSimulator();

export const initDb = async () => {
  Logger.info('[SQLite] Initializing Database Tables...');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS cache_metadata (cacheKey TEXT PRIMARY KEY, lastFetchedAt INTEGER, expiresAt INTEGER)');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS doctors (id TEXT PRIMARY KEY, name TEXT, avatar TEXT, specialty TEXT, qualification TEXT, experienceYears INTEGER, rating REAL, reviewCount INTEGER, consultationFee REAL, bio TEXT, availableDays TEXT, gender TEXT, language TEXT, verified INTEGER, onlineConsultation INTEGER, updatedAt INTEGER, isDeleted INTEGER DEFAULT 0)');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, doctorId TEXT, doctorName TEXT, doctorSpecialty TEXT, doctorAvatar TEXT, date TEXT, time TEXT, period TEXT, patientName TEXT, createdAt INTEGER, status TEXT, isOfflineQueued INTEGER)');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, subtitle TEXT, description TEXT, price REAL, originalPrice REAL, rating REAL, reviewCount INTEGER, category TEXT, image TEXT, inStock INTEGER, ingredients TEXT, doshaBenefit TEXT, brand TEXT, stockCount INTEGER, updatedAt INTEGER, isDeleted INTEGER DEFAULT 0)');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS cart (productId TEXT PRIMARY KEY, quantity INTEGER, productJson TEXT)');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS wishlist (productId TEXT PRIMARY KEY)');
  await sqlite.executeSql('CREATE TABLE IF NOT EXISTS health_records (id TEXT PRIMARY KEY, title TEXT, category TEXT, doctorName TEXT, facilityName TEXT, date TEXT, notes TEXT, vitals TEXT, createdAt INTEGER, tags TEXT, updatedAt INTEGER, isDeleted INTEGER DEFAULT 0)');
  Logger.info('[SQLite] Database Initialization Complete.');
};


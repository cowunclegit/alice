import sqlite3 from 'sqlite3';

export class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) return reject(err);
        this.db.serialize(() => {
          this.db.run(`
            CREATE TABLE IF NOT EXISTS RobotSession (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              uuid TEXT UNIQUE,
              title TEXT,
              description TEXT,
              plan TEXT,
              plan_status TEXT,
              execution_status TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);
          this.db.run(`
            CREATE TABLE IF NOT EXISTS ExecutionTrace (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              session_uuid TEXT,
              attempt INTEGER,
              code TEXT,
              analysis TEXT,
              fix_proposal TEXT,
              result TEXT,
              screenshots TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(session_uuid) REFERENCES RobotSession(uuid)
            )
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  }

  async createSession(session) {
    const { uuid, title, description, plan, plan_status } = session;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO RobotSession (uuid, title, description, plan, plan_status) VALUES (?, ?, ?, ?, ?)',
        [uuid, title, description, plan, plan_status],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getSession(uuid) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM RobotSession WHERE uuid = ?', [uuid], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async updateSessionStatus(uuid, status) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE RobotSession SET plan_status = ? WHERE uuid = ?', [status, uuid], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async addTrace(trace) {
    const { session_uuid, attempt, code, analysis, fix_proposal, result, screenshots } = trace;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO ExecutionTrace (session_uuid, attempt, code, analysis, fix_proposal, result, screenshots) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [session_uuid, attempt, code, analysis, fix_proposal, result, screenshots],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getTraces(session_uuid) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM ExecutionTrace WHERE session_uuid = ? ORDER BY attempt ASC', [session_uuid], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

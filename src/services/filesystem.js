import fs from 'fs';
import path from 'path';

export class FilesystemService {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.resultsDir = path.join(this.baseDir, 'results');
    this.ensureDirs();
  }

  ensureDirs() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  saveScript(uuid, content) {
    const filePath = path.join(this.baseDir, `${uuid}.robot`);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  getScript(uuid) {
    const filePath = path.join(this.baseDir, `${uuid}.robot`);
    return fs.readFileSync(filePath, 'utf8');
  }

  readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  initLog() {
    const logPath = path.join(this.baseDir, 'agent_debug.log');
    const startMsg = `--- Agent Debug Log Started at ${new Date().toLocaleString()} ---\n`;
    fs.writeFileSync(logPath, startMsg, { encoding: 'utf8', flag: 'w' });
  }

  log(message) {
    const logPath = path.join(this.baseDir, 'agent_debug.log');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const msg = typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message);
    // Use appendFileSync with 'as' flag to ensure it's written immediately
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`, { encoding: 'utf8' });
  }

  saveResult(uuid, name, content) {
    const sessionResultDir = path.join(this.resultsDir, uuid);
    if (!fs.existsSync(sessionResultDir)) {
      fs.mkdirSync(sessionResultDir, { recursive: true });
    }
    const filePath = path.join(sessionResultDir, name);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  cleanupOldFiles(days) {
    const now = new Date().getTime();
    const threshold = days * 24 * 60 * 60 * 1000;

    const walk = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          walk(filePath);
          // If directory is now empty after walk, maybe delete it too?
          if (fs.readdirSync(filePath).length === 0) {
            fs.rmdirSync(filePath);
          }
        } else {
          if (now - stats.mtimeMs > threshold) {
            fs.unlinkSync(filePath);
          }
        }
      });
    };

    walk(this.baseDir);
  }
}

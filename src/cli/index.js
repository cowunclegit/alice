import 'dotenv/config';
import { createGraph } from '../agents/graph.js';
import { GeminiChatModel } from '../services/llm.js';
import { DatabaseService } from '../services/database.js';
import { FilesystemService } from '../services/filesystem.js';
import { RobotRunner } from '../services/runner.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs_node from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  const args = process.argv.slice(2);
  let requirement = '';
  let html_content = null;
  let analysis_goal = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--html' && args[i + 1]) {
      const htmlPath = args[i + 1];
      if (fs_node.existsSync(htmlPath)) {
        html_content = fs_node.readFileSync(htmlPath, 'utf8');
      }
      i++;
    } else if (args[i] === '--goal' && args[i + 1]) {
      analysis_goal = args[i + 1];
      i++;
    } else if (!requirement) {
      requirement = args[i];
    }
  }

  if (!requirement) {
    console.error('Usage: node src/cli/index.js "Requirement" [--html path/to/file.html] [--goal "Element to find"]');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment.');
    process.exit(1);
  }

  const llm = new GeminiChatModel({ apiKey });
  const db = new DatabaseService('./robots.db');
  const fs = new FilesystemService('./robots');
  const runner = new RobotRunner();

  // --- FORCE INITIALIZE LOGGING ---
  const logDir = path.resolve('./robots');
  if (!fs_node.existsSync(logDir)) fs_node.mkdirSync(logDir, { recursive: true });
  const logFilePath = path.join(logDir, 'agent_debug.log');
  
  // Reset log file at start
  fs_node.writeFileSync(logFilePath, `--- Agent Debug Log Started at ${new Date().toLocaleString()} ---\n`, 'utf8');

  const originalLog = console.log;
  const originalError = console.error;

  originalLog(`\n[System] 📝 Debug logs are being recorded to: ${logFilePath}\n`);

  console.log = (...args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    originalLog(...args);
    fs_node.appendFileSync(logFilePath, `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ${msg}\n`, 'utf8');
  };

  console.error = (...args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    originalError(...args);
    fs_node.appendFileSync(logFilePath, `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}] ERROR: ${msg}\n`, 'utf8');
  };
  // ---------------------------------

  // Run cleanup
  fs.cleanupOldFiles(30);

  await db.init();

  const graph = createGraph({ llm, db, fs, runner });

  const uuid = uuidv4();
  console.log(`Starting agent for: "${requirement}" (ID: ${uuid})`);

  let currentState = {
    requirement,
    html_content,
    analysis_goal,
    uuid,
    retryCount: 0,
    history: []
  };

  let keepGoing = true;
  let totalRetriesAcrossSessions = 0;

  try {
    while (keepGoing) {
      const result = await graph.invoke(currentState);
      totalRetriesAcrossSessions += result.retryCount;

      console.log('\n=======================================');
      console.log('--- AGENT EXECUTION SUMMARY ---');
      console.log(`Title: ${result.title}`);
      console.log(`Session Retries: ${result.retryCount}`);
      console.log(`Cumulative Retries: ${totalRetriesAcrossSessions}`);
      
      if (result.isSuccess) {
        console.log('STATUS: SUCCESS (Intent Met)');
        keepGoing = false;
      } else if (result.retryCount >= 10) {
        console.log('STATUS: PAUSED (Max Retries Reached)');
        const answer = await askQuestion('\nMax retries reached. Do you want to try another 10 times? (y/n): ');
        if (answer.toLowerCase() === 'y') {
          console.log('Continuing for another 10 retries...\n');
          // Update state for next 10 retries
          currentState = {
            ...result,
            retryCount: 0 // Reset retry count for the next graph session
          };
        } else {
          console.log('Stopping execution.');
          keepGoing = false;
        }
      } else {
        console.log('STATUS: FINISHED');
        keepGoing = false;
      }
      console.log('=======================================\n');
    }
  } catch (error) {
    console.error('Error during agent execution:', error);
  } finally {
    await db.close();
    rl.close();
  }
}

main();

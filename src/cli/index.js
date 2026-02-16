import 'dotenv/config';
import { createGraph } from '../agents/graph.js';
import { GeminiChatModel } from '../services/llm.js';
import { DatabaseService } from '../services/database.js';
import { FilesystemService } from '../services/filesystem.js';
import { RobotRunner } from '../services/runner.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs_node from 'fs';

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

  // Run cleanup
  fs.cleanupOldFiles(30);

  await db.init();

  const graph = createGraph({ llm, db, fs, runner });

  const uuid = uuidv4();
  console.log(`Starting agent for: "${requirement}" (ID: ${uuid})`);

  try {
    const result = await graph.invoke({
      requirement,
      html_content,
      analysis_goal,
      uuid,
      retryCount: 0,
      history: []
    });

    console.log('\n=======================================');
    console.log('--- AGENT EXECUTION SUMMARY ---');
    console.log(`Title: ${result.title}`);
    console.log(`Total Retries: ${result.retryCount}`);
    
    if (result.isSuccess) {
      console.log('STATUS: SUCCESS (Intent Met)');
    } else if (result.retryCount >= 5) {
      console.log('STATUS: FAILED (Max Retries Reached)');
    } else {
      console.log('STATUS: FINISHED');
    }
    console.log('=======================================\n');
  } catch (error) {
    console.error('Error during agent execution:', error);
  } finally {
    await db.close();
  }
}

main();

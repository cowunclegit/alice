import { jest } from '@jest/globals';
import sqlite3 from 'sqlite3';
import { DatabaseService } from '../../../src/services/database.js';
import fs from 'fs';
import path from 'path';

describe('DatabaseService', () => {
  const dbPath = './test_robots.db';
  let dbService;

  beforeEach(async () => {
    dbService = new DatabaseService(dbPath);
    await dbService.init();
  });

  afterEach(async () => {
    await dbService.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  test('should create tables on init', async () => {
    const tables = await new Promise((resolve, reject) => {
      dbService.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        resolve(rows.map(r => r.name));
      });
    });
    expect(tables).toContain('RobotSession');
    expect(tables).toContain('ExecutionTrace');
  });

  test('should insert and retrieve a robot session', async () => {
    const session = {
      uuid: 'test-uuid',
      title: 'Test Title',
      description: 'Test Description',
      plan: JSON.stringify([{ step: 'test' }]),
      plan_status: 'Draft'
    };
    await dbService.createSession(session);
    const retrieved = await dbService.getSession(session.uuid);
    expect(retrieved.title).toBe(session.title);
    expect(retrieved.plan_status).toBe('Draft');
  });

  test('should update session status', async () => {
    const uuid = 'test-uuid';
    await dbService.createSession({ uuid, title: 'T', description: 'D', plan: '[]', plan_status: 'Draft' });
    await dbService.updateSessionStatus(uuid, 'Approved');
    const retrieved = await dbService.getSession(uuid);
    expect(retrieved.plan_status).toBe('Approved');
  });

  test('should insert and retrieve execution trace', async () => {
    const trace = {
      session_uuid: 'test-uuid',
      attempt: 1,
      code: '*** Test Cases ***',
      analysis: 'Initial attempt',
      fix_proposal: null,
      result: 'Pending',
      screenshots: '[]'
    };
    await dbService.addTrace(trace);
    const traces = await dbService.getTraces(trace.session_uuid);
    expect(traces).toHaveLength(1);
    expect(traces[0].code).toBe(trace.code);
  });
});

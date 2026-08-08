import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface GameResultRecord {
  sessionId: string;
  levelId: string;
  attempts: number;
  completed: boolean;
  durationMs: number;
}

export interface FeedbackRecord {
  sessionId: string;
  role: string;
  rating: number;
  tags: string[];
  comment: string;
}

export interface AssistantEventRecord {
  sessionId: string;
  audience: string;
  mode: string;
  category: string;
  durationMs: number;
  safetyFlag: boolean;
}

export class TuobaoDatabase {
  readonly db: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        attempts INTEGER NOT NULL,
        completed INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        rating INTEGER NOT NULL,
        tags TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assistant_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        audience TEXT NOT NULL,
        mode TEXT NOT NULL,
        category TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        safety_flag INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  insertGameResult(record: GameResultRecord): void {
    this.db
      .prepare(
        `INSERT INTO game_results
          (session_id, level_id, attempts, completed, duration_ms)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        record.sessionId,
        record.levelId,
        record.attempts,
        record.completed ? 1 : 0,
        record.durationMs,
      );
  }

  insertFeedback(record: FeedbackRecord): void {
    this.db
      .prepare(
        `INSERT INTO feedback (session_id, role, rating, tags, comment)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        record.sessionId,
        record.role,
        record.rating,
        JSON.stringify(record.tags),
        record.comment,
      );
  }

  insertAssistantEvent(record: AssistantEventRecord): void {
    this.db
      .prepare(
        `INSERT INTO assistant_events
          (session_id, audience, mode, category, duration_ms, safety_flag)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.sessionId,
        record.audience,
        record.mode,
        record.category,
        record.durationMs,
        record.safetyFlag ? 1 : 0,
      );
  }

  feedbackCsv(): string {
    const rows = this.db
      .prepare(
        `SELECT id, session_id, role, rating, tags, comment, created_at
         FROM feedback ORDER BY id ASC`,
      )
      .all() as Array<Record<string, unknown>>;
    const columns = [
      'id',
      'session_id',
      'role',
      'rating',
      'tags',
      'comment',
      'created_at',
    ];
    const escape = (value: unknown): string => {
      const text = String(value ?? '');
      return `"${text.replaceAll('"', '""')}"`;
    };
    return [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => escape(row[column])).join(',')),
    ].join('\r\n');
  }

  close(): void {
    this.db.close();
  }
}

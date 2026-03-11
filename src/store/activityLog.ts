import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'activity.json');

export type LogAction =
  | 'reward_created'
  | 'reward_updated'
  | 'reward_deleted'
  | 'reward_claimed'
  | 'config_reloaded';

export interface LogEntry {
  time: string; // ISO
  action: LogAction;
  rewardId?: string;
  label?: string;
  userId?: string;
  username?: string;
  details?: string;
}

const MAX_ENTRIES = 500;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLogs(): LogEntry[] {
  ensureDataDir();
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLogs(entries: LogEntry[]): void {
  ensureDataDir();
  const trimmed = entries.slice(-MAX_ENTRIES);
  fs.writeFileSync(LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
}

function append(entry: Omit<LogEntry, 'time'>): void {
  const logs = loadLogs();
  logs.push({
    ...entry,
    time: new Date().toISOString(),
  });
  saveLogs(logs);
}

export function logRewardCreated(rewardId: string, label: string): void {
  append({ action: 'reward_created', rewardId, label });
}

export function logRewardUpdated(rewardId: string, label?: string): void {
  append({ action: 'reward_updated', rewardId, label });
}

export function logRewardDeleted(rewardId: string, label?: string): void {
  append({ action: 'reward_deleted', rewardId, label });
}

export function logRewardClaimed(
  rewardId: string,
  label: string,
  userId: string,
  username?: string
): void {
  append({ action: 'reward_claimed', rewardId, label, userId, username });
}

export function logConfigReloaded(): void {
  append({ action: 'config_reloaded', details: 'Admin reloaded config from disk' });
}

export function getRecentLogs(limit: number = 200): LogEntry[] {
  const logs = loadLogs();
  return logs.slice(-limit).reverse();
}

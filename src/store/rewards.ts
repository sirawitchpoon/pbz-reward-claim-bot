import * as fs from 'fs';
import * as path from 'path';
import type { Reward, ClaimedMap } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const REWARDS_FILE = path.join(DATA_DIR, 'rewards.json');
const CLAIMED_FILE = path.join(DATA_DIR, 'claimed.json');

let rewards: Reward[] = [];
let claimed: ClaimedMap = {};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadRewards(): Reward[] {
  ensureDataDir();
  if (!fs.existsSync(REWARDS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(REWARDS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[Store] Failed to load rewards.json:', e);
    return [];
  }
}

function loadClaimed(): ClaimedMap {
  ensureDataDir();
  if (!fs.existsSync(CLAIMED_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CLAIMED_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch (e) {
    console.error('[Store] Failed to load claimed.json:', e);
    return {};
  }
}

function saveRewards(data: Reward[]): void {
  ensureDataDir();
  fs.writeFileSync(REWARDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function saveClaimed(data: ClaimedMap): void {
  ensureDataDir();
  fs.writeFileSync(CLAIMED_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function initStore(): void {
  rewards = loadRewards();
  claimed = loadClaimed();
  console.log('[Store] Loaded', rewards.length, 'rewards,', Object.keys(claimed).length, 'claimed');
}

export function getRewards(): Reward[] {
  return [...rewards];
}

export function getClaimed(): ClaimedMap {
  return { ...claimed };
}

export function getUnclaimedRewardsForUser(userId: string): Reward[] {
  return rewards.filter(
    (r) => r.assignedUserId === userId && !claimed[r.id]
  );
}

/** Returns rewards this user has already claimed (so they can view link/code again). */
export function getClaimedRewardsForUser(userId: string): Reward[] {
  return rewards.filter(
    (r) => r.assignedUserId === userId && claimed[r.id] === userId
  );
}

export function isClaimed(rewardId: string): boolean {
  return !!claimed[rewardId];
}

export function claimReward(rewardId: string, userId: string): boolean {
  const reward = rewards.find((r) => r.id === rewardId);
  if (!reward || reward.assignedUserId !== userId || claimed[rewardId]) {
    return false;
  }
  claimed[rewardId] = userId;
  saveClaimed(claimed);
  return true;
}

export function getRewardById(rewardId: string): Reward | undefined {
  return rewards.find((r) => r.id === rewardId);
}

export function setRewards(newRewards: Reward[]): void {
  rewards = newRewards;
  saveRewards(rewards);
}

export function addReward(reward: Reward): void {
  if (rewards.some((r) => r.id === reward.id)) {
    throw new Error('Reward id already exists');
  }
  rewards.push(reward);
  saveRewards(rewards);
}

export function updateReward(rewardId: string, updates: Partial<Reward>): boolean {
  const idx = rewards.findIndex((r) => r.id === rewardId);
  if (idx === -1) return false;
  rewards[idx] = { ...rewards[idx], ...updates };
  saveRewards(rewards);
  return true;
}

export function deleteReward(rewardId: string): boolean {
  const idx = rewards.findIndex((r) => r.id === rewardId);
  if (idx === -1) return false;
  rewards.splice(idx, 1);
  delete claimed[rewardId];
  saveRewards(rewards);
  saveClaimed(claimed);
  return true;
}

export function reloadFromDisk(): void {
  rewards = loadRewards();
  claimed = loadClaimed();
  console.log('[Store] Reloaded from disk');
}

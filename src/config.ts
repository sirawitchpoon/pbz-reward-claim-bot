import dotenv from 'dotenv';
dotenv.config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN?.trim() || '';
export const REWARD_CHANNEL_ID = process.env.REWARD_CHANNEL_ID?.trim() || '';
export const ADMIN_HTTP_PORT = parseInt(process.env.ADMIN_HTTP_PORT || '3456', 10);
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || '';

export function hasRequiredEnv(): boolean {
  return !!DISCORD_TOKEN && !!REWARD_CHANNEL_ID;
}

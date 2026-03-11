import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { hasRequiredEnv, ADMIN_HTTP_PORT, ADMIN_PASSWORD } from './config';
import { initStore } from './store/rewards';
import { RewardButtonService } from './services/RewardButtonService';
import { startDashboard } from './dashboard/server';
import * as interactionCreate from './events/interactionCreate';

initStore();

if (!hasRequiredEnv()) {
  console.error('Missing DISCORD_TOKEN or REWARD_CHANNEL_ID in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rewardButtonService = new RewardButtonService();

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  rewardButtonService.start(client);
  if (ADMIN_PASSWORD) {
    startDashboard(ADMIN_HTTP_PORT, ADMIN_PASSWORD);
    console.log(`Admin dashboard: http://localhost:${ADMIN_HTTP_PORT}`);
  } else {
    console.log('ADMIN_PASSWORD not set — dashboard disabled');
  }
});

client.on(interactionCreate.name, (i) => interactionCreate.execute(i).catch((e) => {
  console.error('[InteractionCreate]', e);
  if (i.isRepliable() && !i.replied && !i.deferred) {
    i.reply({ content: 'Something went wrong.', ephemeral: true }).catch(() => {});
  }
}));

process.on('SIGINT', () => {
  rewardButtonService.stop();
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN).catch((e) => {
  console.error('Login failed:', e);
  process.exit(1);
});

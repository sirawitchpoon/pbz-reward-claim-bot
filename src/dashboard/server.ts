import express from 'express';
import path from 'path';
import basicAuth from 'express-basic-auth';
import {
  getRewards,
  getClaimed,
  addReward,
  updateReward,
  deleteReward,
  reloadFromDisk,
  getRewardById,
} from '../store/rewards';
import {
  logRewardCreated,
  logRewardUpdated,
  logRewardDeleted,
  logConfigReloaded,
  getRecentLogs,
} from '../store/activityLog';
import type { Reward } from '../store/types';

const PUBLIC_DIR = path.join(__dirname, 'public');

export function startDashboard(port: number, password: string): void {
  const app = express();
  app.use(express.json());

  app.use(
    basicAuth({
      users: { admin: password },
      challenge: true,
      realm: 'Reward Claim Admin',
    })
  );

  app.use(express.static(PUBLIC_DIR));

  app.get('/api/rewards', (_req, res) => {
    try {
      const rewards = getRewards();
      const claimed = getClaimed();
      res.json({
        rewards: rewards.map((r) => ({
          ...r,
          claimed: !!claimed[r.id],
          claimedBy: claimed[r.id] || null,
        })),
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/claimed', (_req, res) => {
    try {
      res.json(getClaimed());
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/rewards', (req, res) => {
    try {
      const body = req.body as Reward;
      if (!body.id || !body.label || !body.type || !body.payload || !body.assignedUserId) {
        res.status(400).json({ error: 'Missing required fields: id, label, type, payload, assignedUserId' });
        return;
      }
      if (body.type !== 'nitro' && body.type !== 'steam') {
        res.status(400).json({ error: 'type must be nitro or steam' });
        return;
      }
      const reward = {
        id: String(body.id).trim(),
        label: String(body.label).trim(),
        type: body.type,
        payload: String(body.payload).trim(),
        assignedUserId: String(body.assignedUserId).trim(),
      };
      addReward(reward);
      logRewardCreated(reward.id, reward.label);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.put('/api/rewards/:id', (req, res) => {
    try {
      const id = req.params.id;
      const body = req.body as Partial<Reward>;
      const prev = getRewardById(id);
      const ok = updateReward(id, body);
      if (!ok) {
        res.status(404).json({ error: 'Reward not found' });
        return;
      }
      logRewardUpdated(id, body.label ?? prev?.label);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.delete('/api/rewards/:id', (req, res) => {
    try {
      const id = req.params.id;
      const prev = getRewardById(id);
      const ok = deleteReward(id);
      if (!ok) {
        res.status(404).json({ error: 'Reward not found' });
        return;
      }
      logRewardDeleted(id, prev?.label);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post('/api/reload', (_req, res) => {
    try {
      reloadFromDisk();
      logConfigReloaded();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/logs', (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit), 10) || 200, 500);
      res.json({ logs: getRecentLogs(limit) });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.listen(port, () => {
    console.log(`[Dashboard] Listening on port ${port}`);
  });
}

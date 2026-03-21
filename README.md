<p align="center">
  <strong>Reward Claim Bot</strong>
</p>
<p align="center">
  <em>Reward delivery bot for the Phantom Blade Zero community.</em>
</p>
<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js" alt="Node" /></a>
  <a href="https://discord.js.org"><img src="https://img.shields.io/badge/Discord.js-v14-5865F2?logo=discord" alt="Discord.js" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript" /></a>
  <img src="https://img.shields.io/badge/license-ISC-green" alt="License" />
  <img src="https://img.shields.io/badge/Phantom%20Blade%20Zero-PBZ%20Ecosystem-8b0000" alt="PBZ" />
</p>

---

Lucky draw winners claim Discord Nitro or Steam codes via a button in a designated channel. Links/codes sent **ephemeral** — only the winner sees them.

## 📋 Overview

| | |
|---|---|
| **Part of** | Phantom Blade Zero (PBZ) — Discord bot ecosystem |
| **Role** | One-time reward claim |
| **Stack** | TypeScript, Discord.js v14, Express.js (admin), JSON files |

---

## ✨ Features

- **Single or multiple rewards** per user — selection menu if multiple.
- **Admin dashboard** — Add reward (id, name, type Nitro/Steam, link/code, target userId), view/delete, reload config.
- **Ephemeral delivery** — Links/codes never appear in public channel.

---

## 🚀 Quick Start

```bash
cp .env.example .env   # DISCORD_TOKEN, REWARD_CHANNEL_ID, ADMIN_PASSWORD
mkdir -p data
# Create data/rewards.json (or use dashboard to add rewards)
docker compose up -d --build
```

Dashboard: **http://localhost:3456** (user: `admin`, password from `ADMIN_PASSWORD`).

---

## ⚙️ Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token |
| `REWARD_CHANNEL_ID` | Yes | Channel for Claim Reward button |
| `ADMIN_PASSWORD` | Yes | Dashboard auth |
| `ADMIN_HTTP_PORT` | No | Default 3456 |

---

## 📦 Data

- `data/rewards.json` — Reward definitions (sensitive; do not commit).
- `data/claimed.json` — Claim records (written by bot).

---

## 🔗 Ecosystem

Delivers prizes from Honorbot lucky draws; other PBZ bots include **Shadow Duel** ([`wuxia-bobozan`](../wuxia-bobozan)), **pbz-dashboard**, etc. See [`docs/README.md`](../docs/README.md).

---

## 📄 License

ISC · Part of the **Phantom Blade Zero** community ecosystem.

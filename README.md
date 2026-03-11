# Reward Claim Bot

> **Reward delivery bot for the Phantom Blade Zero community.**  
> Lucky draw winners claim Discord Nitro or Steam codes via a button in a designated channel.

---

## Overview

| | |
|---|---|
| **Part of** | Phantom Blade Zero (PBZ) — Discord bot ecosystem |
| **Role** | One-time reward claim (link/code sent ephemeral to winner) |
| **Stack** | TypeScript, Discord.js v14, Express.js (admin), JSON files |

Bot posts a **Claim Reward** button. Users with an assigned reward click it and receive their link or code in an ephemeral message (only they see it). Admin web dashboard at `http://localhost:3456` to add/remove rewards and view stats. No MongoDB — uses `data/rewards.json` and `data/claimed.json` (bind-mounted).

---

## Features

- **Single or multiple rewards** per user — selection menu if multiple.
- **Admin dashboard** — Add reward (id, name, type Nitro/Steam, link/code, target userId), view/delete, reload config.
- **Ephemeral delivery** — Links/codes never appear in public channel.

---

## Quick Start

```bash
cp .env.example .env   # DISCORD_TOKEN, REWARD_CHANNEL_ID, ADMIN_PASSWORD
mkdir -p data
# Create data/rewards.json (or use dashboard to add rewards)
docker compose up -d --build
```

Dashboard: **http://localhost:3456** (user: `admin`, password from `ADMIN_PASSWORD`).

---

## Environment

| Variable | Required | Description |
|----------|----------|--------------|
| `DISCORD_TOKEN` | Yes | Bot token |
| `REWARD_CHANNEL_ID` | Yes | Channel for Claim Reward button |
| `ADMIN_PASSWORD` | Yes | Dashboard auth |
| `ADMIN_HTTP_PORT` | No | Default 3456 |

---

## Data

- `data/rewards.json` — Reward definitions (sensitive; do not commit).
- `data/claimed.json` — Claim records (written by bot).

---

## License

ISC

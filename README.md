# fx-calendar-bot

A Discord bot that posts a daily Forex economic calendar digest and sends 15-minute reminders before high-impact news events. Supports multiple Discord servers.

## Features

- **Daily digest at 07:00 Berlin time (Mon–Fri)** — lists all upcoming High/Medium impact events for USD, EUR, GBP, and JPY
- **15-minute reminders** — automatically fires before each event; no polling, uses a single `setTimeout` per event scheduled at startup
- **Multi-server support** — each server configures its own channel via `/setup`
- **Data source** — [Forex Factory](https://www.forexfactory.com) weekly XML calendar feed

## Commands

| Command | Permission | Description |
|---------|------------|-------------|
| `/setup #channel` | Manage Server | Set the channel where the bot will post news |
| `/remove` | Manage Server | Stop the bot from posting on this server |

## Setup

### 1. Create the Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → give it a name
3. **Bot** → **Reset Token** → copy the token
4. **OAuth2 → URL Generator** → check `bot` and `applications.commands` scopes → check `Send Messages` and `Embed Links` permissions → open the generated URL to invite the bot to your server

### 2. Create the MongoDB database

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Connect → Drivers** → copy the connection string
3. Replace `<password>` in the URI with your database user password

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DISCORD_TOKEN=        # Bot token from Discord Developer Portal
CLIENT_ID=            # Application ID from Discord Developer Portal (General Information)
MONGODB_URI=          # MongoDB Atlas connection string
```

### 4. Deploy slash commands to Discord

```bash
npm run deploy
```

> For testing, set `DEV_GUILD_ID` in `.env` to your server ID — commands appear instantly instead of taking up to 1 hour globally.

### 5. Start the bot

```bash
npm start
```

On your Discord server, run `/setup #your-channel`. The bot will post the digest every weekday at 07:00 Berlin time.

## Local development

```bash
npm run dev          # Start with --watch (auto-restart on file changes)
```

Set `RUN_ON_START=true` in `.env` to trigger the morning job immediately on startup — useful for testing the digest and reminder flow without waiting until 07:00.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `CLIENT_ID` | Yes | Application ID used to deploy slash commands |
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas free tier works) |
| `DEV_GUILD_ID` | No | Deploy commands to a specific server instantly (testing) |
| `RUN_ON_START` | No | Run the morning job on bot startup (`true`/`false`, default `false`) |

## Architecture

```
src/
├── index.js              # Entry point: connects DB, loads commands, logs in
├── config.js             # Environment variables and constants
├── scheduler.js          # Cron job at 07:00 + per-event setTimeout reminders
├── db/
│   ├── connection.js     # MongoDB connection
│   └── guildRepository.js# CRUD for guild → channel mappings
├── commands/
│   ├── setup.js          # /setup command
│   └── remove.js         # /remove command
├── services/
│   ├── calendar.js       # Fetches and parses Forex Factory XML feed
│   └── notifier.js       # Posts embeds to Discord channels
├── formatters/
│   └── embeds.js         # Builds Discord EmbedBuilder objects
└── utils/
    └── logger.js         # Timestamped console logger
scripts/
└── deploy-commands.js    # One-time script to register slash commands
```

## Deployment

The `Procfile` is configured for [Railway](https://railway.app):

1. Push to GitHub
2. Connect the repo on Railway
3. Set environment variables in Railway dashboard
4. Railway runs `node src/index.js` automatically

Run `npm run deploy` once after first deploy to register slash commands.

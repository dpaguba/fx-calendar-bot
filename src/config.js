import 'dotenv/config';

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    devGuildId: process.env.DEV_GUILD_ID,
  },
  db: {
    uri: process.env.MONGODB_URI,
  },
  calendar: {
    url: 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml',
    currencies: ['USD', 'EUR', 'GBP', 'JPY'],
    impacts: ['High', 'Medium'],
    sourceTimezone: 'America/New_York',
  },
  scheduler: {
    timezone: 'Europe/Berlin',
    morningCron: '0 7 * * 1-5',
    reminderMinutesBefore: 15,
    runOnStart: process.env.RUN_ON_START === 'true',
  },
};

/**
 * Validates that all required environment variables are present.
 * Throws on startup before any connection is attempted.
 */
export function validateConfig() {
  const required = {
    DISCORD_TOKEN: config.discord.token,
    CLIENT_ID: config.discord.clientId,
    MONGODB_URI: config.db.uri,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

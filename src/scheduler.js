import cron from 'node-cron';
import { DateTime } from 'luxon';
import { fetchTodayEvents } from './services/calendar.js';
import { postMorningDigest, postReminder } from './services/notifier.js';
import { getAllGuilds } from './db/guildRepository.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

// Node.js setTimeout max safe delay (~24.8 days). Exceeding it causes immediate or no-op firing.
const MAX_SETTIMEOUT_DELAY = 2_147_483_647;

/**
 * Registers the morning cron job (07:00 Mon–Fri, Berlin time).
 * Optionally runs immediately if RUN_ON_START is set (useful for testing).
 *
 * @param {import('discord.js').Client} client
 */
export function startScheduler(client) {
  cron.schedule(config.scheduler.morningCron, () => runMorningJob(client), {
    timezone: config.scheduler.timezone,
  });

  logger.info(`Scheduler started — morning job at 07:00 ${config.scheduler.timezone} (Mon–Fri)`);

  if (config.scheduler.runOnStart) {
    logger.info('RUN_ON_START=true, running morning job now');
    runMorningJob(client);
  }
}

/**
 * Fetches today's events and posts the morning digest to all registered guilds.
 * Then schedules per-event reminders using setTimeout.
 *
 * Error strategy: if calendar fetch or DB fetch fails, the entire job is aborted.
 * If posting to an individual guild fails (e.g. deleted channel), that guild is
 * skipped and the error is logged — other guilds are unaffected.
 *
 * @param {import('discord.js').Client} client
 */
async function runMorningJob(client) {
  logger.info('Running morning job');

  let events, guilds;
  try {
    [events, guilds] = await Promise.all([fetchTodayEvents(), getAllGuilds()]);
  } catch (err) {
    logger.error('Morning job failed on data fetch:', err.message);
    return;
  }

  if (guilds.length === 0) {
    logger.warn('No guilds registered — skipping digest');
    return;
  }

  for (const guild of guilds) {
    try {
      await postMorningDigest(client, guild.channelId, events);
    } catch (err) {
      logger.error(`Failed to post digest to guild ${guild.guildId}: ${err.message}`);
    }
  }

  scheduleReminders(client, guilds, events);
}

/**
 * Schedules a setTimeout for each event's reminder, posted 15 minutes before the event.
 * Events without a known time (Tentative/All Day) are skipped.
 * Delays exceeding the JS setTimeout limit are also skipped (shouldn't occur for daily events).
 *
 * @param {import('discord.js').Client} client
 * @param {Array<{guildId: string, channelId: string}>} guilds
 * @param {Array} events
 */
function scheduleReminders(client, guilds, events) {
  const now = DateTime.now().setZone(config.scheduler.timezone);
  let scheduled = 0;

  for (const event of events) {
    if (!event.timeBerlin) continue;

    const reminderAt = event.timeBerlin.minus({ minutes: config.scheduler.reminderMinutesBefore });
    const delay = reminderAt.diff(now).milliseconds;

    if (delay <= 0 || delay > MAX_SETTIMEOUT_DELAY) continue;

    setTimeout(async () => {
      for (const guild of guilds) {
        try {
          await postReminder(client, guild.channelId, event);
        } catch (err) {
          logger.error(`Failed to post reminder to guild ${guild.guildId}: ${err.message}`);
        }
      }
    }, delay);

    scheduled++;
    logger.info(`Reminder scheduled: ${event.currency} — ${event.title} at ${reminderAt.toFormat('HH:mm')}`);
  }

  logger.info(`${scheduled} reminder(s) scheduled for today`);
}

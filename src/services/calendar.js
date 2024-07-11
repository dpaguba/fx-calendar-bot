import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { DateTime } from 'luxon';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const parser = new XMLParser({ ignoreAttributes: false });

const DATE_FORMATS = ['MMM dd, yyyy', 'MMMM d, yyyy', 'MM-dd-yyyy'];

/**
 * Fetches and parses today's economic events from the Forex Factory calendar feed.
 * Filters by configured currencies and impact levels, converts times to Berlin timezone.
 *
 * @returns {Promise<Array<{title: string, currency: string, impact: string, timeBerlin: DateTime|null, forecast: string, previous: string}>>}
 * @throws {Error} If the feed is unreachable or returns an unexpected HTTP status.
 */
export async function fetchTodayEvents() {
  const response = await axios.get(config.calendar.url, { timeout: 10_000 });
  const parsed = parser.parse(response.data);
  const weeklyevents = parsed?.weeklyevents;

  if (!weeklyevents) {
    logger.warn('Calendar feed returned unexpected structure — no weeklyevents element');
    return [];
  }

  const raw = weeklyevents.event;
  if (!raw) {
    logger.warn('Calendar feed has no events this week');
    return [];
  }

  const events = Array.isArray(raw) ? raw : [raw];
  const todayBerlin = DateTime.now().setZone(config.scheduler.timezone);

  const filtered = events.filter((e) => isTracked(e) && isToday(e, todayBerlin));
  const skipped = events.length - filtered.length;

  if (skipped > 0) {
    logger.info(`Filtered out ${skipped} events (wrong date, currency, or impact)`);
  }

  return filtered.map(parseEvent).sort(byTime);
}

function isTracked(event) {
  return (
    config.calendar.currencies.includes(event.country) &&
    config.calendar.impacts.includes(event.impact)
  );
}

function isToday(event, todayBerlin) {
  const date = parseDate(event.date);
  return date?.isValid && date.hasSame(todayBerlin, 'day');
}

function parseEvent(event) {
  return {
    title: String(event.title),
    currency: event.country,
    impact: event.impact,
    timeBerlin: parseEventTime(event.date, event.time),
    forecast: event.forecast ? String(event.forecast) : '—',
    previous: event.previous ? String(event.previous) : '—',
  };
}

function parseDate(dateStr) {
  for (const fmt of DATE_FORMATS) {
    const dt = DateTime.fromFormat(String(dateStr), fmt, {
      zone: config.calendar.sourceTimezone,
    });
    if (dt.isValid) return dt;
  }
  return null;
}

function parseEventTime(dateStr, timeStr) {
  const time = String(timeStr ?? '').trim();
  if (!time || ['Tentative', 'All Day', 'N/A'].includes(time)) return null;

  const date = parseDate(dateStr);
  if (!date) return null;

  const dt = DateTime.fromFormat(`${date.toFormat('yyyy-MM-dd')} ${time}`, 'yyyy-MM-dd h:mma', {
    zone: config.calendar.sourceTimezone,
  });

  return dt.isValid ? dt.setZone(config.scheduler.timezone) : null;
}

function byTime(a, b) {
  if (!a.timeBerlin && !b.timeBerlin) return 0;
  if (!a.timeBerlin) return 1;
  if (!b.timeBerlin) return -1;
  return a.timeBerlin.toMillis() - b.timeBerlin.toMillis();
}

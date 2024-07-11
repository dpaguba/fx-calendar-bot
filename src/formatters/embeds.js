import { EmbedBuilder } from 'discord.js';
import { DateTime } from 'luxon';
import { config } from '../config.js';

const FLAG = { USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵' };
const IMPACT_EMOJI = { High: '🔴', Medium: '🟡' };
const IMPACT_COLOR = { High: 0xe53e3e, Medium: 0xd69e2e };

/**
 * Builds the morning digest embed listing all today's economic events.
 * @param {Array<{title: string, currency: string, impact: string, timeBerlin: import('luxon').DateTime|null, forecast: string, previous: string}>} events
 * @returns {EmbedBuilder}
 */
export function buildMorningDigest(events) {
  const today = DateTime.now()
    .setZone(config.scheduler.timezone)
    .toFormat('cccc, d MMMM yyyy');

  const embed = new EmbedBuilder()
    .setTitle(`📅 Economic Calendar — ${today}`)
    .setColor(0x2b6cb0)
    .setFooter({ text: 'Forex Factory • Berlin time' })
    .setTimestamp();

  if (events.length === 0) {
    return embed.setDescription('No high-impact events scheduled for today.');
  }

  const fields = events.map((event) => ({
    name: `${IMPACT_EMOJI[event.impact]} ${FLAG[event.currency] ?? ''} ${event.currency} — ${event.title}`,
    value: [
      `🕐 **Time:** ${formatTime(event.timeBerlin)}`,
      `📊 **Forecast:** ${event.forecast}   📈 **Previous:** ${event.previous}`,
    ].join('\n'),
  }));

  return embed.addFields(fields);
}

/**
 * Builds a reminder embed for a single upcoming event.
 * @param {{ title: string, currency: string, impact: string, timeBerlin: import('luxon').DateTime, forecast: string, previous: string }} event
 * @returns {EmbedBuilder}
 */
export function buildReminder(event) {
  return new EmbedBuilder()
    .setTitle(`⚡ In 15 minutes: ${event.title}`)
    .setColor(IMPACT_COLOR[event.impact] ?? 0x718096)
    .addFields([
      { name: 'Currency', value: `${FLAG[event.currency] ?? ''} ${event.currency}`, inline: true },
      { name: 'Impact', value: `${IMPACT_EMOJI[event.impact]} ${event.impact}`, inline: true },
      { name: 'Time', value: formatTime(event.timeBerlin), inline: true },
      { name: 'Forecast', value: event.forecast, inline: true },
      { name: 'Previous', value: event.previous, inline: true },
    ])
    .setTimestamp();
}

function formatTime(dt) {
  return dt ? `${dt.toFormat('HH:mm')} (Berlin)` : 'Tentative';
}

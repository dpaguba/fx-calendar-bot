import { PermissionFlagsBits } from 'discord.js';
import { buildMorningDigest, buildReminder } from '../formatters/embeds.js';
import { logger } from '../utils/logger.js';

const REQUIRED_PERMISSIONS = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

/**
 * Resolves a text channel by ID, validating it exists and the bot has required permissions.
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @returns {Promise<import('discord.js').TextChannel>}
 * @throws {Error} If channel is not found, not a text channel, or bot lacks permissions.
 */
async function resolveChannel(client, channelId) {
  const channel = await client.channels.fetch(channelId);

  if (!channel?.isTextBased()) {
    throw new Error(`Channel ${channelId} does not exist or is not a text channel`);
  }

  const perms = channel.permissionsFor(client.user);
  if (!perms?.has(REQUIRED_PERMISSIONS)) {
    throw new Error(`Bot is missing SendMessages or EmbedLinks permission in channel ${channelId}`);
  }

  return channel;
}

/**
 * Posts the morning event digest to a specific channel.
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {Array} events - Today's filtered events from the calendar feed.
 */
export async function postMorningDigest(client, channelId, events) {
  const channel = await resolveChannel(client, channelId);
  await channel.send({ embeds: [buildMorningDigest(events)] });
  logger.info(`Morning digest → channel ${channelId} (${events.length} events)`);
}

/**
 * Posts a 15-minute reminder for a single event to a specific channel.
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {{ title: string, currency: string, impact: string, timeBerlin: import('luxon').DateTime, forecast: string, previous: string }} event
 */
export async function postReminder(client, channelId, event) {
  const channel = await resolveChannel(client, channelId);
  await channel.send({ embeds: [buildReminder(event)] });
  logger.info(`Reminder → channel ${channelId}: ${event.currency} — ${event.title}`);
}

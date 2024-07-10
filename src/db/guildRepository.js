import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
  },
  { timestamps: true }
);

const Guild = mongoose.model('Guild', guildSchema);

/**
 * Registers or updates the posting channel for a guild.
 * @param {string} guildId - Discord guild (server) ID.
 * @param {string} channelId - Discord text channel ID to post news into.
 */
export async function upsertGuild(guildId, channelId) {
  return Guild.findOneAndUpdate(
    { guildId },
    { channelId },
    { upsert: true, new: true }
  );
}

/**
 * Removes a guild's configuration from the database.
 * @param {string} guildId
 */
export async function removeGuild(guildId) {
  return Guild.deleteOne({ guildId });
}

/**
 * Returns all registered guilds.
 * @returns {Promise<Array<{guildId: string, channelId: string}>>}
 */
export async function getAllGuilds() {
  return Guild.find({}, { guildId: 1, channelId: 1, _id: 0 });
}

/**
 * Returns the configuration for a single guild, or null if not registered.
 * @param {string} guildId
 */
export async function getGuild(guildId) {
  return Guild.findOne({ guildId });
}

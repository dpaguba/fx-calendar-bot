import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { removeGuild, getGuild } from '../db/guildRepository.js';

export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Stop the bot from posting on this server')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const existing = await getGuild(interaction.guildId);

  if (!existing) {
    return interaction.editReply({
      content: '⚠️ The bot is not configured on this server. Use `/setup` to get started.',
    });
  }

  await removeGuild(interaction.guildId);

  await interaction.editReply({
    content: '🗑️ Bot removed. News will no longer be posted on this server.',
  });
}

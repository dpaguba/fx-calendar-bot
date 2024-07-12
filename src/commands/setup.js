import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { upsertGuild } from '../db/guildRepository.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Set the channel for daily news posting')
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('Text channel where the bot will post news')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('channel');
  await upsertGuild(interaction.guildId, channel.id);

  await interaction.editReply({
    content: `✅ Done! News will be posted in ${channel} every weekday at **07:00 Berlin time**.`,
  });
}

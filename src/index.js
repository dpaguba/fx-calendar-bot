import 'dotenv/config';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { connectDB } from './db/connection.js';
import { startScheduler } from './scheduler.js';
import { validateConfig, config } from './config.js';
import { logger } from './utils/logger.js';

validateConfig();

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

async function loadCommands() {
  const files = (await readdir(join(__dirname, 'commands'))).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const command = await import(`./commands/${file}`);
    client.commands.set(command.data.name, command);
  }
  logger.info(`Loaded ${client.commands.size} command(s)`);
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(`Command /${interaction.commandName} failed:`, err.message);
    const reply = { content: '❌ Something went wrong. Please try again.', ephemeral: true };
    // Use editReply if the interaction was already deferred or replied to by the command
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => null);
    } else {
      await interaction.reply(reply).catch(() => null);
    }
  }
});

client.once('ready', () => {
  logger.info(`Bot ready — logged in as ${client.user.tag}`);
  startScheduler(client);
});

client.on('error', (err) => logger.error('Discord client error:', err.message));

await connectDB();
await loadCommands();
await client.login(config.discord.token);

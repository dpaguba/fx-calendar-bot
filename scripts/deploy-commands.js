import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { config } from '../src/config.js';
import * as setup from '../src/commands/setup.js';
import * as remove from '../src/commands/remove.js';

const commands = [setup.data, remove.data].map((cmd) => cmd.toJSON());
const rest = new REST().setToken(config.discord.token);

const target = config.discord.devGuildId
  ? Routes.applicationGuildCommands(config.discord.clientId, config.discord.devGuildId)
  : Routes.applicationCommands(config.discord.clientId);

await rest.put(target, { body: commands });

const scope = config.discord.devGuildId ? `guild ${config.discord.devGuildId}` : 'global';
console.log(`✅ Commands deployed (${scope})`);

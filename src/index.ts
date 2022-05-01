import 'reflect-metadata';
import 'dotenv/config';

import { importx } from '@discordx/importer';
import { Intents } from 'discord.js';
import { Client } from 'discordx';

export const client = new Client({
  botId: 'auction-sniper',

  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],

  botGuilds: [process.env.DEV_GUILD],
  // botGuilds: [client => client.guilds.cache.map(guild => guild.id)],

  silent: false, // Show debug logs
});

client.once('ready', async () => {
  await client.guilds.fetch();

  await client.initApplicationCommands();

  await client.initApplicationPermissions();

  console.log('DiscordX client is running with success!');
});

client.on('interactionCreate', interaction => {
  client.executeInteraction(interaction);
});

async function run() {
  await importx(`${__dirname}/{events,commands}/**/*.{ts,js}`);

  if (!process.env.TOKEN) {
    throw Error('Could not find TOKEN in your .env');
  }

  await client.login(process.env.TOKEN);
}

run();

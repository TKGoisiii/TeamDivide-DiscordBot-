import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { commands } from './commands/teams-command.js';
import { sendChannelSelectMenu, handleChannelSelect } from './handlers/channel-select-handler.js';
import { handleTeamDivision } from './handlers/team-division-handler.js';
import { channelStore } from './utils/channel-store.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const TOKEN = process.env.BOT_TOKEN;
const APPLICATION = process.env.APPLICATION_ID;

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log('スラッシュコマンドの登録を開始...');
    await rest.put(
      Routes.applicationCommands(APPLICATION),
      { body: commands },
    );
    console.log('スラッシュコマンドの登録が完了しました');
  } catch (error) {
    console.error('スラッシュコマンドの登録中にエラーが発生しました:', error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  registerCommands();
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    if (interaction.commandName === 'teams') {
      await sendChannelSelectMenu(interaction);
    }
  } else if (interaction.isChannelSelectMenu()) {
    await handleChannelSelect(interaction, channelStore);
  } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await handleTeamDivision(interaction, channelStore);
  }
});

client.login(TOKEN);
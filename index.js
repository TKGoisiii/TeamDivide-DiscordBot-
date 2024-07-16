require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  ChannelSelectMenuBuilder, 
  ChannelType,
  REST,
  Routes 
} = require('discord.js');

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

// スラッシュコマンドの定義
const commands = [
  {
    name: 'teams',
    description: 'チーム分けメニューを表示する',
  },
];

// RESTモジュールの準備
const rest = new REST({ version: '10' }).setToken(TOKEN);

// スラッシュコマンドを登録する関数
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

const channelStore = new Map();

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    if (interaction.commandName === 'teams') {
      await sendChannelSelectMenu(interaction);
    }
  } else if (interaction.isChannelSelectMenu()) {
    await handleChannelSelect(interaction);
  } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await handleTeamDivision(interaction);
  }
});

async function sendChannelSelectMenu(interaction) {
  const channelRow = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_channel')
        .setPlaceholder('VCチャンネルを選択')
        .addChannelTypes(ChannelType.GuildVoice)
    );

  await interaction.reply({
    content: 'チーム分けを行うVCチャンネルを選択してください：',
    components: [channelRow]
  });
}

async function handleChannelSelect(interaction) {
  const selectedChannel = interaction.channels.first();
  channelStore.set(interaction.user.id, selectedChannel.id);
  
  const buttonRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('divide_even')
        .setLabel('均等に2チームに分ける')
        .setStyle(ButtonStyle.Primary),
    );

  const selectRow = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('team_size')
        .setPlaceholder('チーム1の人数を選択')
        .addOptions(
          { label: '1人', value: '1' },
          { label: '2人', value: '2' },
          { label: '3人', value: '3' },
          { label: '4人', value: '4' },
          { label: '5人', value: '5' },
        ),
    );

  await interaction.update({ 
    content: `${selectedChannel.name} が選択されました。チーム分けの方法を選択してください：`,
    components: [buttonRow, selectRow]
  });
}

async function handleTeamDivision(interaction) {
  const selectedChannelId = channelStore.get(interaction.user.id);
  if (!selectedChannelId) {
    return interaction.reply({ content: 'チャンネルが選択されていません。最初からやり直してください。', ephemeral: true });
  }

  const voiceChannel = await interaction.guild.channels.fetch(selectedChannelId);

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    return interaction.reply({ content: '有効なボイスチャンネルを選択してください。', ephemeral: true });
  }

  const participants = voiceChannel.members.filter(m => !m.user.bot).map(m => m.user);

  if (participants.length < 2) {
    return interaction.reply({ content: 'チーム分けには少なくとも2人のユーザーが必要です。', ephemeral: true });
  }

  let team1Size;

  if (interaction.isButton() && interaction.customId === 'divide_even') {
    team1Size = Math.ceil(participants.length / 2);
  } else if (interaction.isStringSelectMenu() && interaction.customId === 'team_size') {
    team1Size = parseInt(interaction.values[0]);
    if (team1Size >= participants.length) {
      return interaction.reply({ content: 'チーム1の人数が多すぎます。もっと少ない人数を選択してください。', ephemeral: true });
    }
  } else {
    return;
  }

  const team2Size = participants.length - team1Size;

  // 参加者をシャッフル
  const shuffled = participants.sort(() => 0.5 - Math.random());

  const team1 = shuffled.slice(0, team1Size);
  const team2 = shuffled.slice(team1Size);

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`チーム分け結果 - ${voiceChannel.name}`)
    .addFields(
      { name: 'チーム1', value: team1.map(user => user.toString()).join('\n') || '(なし)', inline: true },
      { name: 'チーム2', value: team2.map(user => user.toString()).join('\n') || '(なし)', inline: true }
    )
    .setFooter({ text: `総参加者数: ${participants.length} (チーム1: ${team1.length}, チーム2: ${team2.length})` })
    .setTimestamp();

  await interaction.update({ content: ' ', embeds: [embed], components: [] });
}

client.login(TOKEN);
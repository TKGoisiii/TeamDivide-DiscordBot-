import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

export async function sendChannelSelectMenu(interaction) {
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

export async function handleChannelSelect(interaction, channelStore) {
    const selectedChannel = interaction.channels.first();
    channelStore.set(interaction.user.id, selectedChannel.id);
    
    const teamCountSelect = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('team_count')
          .setPlaceholder('チーム数を選択')
          .addOptions(
            { label: '2チーム', value: '2' },
            { label: '3チーム', value: '3' },
            { label: '4チーム', value: '4' },
            { label: '5チーム', value: '5' },
          )
      );
  
    await interaction.update({ 
      content: `${selectedChannel.name} が選択されました。チーム数を選択してください：`,
      components: [teamCountSelect]
    });
  }
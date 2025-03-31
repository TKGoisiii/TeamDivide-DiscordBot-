import { EmbedBuilder, ChannelType } from 'discord.js';

export async function handleTeamDivision(interaction, channelStore) {
    const selectedChannelId = channelStore.get(interaction.user.id);
    if (!selectedChannelId) {
      return interaction.reply({ content: 'チャンネルが選択されていません。最初からやり直してください。', ephemeral: true });
    }
  
    const voiceChannel = await interaction.guild.channels.fetch(selectedChannelId);
    const participants = voiceChannel.members.filter(m => !m.user.bot).map(m => m.user);
  
    if (participants.length < 2) {
      return interaction.reply({ content: 'チーム分けには少なくとも2人のユーザーが必要です。', ephemeral: true });
    }
  
    let teamCount = 2; // デフォルト値
    if (interaction.isStringSelectMenu() && interaction.customId === 'team_count') {
      teamCount = parseInt(interaction.values[0]);
      if (teamCount > participants.length) {
        return interaction.reply({ 
          content: `チーム数が多すぎます。参加者数(${participants.length}人)以下のチーム数を選択してください。`, 
          ephemeral: true 
        });
      }
    }
  
    // 参加者をシャッフル
    const shuffled = participants.sort(() => 0.5 - Math.random());
    
    // チーム分け
    const teams = Array.from({ length: teamCount }, (_, i) => 
      shuffled.filter((_, index) => index % teamCount === i)
    );
  
    // Embed作成
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${voiceChannel.name} - ${teamCount}チーム分け結果`)
      .setDescription(`参加者数: ${participants.length}人`);
  
    teams.forEach((team, i) => {
      embed.addFields({
        name: `チーム ${i + 1} (${team.length}人)`,
        value: team.map(user => user.toString()).join('\n') || '(なし)',
        inline: true
      });
    });
  
    await interaction.update({ 
      content: ' ',
      embeds: [embed], 
      components: [] 
    });
  }
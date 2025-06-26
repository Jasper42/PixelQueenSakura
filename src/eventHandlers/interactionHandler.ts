import { Client, Events, TextChannel, EmbedBuilder, Interaction } from 'discord.js';
import { awardCurrency, subtractCurrency } from '../utils/unbelieva';
import { addPoints, subtractPoints, removePlayer, getLeaderboard, LeaderboardEntry } from '../utils/pointsManager';
import { getUserFromId } from '../utils/gameUtils';
import { queryAI } from '../utils/aiUtils';
import config from '../config';
import { gameSessions, adminUserIds } from '../utils/botConstants';

// Extracts user ID from a string input, handling both mentions and plain IDs.
function extractUserId(input: string | null): string | null {
  if (!input) return null;
  const match = input.match(/^<@!?(\d+)>$/);
  return match ? match[1] : input.trim();
}

// Sets up the interaction handler for slash commands in the bot.
export function setupInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      const channelId: string | undefined = interaction.channel?.id;
      const session = channelId ? gameSessions[channelId] : undefined;
      const userId: string = interaction.user.id;

      switch (interaction.commandName) {
        case 'start': {
          const name: string = interaction.options.getString('name')!.toLowerCase();
          const limit: number = interaction.options.getInteger('limit') ?? 0;
          const groupName: string | undefined = interaction.options.getString('group')?.toLowerCase();
          const imageUrl: string | undefined = interaction.options.getString('image') ?? undefined;

          if (session?.active) {
            await interaction.reply({ content: '⚠️ A game is already active!', ephemeral: true });
            return;
          }

          if (!channelId) {
            await interaction.reply({ content: '❌ Channel ID is undefined.', ephemeral: true });
            return;
          }

          gameSessions[channelId] = {
            target: name,
            limit,
            groupname: groupName,
            active: true,
            players: {},
            starterId: userId,
            starterName: interaction.user.username,
            imageUrl
          };

          await interaction.reply({ content: `✅ Game started with ${limit} tries.`, ephemeral: true });

          // Announce game in channel after replying to interaction
          (async () => {
            const gamePingRoleId: string = config.GamePingRoleId;
            const textChannel = interaction.channel as TextChannel;
            if (textChannel?.send) {
              let gameAnnouncement: string = `<@${userId}> started a 🎮 Guess-the-Idol 🎮 game! \nType \`!idolname\` to guess. You have **${limit}** tries.`;
              if (groupName) {
                gameAnnouncement += `\nA group name has been provided!`;
              }
              if (gamePingRoleId == '0') {
                await textChannel.send(gameAnnouncement);
              } else {
                await textChannel.send(`${gameAnnouncement} <@&${gamePingRoleId}>`);
              }
            }
          })();
          break;
        }

        case 'end': 
          if (!session?.active) {
            await interaction.reply({ content: 'No game to end.', ephemeral: true });
            return;
          }
          session.active = false;
          await interaction.reply('🛑 Game ended.');
          if (session.imageUrl) {
            await (interaction.channel as TextChannel).send({ content: 'Here is the idol image!', files: [session.imageUrl] });
          } else {
            await (interaction.channel as TextChannel).send('No image was provided for this round.');
          }
          break;
          
        case 'leaderboard': {
          const showIds = interaction.options.getBoolean('showids');
          const leaderboard: LeaderboardEntry[] = await getLeaderboard();

          const topPerformers = leaderboard.slice(0, 10);

          let leaderboardContent = '```\n';
          leaderboardContent += 'Rank   | Username          | Points';
          if (showIds) {
              leaderboardContent += ' | User ID';
          }
          leaderboardContent += '\n---------------------------------------\n';

          if (topPerformers.length === 0) {
              leaderboardContent += 'No one has played yet!\n```';
          } else {
              topPerformers.forEach((entry, i) => {
                  let rankDisplay;
                  if (i === 0) {
                      rankDisplay = '1st 🥇';
                  } else if (i === 1) {
                      rankDisplay = '2nd 🥈';
                  } else if (i === 2) {
                      rankDisplay = '3rd 🥉';
                  } else {
                      rankDisplay = `#${i + 1}`;
                  }
                  const rank = rankDisplay.padEnd(6);
                  const username = entry.username.padEnd(17).substring(0, 17);
                  const points = entry.points.toString().padEnd(6);
                  let line = `${rank} | ${username} | ${points}`;
                  if (showIds) {
                      line += ` | ${entry.userId}`;
                  }
                  leaderboardContent += `${line}\n`;
              });
              leaderboardContent += '```';
          }

          const leaderboardEmbed = new EmbedBuilder()
              .setTitle('📊 Guess-the-Idol Leaderboard')
              .setDescription('Current standings for Guess-the-Idol.')
              .setColor('#5865F2')
              .setTimestamp();

          leaderboardEmbed.addFields({ name: 'Top Players', value: leaderboardContent });

          await interaction.reply({ embeds: [leaderboardEmbed] });
          break;
        }

        case 'x_admin_addpoints': {
          if (!adminUserIds.includes(userId)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
          }
          const targetUserId = interaction.options.getString('player');
          const targetUserIdtrimmed = extractUserId(targetUserId);
          const pointsToAdd = interaction.options.getInteger('points');
          if (!targetUserIdtrimmed || !pointsToAdd) {
            await interaction.reply({ content: 'Please provide a user ID and points to add.', ephemeral: true });
            return;
          }
          const user = await getUserFromId(client, targetUserIdtrimmed);
          if (!user) {
            await interaction.reply({ content: `User not found: ${targetUserIdtrimmed}`, ephemeral: true });
            return;
          }
          await addPoints(targetUserIdtrimmed, user.username, pointsToAdd);
          await interaction.reply({ content: `Added ${pointsToAdd} points to ${user.username} (${targetUserIdtrimmed}).` });
          break;
        }

        case 'x_admin_subtractpoints': {
          if (!adminUserIds.includes(userId)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
          }
          const targetUserId = interaction.options.getString('player');
          const targetUserIdtrimmed = extractUserId(targetUserId);
          const pointsToSubtract = interaction.options.getInteger('points');
          if (!targetUserIdtrimmed || !pointsToSubtract) {
            await interaction.reply({ content: 'Please provide a user ID and points to subtract.', ephemeral: true });
            return;
          }
          await subtractPoints(targetUserIdtrimmed, pointsToSubtract);
          await interaction.reply({ content: `Subtracted ${pointsToSubtract} points from ${targetUserIdtrimmed}.` });
          break;
        }

        case 'x_admin_removeplayer': {
          if (!adminUserIds.includes(userId)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
          }
          const targetUserId = interaction.options.getString('user');
          const targetUserIdtrimmed = extractUserId(targetUserId);
          if (!targetUserIdtrimmed) {
            await interaction.reply({ content: 'Please provide a user ID to remove.', ephemeral: true });
            return;
          }
          await removePlayer(targetUserIdtrimmed);
          await interaction.reply({ content: `Removed ${targetUserIdtrimmed}.` });
          break;
        }

        // Add more commands here as needed
      }
    } catch (err) {
      console.error('❌ Unhandled error in interaction handler:', err);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: '❌ An error occurred while processing your command.', ephemeral: true });
        } catch {}
      }
    }
  });
}

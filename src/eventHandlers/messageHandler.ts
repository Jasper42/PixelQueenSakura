import { Client, Events } from 'discord.js';
import config from '../config';
import { awardCurrency } from '../utils/unbelieva';
import { gameSessions, numberEmoji } from '../utils/botConstants';
import { handleGuessCooldown } from '../utils/aiHintUtils';

export function setupMessageHandler(client: Client) {
  client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    // Idol guessing logic "!"
    if (message.content.startsWith('!')) {
      const channelId = message.channel.id;
      const session = gameSessions[channelId];
      if (!session?.active) return;

      const guess = message.content.slice(1).trim().toLowerCase();
      const userId = message.author.id;
      const username = message.author.toString();
      const userGuesses = session.players[userId] ?? 0;

      if (userGuesses >= session.limit) {
        await message.react('☠️');
        return;
      }

      if (guess === session.target) {
        session.active = false;

        const guess_reward = config.Guess_reward;
        const starterReward = Math.ceil(guess_reward * 0.60);

        let revealMsg = `🎉 ${username} guessed right! It was **${session.target}**. +${guess_reward} coins awarded! \nA percentage of the prize was also given to the coordinator. +${starterReward} `;
        if (session.imageUrl) {
          revealMsg += `\n**Image Reveal:**\n${session.imageUrl}`;
        }

        await message.channel.send(revealMsg);
        await awardCurrency(userId, guess_reward);
        await awardCurrency(session.starterId, starterReward);
      } else if (session.groupname && guess === session.groupname) {
        await message.react('✅');
      } else {
        session.players[userId] = userGuesses + 1;
        const remaining = session.limit - session.players[userId];
        try {
          await message.react('❌');
          if (remaining >= 0 && remaining <= 10) {
            await message.react(numberEmoji[remaining]);
          }
          if (session.players[userId] >= session.limit) {
            await message.react('☠️');
          }
          await handleGuessCooldown(
            channelId,
            guess,
            remaining,
            session,
            message.member?.displayName || message.author.username,
            async (msg) => { await message.channel.send(msg); }
          );
        } catch (err) {
          console.error('❌ Failed to react to guess message:', err);
        }
      }
    }
  });
}
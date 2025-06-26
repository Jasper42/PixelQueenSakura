import { queryAI } from './aiUtils';
import { groqCooldowns, groqQueue } from './botConstants';

// This file contains utility functions for handling AI hints and cooldowns in a guessing game.

export async function handleGuessCooldown(
  channelId: string,
  guess: string,
  remaining: number,
  session: { target: string, groupname?: string },
  userName: string,
  send: (msg: string) => Promise<any>
) {
  const groupString = session.groupname ? `The group name is "${session.groupname}". ` : ' ';
  if (!groqCooldowns[channelId]) {
    groqCooldowns[channelId] = true;

    const hintPrompt = remaining <= 2
      ? `${userName} guessed "${guess}" as the kpop idol in the picture, but it's wrong. Respond with a slightly short, nerdy, and sometimes lewd message. Keep it 3 sentences or shorter. Give the player a hint about the idol. If you have any online information about the idol, try to hint with it. Otherwise try to help them figure out the name with maybe a rhyme hint or in some other smart/entertaining way. "${session.target}" is the idol they're trying to guess and you're not supposed to reveal the name. ${groupString}`
      : `${userName} guessed "${guess}" as the kpop idol in the picture, but it's wrong. Respond with a slightly short, nerdy, and sometimes lewd message. Keep it 3 sentences or shorter.`;

    const aiReply = await queryAI(hintPrompt);
    await send(aiReply);

    // Cooldown reset
    setTimeout(async () => {
      groqCooldowns[channelId] = false;

      if (groqQueue[channelId]?.length > 0) {
        const replies = groqQueue[channelId].join(', ');
        const generalPrompt = remaining <= 2
          ? `Multiple people guessed the idol in the picture's name to be (${replies}) but all were wrong. Respond with a slightly short, sometimes lewd and teasing grouped message. Keep it 3 sentences or shorter. Give the players a hint about the idol. If you have any online information about the idol, try to hint with it. Otherwise try to help them figure out the name with maybe a rhyme hint or in some other smart/entertaining way. "${session.target}" is the idol they're trying to guess and you're not supposed to explicitly say the name or the group name. ${groupString}`
          : `Multiple users guessed the idol in the picture's name to be (${replies}) and were wrong. Respond with a slightly short and lewd grouped comment, playful and fun. Keep it 3 sentences or shorter.`;

        const generalReply = await queryAI(generalPrompt);
        await send(generalReply);
        groqQueue[channelId] = [];
      }
    }, 10000);

  } else {
    // If on cooldown, queue the guess
    if (!groqQueue[channelId]) groqQueue[channelId] = [];
    groqQueue[channelId].push(guess);
  }
}
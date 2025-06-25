import { Client, Events, TextChannel } from 'discord.js';
import { registerCommands } from '../registerCommands';
import config from '../config';
import { isDev } from '../utils/botConstants';

// Handles the client ready event.
// This function is called when the Discord client is ready and logged in.
// It registers commands and sends a message to the development channel if in development mode.

export function setupClientReadyHandler(client: Client) {
  client.once(Events.ClientReady, async () => {
    if (!client.user) {
      console.error('❌ client.user is undefined!');
      return;
    }

    console.log(`🤖 Logged in as ${client.user.tag}`);
    await registerCommands(client.user.id);

    if (isDev) { 
      const devChannel = client.channels.cache.get(config.DEV_CHANNEL ?? '0') as TextChannel;
      if (devChannel) await devChannel.send('Sakura is online!');
    }
  });
}
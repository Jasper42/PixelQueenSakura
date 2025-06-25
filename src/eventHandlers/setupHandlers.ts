import { Client } from 'discord.js';
import { setupClientReadyHandler } from './clientReadyHandler';
import { setupInteractionHandler } from './interactionHandler';
import { setupMessageHandler } from './messageHandler';

// This file sets up all event handlers for the Discord client.
// It imports the necessary handlers and initializes them with the client instance in index.ts.

export function setupEventHandlers(client: Client) {
  setupClientReadyHandler(client);
  setupInteractionHandler(client);
  setupMessageHandler(client);
}
import { Client, User } from 'discord.js';

// This file contains utility functions and types related to game sessions in a Discord bot.

export interface GameSession {
  target: string;
  limit: number;
  groupname?: string;
  active: boolean;
  players: Record<string, number>;
  starterId: string;
  starterName: string;
  imageUrl?: string;
}

export async function getUserFromId(client: Client, userId: string): Promise<User | null> {
  try {
    return await client.users.fetch(userId);
  } catch (error) {
    console.error(`❌ Could not fetch user with ID ${userId}:`, error);
    return null;
  }
}
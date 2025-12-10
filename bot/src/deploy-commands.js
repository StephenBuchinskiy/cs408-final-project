import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import * as quest from './commands/quest.js';
import * as kudos from './commands/kudos.js';
import * as leaderboard from './commands/leaderboard.js';

const { DISCORD_TOKEN, APPLICATION_ID, DEV_GUILD_ID } = process.env;
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// Discord slash commands to deploy
const commands = [
    quest.data.toJSON(),
    kudos.data.toJSON(),
    leaderboard.data.toJSON(),
];

/**
 * Deploys slash commands to Discord, either globally or to a development guild.
 * Deployment is faster for development.
 * 
 * @throws {Error} If DISCORD_TOKEN or APPLICATION_ID is missing from environment variables
 */
async function main() {
    if (!DISCORD_TOKEN || !APPLICATION_ID) {
        throw new Error('Missing DISCORD_TOKEN or APPLICATION_ID in environment.');
    }

    if (DEV_GUILD_ID) {
        // For development, deploy commands faster
        await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, DEV_GUILD_ID), { body: commands });
        console.log('Deployed commands to dev guild');
    } else {
        await rest.put(Routes.applicationCommands(APPLICATION_ID), { body: commands });
        console.log('Deployed commands globally');
    }
}

main().catch((e) => {
    console.error('Error deploying commands:', e);
    process.exit(1);
});
import 'dotenv/config.js';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import fetch from 'node-fetch';
import * as quest from './commands/quest.js';
import * as kudos from './commands/kudos.js';
import * as leaderboard from './commands/leaderboard.js';

const {
    DISCORD_TOKEN,
    API_BASE_URL,
    LOG_LEVEL = 'info',
} = process.env;

if (!DISCORD_TOKEN) throw new Error('Missing DISCORD_TOKEN in environment.');
if (!API_BASE_URL) throw new Error('Missing API_BASE_URL in environment.');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/**
 * Call Questro HTTP API with JSON defaults.
 *
 * @param {string} path - Path starting with "/"
 * @param {RequestInit} [options] - fetch options
 * @returns {Promise} Parsed JSON or text
 * @throws {Error} On HTTP error
 */
async function api(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'content-type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (res.status === 204) return null;
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// Command registry mapping command names to their execute functions
const registry = new Map([
    [quest.data.name, quest.execute],
    [kudos.data.name, kudos.execute],
    [leaderboard.data.name, leaderboard.execute],
]);

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const execute = registry.get(interaction.commandName);
    if (!execute) return interaction.reply({ content: 'Unknown command', ephemeral: true });

    try {
        await execute(interaction, { api });
    } catch (error) {
        console.error(error);
        const message = `${String(error.message || error).slice(0, 180)}`;
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: message }).catch(() => {});
        } else {
            await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
        }
    }
});

client.login(DISCORD_TOKEN);
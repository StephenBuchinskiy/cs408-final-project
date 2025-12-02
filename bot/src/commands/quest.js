import { SlashCommandBuilder } from 'discord.js';

/**
 * Discord slash commands for managing quests.
 * 
 * @description Slash commands for adding, completing, and listing quests.
 */
export const data = new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Manage quests')
    .addSubcommand(s => s.setName('add').setDescription('Add a quest')
        .addStringOption(o => o.setName('title').setDescription('Quest Title').setRequired(true)))
    .addSubcommand(s => s.setName('done').setDescription('Mark quest as done')
        .addStringOption(o => o.setName('id').setDescription('Quest ID').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List all quests'))
        .addStringOption(o => o.setName('status').setDescription('open | done'))
        .addUserOption(o => o.setName('user').setDescription('Filter by user'));


/**
 * Executes a specified /quest subcommand.
 * 
 * @param {Object} interaction - The Discord interaction object representing the slash command invocation
 * @param {Function} options.api - The API function for making HTTP requests to the backend
 * @returns {Promise<void>} An interaction reply based on the subcommand executed
 * 
 * @description Handles three subcommands:
 * - add: Creates a new quest with the provided title
 * - done: Marks an existing quest as completed and awards kudos
 * - list: Retrieves and displays quests, optionally filtered by status and/or user
 * 
 * @throws {Error} If the API request fails or returns an error
 */
export async function execute(interaction, { api }) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const user = interaction.user;

    if (sub === 'add') {
        const title = interaction.options.getString('title', true);
        await interaction.deferReply();
        const created = await api(`/quests`, {
            method: 'POST',
            body: JSON.stringify({
                serverId: guildId,
                userId: user.id,
                username: `@${user.tag}`,
                title,
                tags: []
            })
        });
        return interaction.editReply(`Created quest ${created.title} with ID ${created.id}`);
    }

    if (sub === 'done') {
        const id = interaction.options.getString('id', true);
        await interaction.deferReply();
        const updated = await api(`/quests/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'done', kudos: 1 })
        });
        return interaction.editReply(`Marked quest ${updated.title} as done!`);
    }

    if (sub === 'list') {
        const status = interaction.options.getString('status') || undefined;
        const selectedUser = interaction.options.getUser('user') || undefined;

        await interaction.deferReply();
        const params = new URLSearchParams({ serverId: guildId });
        if (status) params.set('status', status);
        if (selectedUser) params.set('userId', selectedUser.id);

        const data = await api(`/quests?${params.toString()}`);
        const items = data.items || [];

        const embed = new EmbedBuilder()
            .setTitle('Quests')
            .setDescription(items.length ? items.map(q => `**[${q.id}] ${q.title}** - ${q.status} (by ${q.username})`).join('\n') : 'No quests found.');

        return interaction.editReply({ embeds: [embed] });
    }

    return interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
}
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('kudos')
    .setDescription('Give kudos to a user')
    .addSubcommand(s => 
        s.setName('give')
        .setDescription('Give kudos')
        .addUserOption(o => 
            o.setName('user')
            .setDescription('User to receive kudos')
            .setRequired(true)
        )
        .addIntegerOption(o => 
            o.setName('amount')
            .setDescription('How many kudos (default 1)')
            .setRequired(false)
        )
    );

export async function execute(interaction, { api }) {
    if (!interaction.isChatInputCommand()) return;
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub !== 'give') {
        return interaction.reply({ content: 'Unknown kudos subcommand', ephemeral: true });
    }

    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount') || 1;

    // Validate specified amount
    if (!Number.isInteger(amount) || amount <= 0) {
        return interaction.reply({ content: 'Amount must be a positive integer', ephemeral: true });
    }
    if (amount > 10) {
        return interaction.reply({ content: 'Amount exceeds maximum of 10', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // Fetch the most recent quest for the target user
        const params = new URLSearchParams({ serverId: guildId, userId: target.id, limit: '1' });
        const data = await api(`/quests?${params.toString()}`);
        const items = data?.items ?? [];

        if (!items.length) {
            await interaction.editReply(`User ${target.tag} has no quests to receive kudos.`);
            return;
        }

        const quest = items[0];
        const newKudos = (Number(quest.kudos) || 0) + amount;

        // Update the quest with the new kudos amount
        await api(`/quests/${encodeURIComponent(quest.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ kudos: newKudos })
        });

        await interaction.editReply(`Gave ${amount} kudos to <@${target.id}> for quest "${quest.title}". Total kudos: ${newKudos}.`);
    } catch (error) {
        console.error(error);
        try {
            await interaction.editReply({ content: `Error giving kudos: ${String(error.message || error).slice(0, 180)}` });
        } catch {}
    }
}


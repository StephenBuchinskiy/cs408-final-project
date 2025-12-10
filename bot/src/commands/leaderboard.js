import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the top questers in this server')
    .addIntegerOption(o =>
        o.setName('limit')
        .setDescription('How many to show (default 5, max 25)')
        .setRequired(false)
    );

export async function execute(interaction, { api }){
    const guildId = interaction.guildId;
    const limit = Math.min(interaction.options.getInteger('limit') ?? 5, 25);

    await interaction.deferReply();

    const rows = await api(`/leaderboard?serverId=${encodeURIComponent(guildId)}&limit=${limit}`);
    const lines = (rows ?? []).map((r, i) =>
        `**${i + 1}.** <@${r.userId ?? 'unknown'}> - **${r.kudos ?? 0}** kudos, ${r.done ?? 0} done`
    );

    const embed = new EmbedBuilder()
        .setTitle('Questro Leaderboard')
        .setDescription(lines.length ? lines.join('\n') : 'No data yet'
    );

    await interaction.editReply({ embeds: [embed] });
}

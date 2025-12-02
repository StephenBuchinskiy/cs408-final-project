const BASE = window.QUESTRO_API_BASE;

export async function listQuests({ serverId, ...q }) {
    const url = new URL(`${BASE}/quests`);
    url.searchParams.set('serverId', serverId);
    Object.entries(q).forEach(([k, v]) => v!= null &&url.searchParams.set(k, v));
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
}
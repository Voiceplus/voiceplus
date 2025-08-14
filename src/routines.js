import client from "./client.js";

const CLEANUP_INTERVAL_MS = 60_000; 

setInterval(async () => {
  const guilds = await client.db.guild.findMany({ select: { id: true } });

  for (const { id: guildId } of guilds) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const [setupChannels, tempChannels] = await Promise.all([
      client.db.setup.findMany({ where: { guildId } }),
      client.db.voice.findMany({ where: { guildId } }),
    ]);

    for (const { creatorChannelId } of setupChannels) {
      const exists = await guild.channels.fetch(creatorChannelId).catch(() => null);
      if (!exists) {
        await client.db.setup.delete({ where: { creatorChannelId } }).catch(() => {});
      }
    }

    for (const { channelId } of tempChannels) {
      const exists = await guild.channels.fetch(channelId).catch(() => null);
      if (!exists) {
        await client.db.voice.delete({ where: { channelId } }).catch(() => {});
      }
    }
  }
}, CLEANUP_INTERVAL_MS);

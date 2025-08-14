import client from "../client.js";

export default async function (channel) {
  if (channel.type !== 2) return;

  const guildId = channel.guild.id;
  const channelId = channel.id;

  const tempChannel = await client.db.voice.findFirst({
    where: { guildId, channelId },
  });

  if (tempChannel) {
    await client.db.voice.delete({ where: { channelId } }).catch(() => {});
    return;
  }

  const jtcChannel = await client.db.setup.findFirst({
    where: { guildId, creatorChannelId: channelId },
  });

  if (jtcChannel) {
    await client.db.setup
      .delete({ where: { id: jtcChannel.id } })
      .catch(() => {});
  }
}

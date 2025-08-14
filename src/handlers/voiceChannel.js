import client from "../client.js";
import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { isOnCoolDown } from "../lib/util/functions.js";
import { mainColor } from "../lib/util/constants.js";

export default async function (oldState, newState) {
  if (!oldState.channelId && newState.channelId) {
    await handleJoin(newState);
  } else if (oldState.channelId && !newState.channelId) {
    await handleLeave(oldState);
  } else if (oldState.channelId !== newState.channelId) {
    await handleMove(oldState, newState);
  }
}

async function handleJoin(newState, forceCreate = false) {
  const { guild, member, channelId } = newState;
  const guildId = guild.id;

  const setups = await client.db.setup.findMany({ where: { guildId } });
  if (!setups.length) return;

  const jtcConfig = setups.find(
    (entry) => entry.creatorChannelId === channelId
  );
  if (!jtcConfig) return;

  // if (isOnCoolDown(member)) return;

  const existing = await client.db.voice.findFirst({
    where: { guildId, ownerId: member.id },
  });

  if (existing) {
    const isSameJTC = existing.creatorChannelId === channelId;

    if (!forceCreate && isSameJTC) {
      const temp = await guild.channels
        .fetch(existing.channelId)
        .catch(() => null);
      if (temp) return member.voice.setChannel(temp).catch(() => {});
      await client.db.voice
        .delete({ where: { channelId: existing.channelId } })
        .catch(() => {});
    } else {
      await cleanupTempChannel(guildId, existing.channelId);
    }
  }

  const [config, parent] = await Promise.all([
    client.db.config.findFirst({ where: { guildId, userId: member.id } }),
    guild.channels.fetch(jtcConfig.categoryId),
  ]);

  const name = config?.channelName || `${member.displayName}'s Channel`;
  const limit = config?.channelLimit || 0;
  const locked = config?.isLocked ?? false;
  const hidden = config?.isHidden ?? false;

  const deny = [
    ...(locked ? [PermissionFlagsBits.Connect] : []),
    ...(hidden ? [PermissionFlagsBits.ViewChannel] : []),
  ];

  const tempChannel = await guild.channels.create({
    name,
    type: 2,
    parent: parent.id,
    bitrate: 64000,
    userLimit: limit,
  });

  await tempChannel.permissionOverwrites.set([
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.SendMessages,
      ],
    },
    {
      id: guild.roles.everyone.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.SendMessages,
      ].filter((p) => !deny.includes(p)),
      deny,
    },
  ]);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      "## **You've created a temporary voice channel!**\n\nManage your channel settings using the dropdown menus below or run `/voice` commands."
    )
    .setColor(mainColor)
    .setFooter({ text: `Powered by ${client.user.username}` })
    .setTimestamp();

  const panel = await tempChannel.send({ embeds: [embed] });

  await Promise.all([
    client.db.voice.create({
      data: {
        guildId,
        ownerId: member.id,
        channelId: tempChannel.id,
        panelMessage: panel.id,
        creatorChannelId: channelId,
      },
    }),
    config
      ? null
      : client.db.config.create({
          data: {
            guildId,
            userId: member.id,
            channelName: name,
            channelLimit: 0,
            isLocked: false,
            isHidden: false,
          },
        }),
    member.voice.setChannel(tempChannel).catch(() => {}),
  ]);

  if (!tempChannel.members.size) {
    await cleanupTempChannel(guildId, tempChannel.id);
  }
}

async function handleLeave(oldState) {
  const { guild, channelId } = oldState;
  if (!channelId) return;

  const guildId = guild.id;
  const temp = await client.db.voice.findFirst({
    where: { guildId, channelId },
  });
  if (!temp) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== 2 || channel.members.size > 0) return;

  await cleanupTempChannel(guildId, channelId);
}

async function handleMove(oldState, newState) {
  const guildId = newState.guild.id;
  const userId = newState.member.id;

  const setups = await client.db.setup.findMany({ where: { guildId } });
  if (!setups.length) return;

  const to = setups.find((s) => s.creatorChannelId === newState.channelId);

  const existing = await client.db.voice.findFirst({
    where: { guildId, ownerId: userId },
  });

  const switching =
    to && existing && existing.creatorChannelId !== newState.channelId;

  if (to) {
    await handleJoin(newState, switching);
    await handleLeave(oldState);
  } else {
    await handleLeave(oldState);
  }
}

async function cleanupTempChannel(guildId, channelId) {
  const channel = await client.guilds.cache
    .get(guildId)
    ?.channels.fetch(channelId)
    .catch(() => null);
  if (!channel || channel.type !== 2) return;

  await Promise.all([
    channel.delete().catch(() => {}),
    client.db.voice.delete({ where: { channelId } }).catch(() => {}),
  ]);
}

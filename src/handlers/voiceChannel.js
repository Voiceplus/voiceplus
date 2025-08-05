import client from "../client.js";
import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { isOnCoolDown } from "../lib/util/functions.js";
import { mainColor } from "../lib/util/constants.js";

export default async function (oldState, newState) {
  if (!oldState.channelId && newState.channelId) {
    handleJoin(newState);
  } else if (oldState.channelId && !newState.channelId) {
    handleLeave(oldState);
  } else if (oldState.channelId !== newState.channelId) {
    handleMove(oldState, newState);
  }
}

async function handleJoin(newState) {
  const member = newState.member;

  const setup = await client.db.setup.findFirst({
    where: { guildId: newState.guild.id },
  });
  if (!setup) return;

  const { creatorChannelId, categoryId } = setup;

  // Only proceed if the joined channel is the JTC channel
  if (newState.channel.id !== creatorChannelId) return;

  // Cooldown is only checked after verifying it's a JTC join
  if (isOnCoolDown(member)) return;

  const existingVoiceChannel = await client.db.voice.findFirst({
    where: { guildId: newState.guild.id, ownerId: member.id },
  });

  if (existingVoiceChannel) {
    const existingChannel = await newState.guild.channels
      .fetch(existingVoiceChannel.channelId)
      .catch(() => null);

    if (existingChannel) {
      await member.voice.setChannel(existingChannel.id).catch(() => {});
      return;
    }

    try {
      await client.db.voice.delete({
        where: { channelId: existingVoiceChannel.channelId },
      });
    } catch {}
  }

  const [userData, category] = await Promise.all([
    client.db.config.findFirst({
      where: {
        guildId: newState.guild.id,
        userId: member.id,
      },
    }),
    newState.guild.channels.fetch(categoryId),
  ]);

  const voiceChannel = await newState.guild.channels.create({
    name: userData?.channelName || `${member.displayName}'s Channel`,
    type: 2,
    parent: category.id,
    bitrate: 64000,
    userLimit: userData?.channelLimit || 0,
    nsfw: false,
    rateLimitPerUser: 0,
  });

  const isLocked = userData?.isLocked ?? false;
  const isHidden = userData?.isHidden ?? false;
  const everyoneRole = newState.guild.roles.everyone;

  const denyPermissions = [];
  if (isLocked) denyPermissions.push(PermissionFlagsBits.Connect);
  if (isHidden) denyPermissions.push(PermissionFlagsBits.ViewChannel);

  const existingOverwrites = voiceChannel.permissionOverwrites.cache.filter(
    (perm) => perm.id !== member.id && perm.id !== everyoneRole.id
  );

  const newOverwrites = [
    ...existingOverwrites.map((perm) => ({
      id: perm.id,
      allow: perm.allow.toArray(),
      deny: perm.deny.toArray(),
      type: perm.type,
    })),
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.SendMessages,
      ],
    },
    {
      id: everyoneRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.SendMessages,
      ].filter((perm) => !denyPermissions.includes(perm)),
      deny: denyPermissions,
    },
  ];

  await voiceChannel.permissionOverwrites.set(newOverwrites);

  const promises = [];

  if (!userData) {
    promises.push(
      client.db.config.create({
        data: {
          guildId: newState.guild.id,
          userId: member.id,
          channelName: voiceChannel.name,
          channelLimit: 0,
          isLocked: false,
          isHidden: false,
        },
      })
    );
  }

  const voicePanelEmbed = new EmbedBuilder()
    .setAuthor({
      name: client.user.username,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(
      "## **You've created a temporary voice channel!**\n\n" +
        "Manage your channel settings and permissions easily using the dropdown menus below.\n\n" +
        "You can also run the `/voice` commands to configure temporary voice channels."
    )
    .setColor(mainColor)
    .setFooter({ text: `Powered by ${client.user.username}` })
    .setTimestamp();

  const panelMessage = await voiceChannel.send({
    embeds: [voicePanelEmbed],
    // components: [...]
  });

  promises.push(
    client.db.voice.create({
      data: {
        guildId: newState.guild.id,
        ownerId: member.id,
        channelId: voiceChannel.id,
        panelMessage: panelMessage.id,
      },
    }),
    member.voice.channelId
      ? member.voice.setChannel(voiceChannel.id).catch(() => {})
      : Promise.resolve()
  );

  await Promise.all(promises);

  if (voiceChannel.members.size === 0) {
    await Promise.all([
      voiceChannel.delete().catch(() => {}),
      (async () => {
        try {
          await client.db.voice.delete({
            where: { channelId: voiceChannel.id },
          });
        } catch {}
      })(),
    ]);
  }
}

async function handleLeave(oldState) {
  const { guild, channelId } = oldState;
  if (!channelId) return;

  const voiceChannelData = await client.db.voice.findFirst({
    where: { guildId: guild.id, channelId },
  });
  if (!voiceChannelData) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== 2) return;

  if (channel.members.size === 0) {
    await Promise.all([
      channel.delete().catch(() => {}),
      (async () => {
        try {
          await client.db.voice.delete({ where: { channelId } });
        } catch (err) {}
      })(),
    ]);
  }
}

async function handleMove(oldState, newState) {
  const setup = await client.db.setup.findFirst({
    where: { guildId: newState.guild.id },
  });
  if (!setup) return;

  const { creatorChannelId } = setup;
  const userId = newState.member.id;
  const isJoiningJTC = newState.channelId === creatorChannelId;

  const existingVoiceChannel = await client.db.voice.findFirst({
    where: { guildId: newState.guild.id, ownerId: userId },
  });

  if (isJoiningJTC) {
    if (existingVoiceChannel) {
      const existingChannel = await newState.guild.channels
        .fetch(existingVoiceChannel.channelId)
        .catch(() => null);

      if (existingChannel) {
        if (isOnCoolDown(newState.member)) {
          await existingChannel.delete().catch(() => {});
          try {
            await client.db.voice.delete({
              where: { channelId: existingVoiceChannel.channelId },
            });
          } catch {}
          return;
        }

        await newState.member.voice
          .setChannel(existingChannel.id)
          .catch(() => {});

        if (oldState.channelId) {
          const oldVoiceChannelData = await client.db.voice.findFirst({
            where: {
              guildId: oldState.guild.id,
              channelId: oldState.channelId,
            },
          });
          if (oldVoiceChannelData) {
            const oldChannel = await oldState.guild.channels
              .fetch(oldState.channelId)
              .catch(() => null);
            if (
              oldChannel &&
              oldChannel.type === 2 &&
              oldChannel.members.size === 0
            ) {
              await Promise.all([
                oldChannel.delete().catch(() => {}),
                client.db.voice.delete({
                  where: { channelId: oldState.channelId },
                }),
              ]);
            }
          }
        }
        return;
      } else {
        try {
          await client.db.voice.delete({
            where: { channelId: existingVoiceChannel.channelId },
          });
        } catch {}
      }
    }

    await handleJoin(newState);

    if (oldState.channelId) {
      const oldVoiceChannelData = await client.db.voice.findFirst({
        where: { guildId: oldState.guild.id, channelId: oldState.channelId },
      });
      if (oldVoiceChannelData) {
        const oldChannel = await oldState.guild.channels
          .fetch(oldState.channelId)
          .catch(() => null);
        if (
          oldChannel &&
          oldChannel.type === 2 &&
          oldChannel.members.size === 0
        ) {
          await Promise.all([
            oldChannel.delete().catch(() => {}),
            (async () => {
              try {
                await client.db.voice.delete({
                  where: { channelId: oldState.channelId },
                });
              } catch {}
            })(),
          ]);
        }
      }
    }
  } else {
    await handleLeave(oldState);
  }
}

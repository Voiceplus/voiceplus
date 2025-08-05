import { MessageFlags, PermissionFlagsBits } from "discord.js";
import Select from "../lib/structs/Select.js";
import {
  readComplexCustomId,
  checkBotPermissions,
} from "../lib/util/functions.js";

class voicePanel extends Select {
  constructor() {
    super({
      name: "voicePanel",
    });
  }

  async run(interaction) {
    const { option } = readComplexCustomId(interaction.customId);
    const selectedValue = interaction.values[0];
    if (!option) return;

    const permissionMap = {
      settings: {
        name: {
          clientPermissions: [PermissionFlagsBits.ManageChannels],
        },
      },
      permissions: {
        transfer: {
          clientPermissions: [
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageRoles,
          ],
        },
      },
    };

    const permsForOption = permissionMap[option]?.[selectedValue];

    const missingPerms = (permsForOption.clientPermissions ?? []).filter(
      (perm) => !interaction.guild.members.me.permissions.has(perm)
    );

    if (missingPerms.length > 0) {
      if (await checkBotPermissions(interaction, missingPerms)) return;
    }

    const setup = await this.client.db.setup.findFirst({
      where: { guildId: interaction.guildId },
    });

    if (!setup) {
      return interaction.reply({
        content: `No join-to-create voice channels are set up in this server.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const voiceChannel = interaction.member.voice.channel;

    const tempVoiceChannel = voiceChannel
      ? await this.client.db.voice.findFirst({
          where: {
            guildId: interaction.guildId,
            channelId: voiceChannel.id,
          },
        })
      : null;

    if (!tempVoiceChannel) {
      const allSetups = await this.client.db.setup.findMany({
        where: { guildId: interaction.guildId },
      });

      const channelsList = allSetups
        .map((s) => `<#${s.creatorChannelId}>`)
        .join("\n");

      return interaction.reply({
        content: `You're not in a temporary voice channel.\nJoin one of the following to create one:\n${channelsList}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // you must be owner...

    if (option === "settings") {
      switch (selectedValue) {
        case "name":
          return interaction.reply({
            content: "You selected to change the channel name!",
            flags: MessageFlags.Ephemeral,
          });
      }
    } else {
      if (option === "permissions") {
        switch (selectedValue) {
          case "transfer":
            return interaction.reply({
              content: "You selected to transfer ownership!",
              flags: MessageFlags.Ephemeral,
            });
        }
      }
    }
  }
}

export default voicePanel;

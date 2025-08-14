import {
  ModalBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from "discord.js";
import Select from "../lib/structs/Select.js";
import {
  readComplexCustomId,
  checkBotPermissions,
  voiceComponents,
  createComplexCustomId,
} from "../lib/util/functions.js";

const PERMISSIONS = {
  settings: {
    name: [PermissionFlagsBits.ManageChannels],
    limit: [],
    bitrate: [],
    nsfw: [],
    claim: [],
  },
  permissions: {
    transfer: [
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
    ],
  },
};

export default class VoicePanel extends Select {
  constructor() {
    super({ name: "voicePanel" });
  }

  async run(interaction) {
    const { option } = readComplexCustomId(interaction.customId);
    const value = interaction.values[0];
    if (!option || !value) return;

    const required = PERMISSIONS[option]?.[value] ?? [];
    const missing = required.filter(
      (perm) => !interaction.guild.members.me.permissions.has(perm)
    );

    if (missing.length && (await checkBotPermissions(interaction, missing)))
      return;

    const setup = await this.client.db.setup.findFirst({
      where: { guildId: interaction.guildId },
    });

    if (!setup) {
      await interaction.update({
        components: voiceComponents(),
      });

      return interaction.followUp({
        content: `No join-to-create voice channels are set up in this server.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const userChannel = interaction.member.voice.channel;
    const tempVoice = userChannel
      ? await this.client.db.voice.findFirst({
          where: {
            guildId: interaction.guildId,
            channelId: userChannel.id,
          },
        })
      : null;

    if (!tempVoice) {
      const setups = await this.client.db.setup.findMany({
        where: { guildId: interaction.guildId },
      });

      const list = setups.map((s) => `<#${s.creatorChannelId}>`).join("\n");

      await interaction.update({
        components: voiceComponents(),
      });

      return interaction.followUp({
        content: `You're not in a temporary voice channel.\nJoin one of the following to create one:\n${list}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (value !== "claim" && tempVoice.ownerId !== interaction.user.id) {
      await interaction.update({
        components: voiceComponents(),
      });

      return interaction.followUp({
        content: `Only the owner of this temporary voice channel can do that.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.update({
      components: voiceComponents(),
    });

    if (option === "settings") {
      switch (value) {
        case "name": {
          const modal = new ModalBuilder()
            .setTitle("Voice+")
            .setCustomId(createComplexCustomId("voicePanel", "name", null));

          const channelName = new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setLabel("Choose a name for your voice channel")
              .setPlaceholder("Leave blank to reset the name")
              .setCustomId("name")
              .setMaxLength(32)
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          );

          modal.addComponents(channelName);
          return interaction.showModal(modal);
        }
      }
    }
  }
}

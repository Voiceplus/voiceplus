import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import Button from "../lib/structs/Button.js";
import {
  readComplexCustomId,
  getGuildLanguage,
} from "../lib/util/functions.js";

class setupButton extends Button {
  constructor() {
    super({
      name: "setup",
      clientPermissions: [
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageWebhooks,
      ],
      userPermissions: [PermissionFlagsBits.ManageChannels],
    });
  }

  async run(interaction) {
    const lang = await getGuildLanguage(interaction.guild.id);

    const { option } = readComplexCustomId(interaction.customId);
    if (!option) return;

    // add limit

    if (option === "setup_voice") {
      const category = await interaction.guild.channels.create({
        name: "Voice+",
        type: 4,
        permissionOverwrites: [
          {
            id: interaction.client.user.id,
            allow: [
              "ViewChannel",
              "ManageChannels",
              "ManageWebhooks",
              "Connect",
              "Speak",
              "MoveMembers",
              "SendMessages",
              "EmbedLinks",
            ],
          },
        ],
      });

      const voiceChannel = await interaction.guild.channels.create({
        name: "Join To Create",
        type: 2,
        parent: category.id,
        bitrate: 64000,
        userLimit: 0,
        nsfw: false,
        rateLimitPerUser: 0,
      });

      await this.client.db.setup.create({
        data: {
          guildId: interaction.guildId,
          creatorChannelId: voiceChannel.id,
          categoryId: category.id,
        },
      });

      const embed = new EmbedBuilder()
        .setDescription(
          this.client.t("info_setup", lang, {
            val1: `<#${voiceChannel.id}>`,
          })
        )
        .setImage(
          "https://images-ext-1.discordapp.net/external/0ny509-on-dBGM5ttuqg39eY5g8fK_nabWSRVweCmRw/https/tempvoice.xyz/embeds/discord/copyright-success.png?format=webp&quality=lossless&width=1867&height=123"
        )
        .setFooter({
          text: "Voice+ | Join To Create",
        });

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export default setupButton;

import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import Command from "../../lib/structs/Command.js";
import { mainColor } from "../../lib/util/constants.js";
import { createComplexCustomId } from "../../lib/util/functions.js";
import { getGuildLanguage } from "../../lib/util/functions.js";

class SetupCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription(
          "Setup TempVoice easily with an assistant within seconds"
        ),
      userPermissions: PermissionFlagsBits.ManageGuild,
    });
  }

  async run(interaction) {
    const lang = await getGuildLanguage(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setDescription(this.client.t("setup", lang))
      .setColor(mainColor)
      .setImage(
        "https://images-ext-1.discordapp.net/external/tVdA5WNzXYKAmUZmDba0vZ8eQ3VR3J1s33wC0qDnnDM/https/tempvoice.xyz/media/guides/setup/steps.png?format=webp&quality=lossless&width=1867&height=388"
      );

    const setupButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Danger)
      .setLabel("Setup Voice+")
      .setCustomId(createComplexCustomId("setup", "setup_voice"));

    const actionRow = new ActionRowBuilder().addComponents(setupButton);

    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      // ephemeral: true,
    });
  }
}

export default SetupCommand;

import {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from "discord.js";
import Command from "../../lib/structs/Command.js";
import { createComplexCustomId, voiceComponents } from "../../lib/util/functions.js";

class AvatarCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder().setName("test").setDescription("test."),
    });
  }

  async run(interaction) {
    const voicePanelSettings = new StringSelectMenuBuilder()
      .setCustomId(createComplexCustomId("voicePanel", "settings"))
      .setPlaceholder("Channel Settings")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Name")
          .setDescription("Change the channel name.")
          .setValue("change_name")
      );

    const voicePanelSettingsRow = new ActionRowBuilder().addComponents(
      voicePanelSettings
    );

    const voicePanelPermissions = new StringSelectMenuBuilder()
      .setCustomId(createComplexCustomId("voicePanel", "permissions"))
      .setPlaceholder("Channel Permissions")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Transfer")
          .setDescription("Transfer ownership.")
          .setValue("transfer"),
      );

    const voicePanelPermissionsRow = new ActionRowBuilder().addComponents(
      voicePanelPermissions
    );

    await interaction.reply({
      content: "fish is a niggaas",
      components: voiceComponents(),
    });
  }
}

export default AvatarCommand;

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import Command from "../../lib/structs/Command.js";
import { guildLanguageCache } from "../../lib/util/functions.js";

class LanguageCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName("language")
        .setDescription("Change the guild language")
        .addStringOption((option) =>
          option
            .setName("lang")
            .setDescription("Select the language")
            .setRequired(true)
            .addChoices(
              { name: "English", value: "en" },
              { name: "Français", value: "fr" }
            )
        ),
      userPermissions: PermissionFlagsBits.ManageGuild,
    });
  }

  async run(interaction) {
    const lang = interaction.options.getString("lang");

    // Save to DB - update guild's language
    await this.client.db.guild.update({
      where: { id: interaction.guild.id },
      data: { language: lang },
    });

    await interaction.reply({
      content: `Language has been set to ${
        lang === "en" ? "English" : "Français"
      }.`,
    });

    guildLanguageCache.delete(interaction.guild.id); // forces getGuildLanguage to re-fetch next time

  }
}

export default LanguageCommand;

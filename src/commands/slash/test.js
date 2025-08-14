import { SlashCommandBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";
import { voiceComponents } from "../../lib/util/functions.js";

class AvatarCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder().setName("test").setDescription("test."),
    });
  }

  async run(interaction) {
    await interaction.reply({
      content: "fish is a niggaas",
      components: voiceComponents(),
    });
  }
}

export default AvatarCommand;

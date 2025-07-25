import { SlashCommandBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";

class SetupCommand extends Command {
  constructor() {
    super();
    this.data = new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup your own Join To Create channel.");
  }

  async run(interaction) {
    interaction.reply("shut the fuck up nigga")
  }
}

export default SetupCommand;

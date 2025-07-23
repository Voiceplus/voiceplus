import { SlashCommandBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";

class AvatarCommand extends Command {
  constructor() {
    super();
    this.data = new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup your own Join To Create channel.") 
      .addUserOption((option) =>
        option.setName("user").setDescription("The user to get the avatar of.")
      );

      this.allowDM = true;
  }

  async run(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    return interaction.reply(user.displayAvatarURL({ size: 4096 }));
  }
}

export default AvatarCommand;

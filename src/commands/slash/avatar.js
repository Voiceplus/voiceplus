import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";

class AvatarCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Get a users avatar.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to get the avatar of.")
        ),
    });
  }

  async run(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    return interaction.reply(user.displayAvatarURL({ size: 4096 }));
  }
}

export default AvatarCommand;

import Command from "../../lib/structs/Command.js";
import { Colors, EmbedBuilder } from "discord.js";

class BioCommand extends Command {
  constructor() {
    super({
      name: "bio",
      description: "Edit your staff bio on the website.",
      args: "<bio>",
      allowDM: true,
    });
  }

  async run(message, args) {
    if (args.length === 0) throw "You must provide a bio.";

    const staffData = await this.client.db.staff.findUnique({
      where: { userId: message.author.id },
    });

    if (!staffData) {
      const embed = new EmbedBuilder()
        .setDescription("You're not in the staff database.")
        .setColor(Colors.Red);
      return message.reply({ embeds: [embed] });
    }

    const newBio = args.join(" ");

    if (newBio.length > 250) throw "Your bio cannot exceed 250 characters.";

    await this.client.db.staff.update({
      where: { userId: message.author.id },
      data: { bio: newBio },
    });

    const embed = new EmbedBuilder()
      .setDescription("Updated your bio on the website.")
      .setColor(Colors.Green);

    return message.reply({ embeds: [embed] });
  }
}

export default BioCommand;

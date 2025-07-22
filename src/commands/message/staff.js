import { Colors, GuildMember, EmbedBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";
import { getUser, getMember } from "../../lib/util/functions.js";

class GrantCommand extends Command {
  constructor() {
    super();
    this.name = "staff";
    this.description = "Grant or remove staff permissions from a user.";
    this.args = "[user] [position] [--r]";
  }

  async run(message, args) {
    if (args.length === 0) {
      throw "You must provide a user.";
    }

    const removeFlagIndex = args.indexOf("--r");
    const isRemove = removeFlagIndex !== -1;
    if (isRemove) args.splice(removeFlagIndex, 1);

    const user =
      (await getMember(message.guild, args[0])) ?? (await getUser(args[0]));
    if (!user) throw "Invalid user.";

    const position = args.join(" ") || "Moderator";

    const embed = new EmbedBuilder();

    if (isRemove) {
      const isStaff = await this.client.db.staff.findUnique({
        where: { userId: user.id },
      });

      if (!isStaff) {
        embed
          .setColor(Colors.Red)
          .setDescription(`${user} is not a staff member.`);
        return message.reply({ embeds: [embed] });
      }

      await this.client.db.staff.delete({
        where: { userId: user.id },
      });

      embed
        .setColor(Colors.Green)
        .setDescription(`Removed **Staff** permissions from ${user}`);

      if (user instanceof GuildMember) {
        await user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription(`Your **Staff Permissions** have been revoked.`),
          ],
        });
      }

      return message.reply({ embeds: [embed] });
    } else {
      const isStaff = await this.client.db.staff.findUnique({
        where: { userId: user.id },
      });

      if (isStaff) {
        embed
          .setColor(Colors.Red)
          .setDescription(`${user} is already a staff member.`);
        return message.reply({ embeds: [embed] });
      }

      await this.client.db.staff.create({
        data: {
          userId: user.id,
          position,
          bio: "User has not provided a bio yet.",
        },
      });

      embed
        .setColor(Colors.Green)
        .setDescription(`Granted **Staff** permissions to **${user}**`);

      if (user instanceof GuildMember) {
        await user.send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Green)
              .setDescription(`You've been granted **Staff Permissions**`),
          ],
        });
      }

      return message.reply({ embeds: [embed] });
    }
  }
}

export default GrantCommand;

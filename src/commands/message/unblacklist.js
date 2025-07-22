import { Colors, EmbedBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";
import { getUser, getMember, checkBlacklisted } from "../../lib/util/functions.js";

class UnblacklistCommand extends Command {
  constructor() {
    super();
    this.name = "unblacklist";
    this.description = "Remove a user or a guild from the blacklist.";
    this.args = "[--guild] <ID or @mention>";
    this.aliases = ["ubl"];
    this.devOnly = true;
  }

  async run(message, args) {
    if (args.length === 0) throw "You must provide a user or guild ID.";

    const isGuild = args.includes("--guild");
    if (isGuild) args.splice(args.indexOf("--guild"), 1);

    const embed = new EmbedBuilder();

    if (isGuild) {
      const guildId = args[0];

      const isBlacklisted = await checkBlacklisted(guildId);
      if (!isBlacklisted?.guildId) {
        embed
          .setColor(Colors.Red)
          .setDescription(`Guild \`${guildId}\` is not blacklisted.`);
        return message.reply({ embeds: [embed] });
      }

      await this.client.db.blacklist.delete({
        where: { id: isBlacklisted.id },
      });

      embed
        .setColor(Colors.Green)
        .setDescription(`Removed **guild** \`${guildId}\` from blacklist.`);
      return message.reply({ embeds: [embed] });
    } else {
      const user =
        (await getMember(message.guild, args[0])) ?? (await getUser(args[0]));

      if (!user) throw "Invalid user.";

      const isBlacklisted = await checkBlacklisted(user.id);
      if (!isBlacklisted?.userId) {
        embed
          .setColor(Colors.Red)
          .setDescription(`User ${user} is not blacklisted.`);
        return message.reply({ embeds: [embed] });
      }

      await this.client.db.blacklist.delete({
        where: { id: isBlacklisted.id },
      });

      embed
        .setColor(Colors.Green)
        .setDescription(`Removed **user** ${user} from blacklist.`);
      return message.reply({ embeds: [embed] });
    }
  }
}

export default UnblacklistCommand;

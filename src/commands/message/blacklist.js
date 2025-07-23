import { Colors, EmbedBuilder, GuildMember } from "discord.js";
import Command from "../../lib/structs/Command.js";
import {
  getUser,
  getMember,
  checkBlacklisted,
} from "../../lib/util/functions.js";

class BlacklistCommand extends Command {
  constructor() {
    super({
      name: "blacklist",
      description: "Blacklist a user or a guild from using the bot.",
      args: "[--guild] <ID or @mention> [reason]",
      aliases: ["bl"],
      devOnly: true,
      allowDM: true,
    });
  }

  async run(message, args) {
    if (args.length === 0) throw "You must provide a user or guild ID.";

    const isGuild = args.includes("--guild");
    if (isGuild) args.splice(args.indexOf("--guild"), 1);

    const reason = args.slice(1).join(" ") || "No reason provided.";
    const embed = new EmbedBuilder();

    if (isGuild) {
      const guildId = args[0];

      const isBlacklisted = await checkBlacklisted(guildId);
      if (isBlacklisted?.guildId === guildId) {
        embed
          .setColor(Colors.Red)
          .setDescription(`Guild \`${guildId}\` is already blacklisted.`);
        return message.reply({ embeds: [embed] });
      }

      await this.client.db.blacklist.create({
        data: { guildId, reason },
      });

      embed
        .setColor(Colors.Green)
        .setDescription(`Blacklisted **guild** \`${guildId}\``);
      return message.reply({ embeds: [embed] });
    } else {
      const user =
        (await getMember(message.guild, args[0])) ?? (await getUser(args[0]));

      if (!user) throw "Invalid user.";

      const isBlacklisted = await checkBlacklisted(user.id);
      if (isBlacklisted?.userId === user.id) {
        embed
          .setColor(Colors.Red)
          .setDescription(`User ${user} is already blacklisted.`);
        return message.reply({ embeds: [embed] });
      }

      await this.client.db.blacklist.create({
        data: { userId: user.id, reason },
      });

      embed
        .setColor(Colors.Green)
        .setDescription(`Blacklisted **user** ${user}`);
      return message.reply({ embeds: [embed] });
    }
  }
}

export default BlacklistCommand;

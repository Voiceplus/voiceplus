import Command from "../../lib/structs/Command.js";
import { EmbedBuilder, GuildMember } from "discord.js";
import { checkBlacklisted } from "../../lib/util/functions.js";
import { mainColor } from "../../lib/util/constants.js";
import { getMember, getUser } from "../../lib/util/functions.js";

class LookupCommand extends Command {
  constructor() {
    super({
      name: "lookup",
      description: "Look up detailed info about a user.",
      usage: "<user>",
    });
  }

  async run(message, args) {
    const user =
      args.length > 0
        ? (await getMember(message.guild, args[0])) ?? (await getUser(args[0]))
        : message.member;
    if (!user) throw "Invalid user.";

    const userUser = user instanceof GuildMember ? user.user : user;

    const createdStr = Math.floor(userUser.createdTimestamp / 1000);
    const joinedStr =
      user instanceof GuildMember
        ? Math.floor(user.joinedTimestamp / 1000)
        : null;

    const staffData = await this.client.db.staff.findUnique({
      where: { userId: user.id },
    });

    const ownedGuilds = this.client.guilds.cache.filter(
      (g) => g.ownerId === userUser.id
    ).size;

    const blacklistData = await checkBlacklisted(user.id);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${userUser.globalName ?? userUser.username}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setColor(mainColor)
      .addFields(
        {
          name: "Username",
          value: `${userUser.username}${
            userUser.discriminator !== "0" ? `#${userUser.discriminator}` : ""
          }`,
          inline: true,
        },
        {
          name: "User ID",
          value: `${user.id}`,
          inline: true,
        },
        {
          name: "Created",
          value: `<t:${createdStr}> (<t:${createdStr}:R>)`,
          inline: true,
        },
        {
          name: "Bot?",
          value: `${
            userUser.bot
              ? `Yes. [Click to invite](https://discord.com/oauth2/authorize?client_id=${user.id}&permissions=2048&integration_type=0&scope=bot+applications.commands).`
              : "No"
          }`,
          inline: true,
        },
        { name: "Owner In", value: `${ownedGuilds}`, inline: true }
      );

    if (joinedStr) {
      embed.addFields({
        name: "Joined",
        value: `<t:${joinedStr}> (<t:${joinedStr}:R>)`,
        inline: true,
      });
    }

    if (staffData) {
      embed.addFields(
        {
          name: "Position",
          value: staffData.position || "Unknown",
          inline: true,
        },
        { name: "Bio", value: staffData.bio || "No bio provided" }
      );
    }

    if (blacklistData) {
      embed.addFields({
        name: "Blacklisted",
        value: `**Reason:** ${blacklistData.reason || "No reason provided"}`,
      });
    }

    return message.reply({ embeds: [embed] });
  }
}

export default LookupCommand;

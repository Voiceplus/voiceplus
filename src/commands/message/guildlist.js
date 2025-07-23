import Command from "../../lib/structs/Command.js";
import { EmbedBuilder } from "discord.js";
import { mainColor } from "../../lib/util/constants.js";

class GuildlistCommand extends Command {
  constructor() {
    super({
      name: "guildlist",
      description: "Get a list of all guilds the bot is in.",
      args: "",
      allowDM: true,
      aliases: ["gl", "guilds"],
    });
  }

  async run(message) {
    const guilds = this.client.guilds.cache;
    const embed = new EmbedBuilder()
      .setColor(mainColor)
      .setAuthor({
        name: this.client.user.username,
        iconURL: this.client.user.displayAvatarURL(),
      })
      .addFields({
        name: "Guilds",
        value: guilds
          .map(
            (guild) =>
              `${guild.name} (${guild.id}) - ${guild.memberCount} members`
          )
          .join("\n"),
      });

    message.channel.send({ embeds: [embed] });
  }
}

export default GuildlistCommand;

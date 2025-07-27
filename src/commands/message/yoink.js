import Command from "../../lib/structs/Command.js";
import { Colors, EmbedBuilder, ChannelType } from "discord.js";

class YoinkCommand extends Command {
  constructor() {
    super({
      name: "yoink",
      description: "Yoink a temporary voice channel.",
      args: "<channelId>",
    });
  }

  async run(message, args) {
    if (args.length === 0)
      throw "You must provide a temporary voice channel ID.";
    const channelId = args[0];

    const voiceData = await this.client.db.voice.findUnique({
      where: { channelId },
    });

    if (!voiceData)
      throw "You must provide a valid temporary voice channel to Yoink.";

    if (voiceData.ownerId === message.author.id)
      throw "You already own this temporary voice channel.";

    const existingOwned = await this.client.db.voice.findFirst({
      where: {
        guildId: message.guild.id,
        ownerId: message.author.id,
      },
    });

    if (existingOwned) {
      throw "You already own a temporary voice channel in this server.";
    }

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice)
      throw "The provided channel ID is not a valid voice channel in this server.";

    await this.client.db.voice.update({
      where: { channelId },
      data: { ownerId: message.author.id },
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(`Granted you <#${channelId}>, **YOINK**!`);

    return message.reply({ embeds: [embed] });
  }
}

export default YoinkCommand;

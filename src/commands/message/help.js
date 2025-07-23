import { EmbedBuilder } from "discord.js";
import Command from "../../lib/structs/Command.js";
import { mainColor } from "../../lib/util/constants.js";
import { getDevIds } from "../../lib/util/functions.js";

class HelpCommand extends Command {
  constructor() {
    super({
      name: "help",
      description: "Get a list of all commands or get help on a certain command.",
      args: "[command]",
      allowDM: true,
    });
  }

  async run(message, args) {
    const prefix = process.env.PREFIX;
    const devIds = getDevIds();
    const isDev = devIds.includes(message.author.id);

    if (args.length > 0) {
      const commandName = args[0];
      const command =
        this.client.commands.message.get(commandName) ||
        this.client.commands.message.get(this.client.aliases.get(commandName));

      if (command?.devOnly && !isDev) {
        throw "No command with that name or alias exists.";
      }

      if (!command) {
        if (!message.inGuild())
          throw "No command with that name or alias exists.";
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: this.client.user.username,
          iconURL: this.client.user.displayAvatarURL(),
        })
        .setTitle(command.name)
        .setColor(mainColor);

      let description = `${command.description}\n\n`;
      if (command.slashOnly)
        description +=
          "***• This command is only available via slash commands!***\n";
      if (command.args)
        description += `**•** Usage: \`${command.args
          .map((way) => `${prefix}${command.name} ${way}`)
          .join("\n")}\`\n`;
      if (command.aliases && command.aliases.length > 0)
        description += `**•** Aliases: ${command.aliases
          .map((alias) => `\`${alias}\``)
          .join(", ")}\n`;
      if (command.allowDM)
        description += `**•** *This command can be ran in DM's.*`;

      embed.setDescription(description);

      return message.reply({ embeds: [embed] });
    }

    const commands = [...this.client.commands.message.values()].filter(
      (cmd) => !cmd.devOnly || (cmd.devOnly && isDev)
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: this.client.user.username,
        iconURL: this.client.user.displayAvatarURL(),
      })
      .setTitle("Command List")
      .setColor(mainColor)
      .setDescription(commands.map((cmd) => `\`${cmd.name}\``).join(", "))
      .setFooter({ text: `Prefix: ${prefix}` });

    return message.reply({ embeds: [embed] });
  }
}

export default HelpCommand;

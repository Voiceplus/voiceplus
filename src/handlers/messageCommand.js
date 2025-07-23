import { EmbedBuilder, Colors } from "discord.js";
import {
  getStaff,
  getDevIds,
} from "../lib/util/functions.js";
import { unresolvedGuilds } from "../handlers/chatInputCommand.js";
import client from "../client.js";

export default async function (message) {
  if (message.author.bot || !message.content) return;

  let prefix = process.env.PREFIX;
  const devIds = getDevIds();

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  let commandName = args.shift()?.toLowerCase();

  const command =
    client.commands.message.get(commandName) ||
    client.commands.message.get(client.aliases.get(commandName));

  if (!command) return;

  if (message.inGuild()) {
    // In a guild: check staff or dev
    const staffUserIds = await getStaff();
    const isStaff = staffUserIds.includes(message.author.id);
    const isDev = devIds.includes(message.author.id);

    if (!isStaff && !isDev) return; // silently ignore non-staff/dev in guild
  } else {
    // In DM: check allowDM and staff/dev
    const staffUserIds = await getStaff();
    const isStaff = staffUserIds.includes(message.author.id);
    const isDev = devIds.includes(message.author.id);

    if (!command.allowDM) {
      return message.reply("That command must be run in a server.");
    }

    if (!isStaff && !isDev) {
      return message.reply("You don’t have permission to use commands in DMs.");
    }
  }

  if (command.devOnly && !devIds.includes(message.author.id)) return;

  commandName = command.name;

  if (command.clientPermissions) {
    const me = message.guild?.members.me;
    if (!me?.permissions.has(command.clientPermissions)) {
      const missingPerms = command.clientPermissions
        .toArray()
        .map((p) => p.replace(/([a-z])([A-Z])/g, "$1 $2"))
        .join("`, `");

      return message.reply(
        `I don’t have the required permissions to complete this command.\nMissing: \`${missingPerms}\``
      );
    }
  }

  if (command.guildResolve) {
    const key = `${message.guildId} ${commandName}`;
    if (unresolvedGuilds.has(key)) {
      return message.reply(
        "Another process of this command is currently running. Please wait for it to finish before running this command."
      );
    }

    unresolvedGuilds.add(key);
  }

  try {
    await command.run(message, args);

    if (command.guildResolve) {
      unresolvedGuilds.delete(`${message.guildId} ${commandName}`);
    }
  } catch (e) {
    if (command.guildResolve) {
      unresolvedGuilds.delete(`${message.guildId} ${commandName}`);
    }

    console.error(e);

    if (typeof e !== "string") {
      return;
    }

    const embed = new EmbedBuilder().setColor(Colors.Red).setDescription(e);
    return message.reply({ embeds: [embed] });
  }
}

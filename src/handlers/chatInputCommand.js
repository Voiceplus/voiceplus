import { EmbedBuilder, Colors, MessageFlags } from "discord.js";
import client from "../client.js";
import { checkBlacklisted, getDevIds } from "../lib/util/functions.js";

export const unresolvedGuilds = new Set();

export default async function (interaction) {
  const userBlacklist = await checkBlacklisted(interaction.user.id);
  if (userBlacklist) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setAuthor({
        name: `You are blacklisted from ${client.user.username}!`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setDescription(
        `You have been indefinitely blacklisted from using ${client.user.username}. If this was a false blacklist, please contact our team by joining our [Support Server](https://discord.gg/xenabot).`
      )
      .addFields(
        { name: "Reason", value: userBlacklist.reason },
        {
          name: "Date",
          value: `<t:${Math.floor(
            new Date(userBlacklist.date).getTime() / 1000
          )}>`,
        }
      );

    if (!userBlacklist.sent) {
      try {
        await interaction.member?.send({ embeds: [embed] });
      } catch (error) {
        console.error("Failed to DM user about blacklist:", error);
      }

      await client.db.blacklist.updateMany({
        where: {
          userId: interaction.user.id,
          guildId: null,
        },
        data: { sent: true },
      });
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }

  if (interaction.guild) {
    const guildBlacklist = await checkBlacklisted(interaction.guild.id);

    if (guildBlacklist) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setAuthor({
          name: `Guild blacklisted from ${client.user.username}!`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(
          `This server has been indefinitely blacklisted from using ${client.user.username}. If this was a false blacklist, please contact our team by joining our [Support Server](https://discord.gg/voiceplus).`
        )
        .addFields(
          { name: "Reason", value: guildBlacklist.reason },
          {
            name: "Date",
            value: `<t:${Math.floor(
              new Date(guildBlacklist.date).getTime() / 1000
            )}>`,
          }
        );

      if (!guildBlacklist.sent) {
        await client.db.blacklist.updateMany({
          where: {
            userId: null,
            guildId: interaction.guild.id,
          },
          data: { sent: true },
        });

        try {
          await interaction.channel.send({ embeds: [embed] });
        } catch (error) {
          console.error(error);
        }
      }

      await interaction.guild.leave();
      return;
    }
  }

  const command = client.commands.slash.get(interaction.commandName);
  if (!command) {
    if (!interaction.inCachedGuild()) {
      return interaction.reply({
        content: "Unknown Command",
        flags: MessageFlags.Ephemeral,
      });
    }
    return;
  }

  const devIds = getDevIds();
  if (command.devOnly && !devIds.includes(interaction.user.id)) {
    return interaction.reply({
      content: "You must be a developer to use this command.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!interaction.inCachedGuild() && !command.allowDM) {
    return interaction.reply({
      content: "That command must be ran in a guild.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (command.clientPermissions) {
    const botPerms = interaction.guild?.members?.me?.permissions;
    if (!botPerms?.has(command.clientPermissions)) {
      const missing = command.clientPermissions
        .toArray()
        .map((p) => p.replace(/([a-z])([A-Z])/g, "$1 $2"))
        .join("`, `");

      return interaction.reply({
        content: `I don't have the required permissions to complete this command.\nMissing: \`${missing}\``,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (command.guildResolve) {
    const key = `${interaction.guildId} ${interaction.commandName}`;
    if (unresolvedGuilds.has(key)) {
      return interaction.reply({
        content:
          "Another process of this command is currently running. Please wait for it to finish before running this command.",
        ephemeral: true,
      });
    }

    unresolvedGuilds.add(key);
  }

  try {
    await command.run(interaction);
  } catch (e) {
    console.error(e);

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setDescription(
        typeof e === "string" ? e : "An unexpected error occurred."
      );

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  } finally {
    if (command.guildResolve) {
      unresolvedGuilds.delete(
        `${interaction.guildId} ${interaction.commandName}`
      );
    }
  }
}

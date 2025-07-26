import {
  EmbedBuilder,
  Colors,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import client from "../client.js";
import {
  checkBlacklisted,
  getDevIds,
  checkUserPermissions,
  checkBotPermissions,
} from "../lib/util/functions.js";

export const unresolvedGuilds = new Set();

export default async function (interaction) {
  const embed = new EmbedBuilder();

  const userBlacklist = await checkBlacklisted(interaction.user.id);
  if (userBlacklist) {
    embed.setColor(Colors.Red);
    embed.setAuthor({
      name: `You are blacklisted from ${client.user.username}!`,
      iconURL: client.user.displayAvatarURL(),
    });
    embed.setDescription(
      `You have been indefinitely blacklisted from using ${client.user.username}. If this was a false blacklist, please contact our team by joining our [Support Server](https://discord.gg/xenabot).`
    );
    embed.addFields(
      { name: "Reason", value: userBlacklist.reason },
      {
        name: "Date",
        value: `<t:${userBlacklist.date}>`,
      }
    );

    if (!userBlacklist.sent) {
      await interaction.member?.send({ embeds: [embed] }).catch(() => {});

      await client.db.blacklist.updateMany({
        where: {
          userId: interaction.user.id,
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
            value: `<t:${guildBlacklist.date}>`,
          }
        );

      if (!guildBlacklist.sent) {
        await client.db.blacklist.updateMany({
          where: { guildId: interaction.guild.id },
          data: { sent: true },
        });

        await interaction.channel.send({ embeds: [embed] }).catch(() => {});
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
    if (await checkBotPermissions(interaction, command.clientPermissions))
      return;
  }

  if (command.userPermissions) {
    if (await checkUserPermissions(interaction, command.userPermissions))
      return;
  }

  if (command.guildResolve) {
    const key = `${interaction.guildId} ${interaction.commandName}`;
    if (unresolvedGuilds.has(key)) {
      return interaction.reply({
        content:
          "Another process of this command is currently running. Please wait for it to finish before running this command.",
        flags: MessageFlags.Ephemeral,
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
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
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

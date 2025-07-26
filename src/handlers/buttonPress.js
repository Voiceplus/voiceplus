import { MessageFlags } from "discord.js";
import client from "../client.js";
import {
  checkUserPermissions,
  checkBotPermissions,
} from "../lib/util/functions.js";

export default async function (interaction) {
  if (interaction.customId[0] === "?") return;

  const button = client.buttons.get(interaction.customId.split(":")[0]);
  if (!button) {
    return interaction.reply({
      content: "Unknown button interaction.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (button.clientPermissions) {
    if (await checkBotPermissions(interaction, button.clientPermissions))
      return;
  }

  if (button.userPermissions) {
    if (await checkUserPermissions(interaction, button.userPermissions)) return;
  }

  try {
    await button.run(interaction);
  } catch (e) {
    if (typeof e !== "string") return console.error(e);

    if (interaction.deferred || interaction.replied)
      return interaction.editReply({ content: e });
    else
      return interaction.reply({ content: e, flags: MessageFlags.Ephemeral });
  }
}

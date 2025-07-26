import { MessageFlags } from "discord.js";
import client from "../client.js";

export default async function (interaction) {
  if (interaction.customId[0] === "?") return;

  const menu = client.selectMenus.get(interaction.customId.split(":")[0]);
  if (!menu) {
    return interaction.reply({
      content: "Unknown select menu interaction.",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await menu.run(interaction);
  } catch (e) {
    if (typeof e !== "string") return console.error(e);

    if (interaction.deferred || interaction.replied)
      return interaction.editReply({ content: e });
    else
      return interaction.reply({ content: e, flags: MessageFlags.Ephemeral });
  }
}

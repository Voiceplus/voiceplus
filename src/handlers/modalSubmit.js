import { MessageFlags } from "discord.js";
import client from "../client.js";
import { readComplexCustomId } from "../lib/util/functions.js";

export default async function (interaction) {
  if (interaction.customId[0] === "?") return;

  const name = readComplexCustomId(interaction.customId).name;
  const modal = client.modals.get(name);

  if (!modal) {
    return interaction.reply({
      content: "Unknown modal interaction.",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await modal.run(interaction);
  } catch (e) {
    if (typeof e !== "string") {
      console.error(e);
      return;
    }

    if (!interaction.deferred && !interaction.replied) {
      return interaction.reply({ content: e, ephemeral: true });
    } else {
      return interaction.editReply({ content: e });
    }
  }
}

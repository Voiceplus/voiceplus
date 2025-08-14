import { ModalSubmitInteraction } from "discord.js";
import Modal from "../lib/structs/Modal.js";
import { readComplexCustomId } from "../lib/util/functions.js";

class voicePanelModal extends Modal {
  constructor() {
    super("voicePanel");
  }

  async run(interaction) {
    const { option } = readComplexCustomId(interaction.customId);

    if (option === "name") {
      const name = interaction.fields.getTextInputValue("name").toLowerCase();

      return interaction.reply(`Name \`${name}\`.`);
    }
  }
}

export default voicePanelModal;

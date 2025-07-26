import chatInputCommand from "../handlers/chatInputCommand.js";
import { confirmGuild } from "../lib/util/functions.js";
import Listener from "../lib/structs/Listener.js";
import buttonPress from "../handlers/buttonPress.js";
import selectMenu from "../handlers/selectMenu.js";
import { InteractionType } from "discord.js";

class InteractionCreateListener extends Listener {
  constructor() {
    super("interactionCreate");
  }

  async run(interaction) {
    if (interaction.inCachedGuild()) await confirmGuild(interaction.guildId);

    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return chatInputCommand(interaction);

      case InteractionType.MessageComponent:
        if (interaction.isButton()) {
          return buttonPress(interaction);
        } else if (interaction.isStringSelectMenu()) {
          return selectMenu(interaction);
        } else {
          return;
        }
    }
  }
}

export default InteractionCreateListener;

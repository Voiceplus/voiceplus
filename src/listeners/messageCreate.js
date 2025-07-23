import Listener from "../lib/structs/Listener.js";
import messageCommand from "../handlers/messageCommand.js";

class MessageCreateListener extends Listener {
  constructor() {
    super("messageCreate");
  }

  async run(message) {
    messageCommand(message);
  }
}

export default MessageCreateListener;

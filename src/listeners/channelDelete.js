import Listener from "../lib/structs/Listener.js";
import voiceDelete from "../handlers/voiceDelete.js";

class ChannelDeleteListener extends Listener {
  constructor() {
    super("channelDelete");
  }

  async run(message) {
    voiceDelete(message);
  }
}

export default ChannelDeleteListener;

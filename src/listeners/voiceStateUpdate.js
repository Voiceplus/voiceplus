import Listener from "../lib/structs/Listener.js";
import voiceChannel from "../handlers/voiceChannel.js";

class VoiceStateUpdateListener extends Listener {
  constructor() {
    super("voiceStateUpdate");
  }

  async run(oldState, newState) {
    await voiceChannel(oldState, newState);
  }
}

export default VoiceStateUpdateListener;

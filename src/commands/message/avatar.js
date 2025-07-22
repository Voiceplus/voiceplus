import Command from "../../lib/structs/Command.js";
import { getUser } from "../../lib/util/functions.js";

class AvatarCommand extends Command {
  constructor() {
    super();
    this.name = "avatar";
    this.description = "Get a user's avatar.";
    this.args = "[user]";
    this.allowDM = true;
    this.aliases = ["av", "pfp"];
  }
  async run(message, args) {
    const user = args.length > 0 ? await getUser(args[0]) : message.author;
    if (!user) return message.reply("Invalid user.");
    return message.reply(user.displayAvatarURL({ size: 4096 }));
  }
}

export default AvatarCommand;

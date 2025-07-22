import Command from "../../lib/structs/Command.js";

class PingCommand extends Command {
  constructor() {
    super();
    this.name = "ping";
    this.description = "Check the bot's latency.";
  }

  async run(message, args) {
    const start = performance.now();
    const msg = await message.reply('Pinging...');
    const end = performance.now();

    const timeTaken = Math.round(end - start);
    const ws = this.client.ws.ping;

    return msg.edit(`Pong! Roundtrip: \`${timeTaken}ms\` | Latency: \`${ws}ms\``);
  }
}

export default PingCommand;

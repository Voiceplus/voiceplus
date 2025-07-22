import {
  Client as DJSClient,
  GatewayIntentBits as Intents,
  Options,
  Partials,
  Sweepers,
} from "discord.js";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
//import Button from './Button.js';

class Client extends DJSClient {
  constructor() {
    super({
      intents: [
        Intents.Guilds,
        Intents.GuildMembers,
        Intents.GuildMessages,
        Intents.MessageContent,
        Intents.DirectMessages,
        Intents.AutoModerationExecution,
        Intents.AutoModerationConfiguration,
      ],
      partials: [Partials.Message, Partials.Channel],
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        GuildEmojiManager: 0,
        GuildStickerManager: 0,
        VoiceStateManager: 0,
        GuildInviteManager: 0,
        GuildScheduledEventManager: 0,
      }),
      sweepers: {
        ...Options.DefaultSweeperSettings,
        guildMembers: {
          interval: 300,
          filter: Sweepers.filterByLifetime({
            lifetime: 300,
            excludeFromSweep: (member) => member.id !== process.env.CLIENT_ID,
          }),
        },
        messages: {
          interval: 3600,
          filter: Sweepers.filterByLifetime({
            lifetime: 3600,
          }),
        },
      },
      allowedMentions: {
        parse: [],
      },
    });

    this.db = new PrismaClient();
    this.commands = {
      slash: new Map(),
      message: new Map(),
    };
    this.aliases = new Map();
    this.modals = new Map();
    this.buttons = new Map();
  }

  //   async _cacheModals() {
  //     const files = fs.readdirSync('src/modals');
  //     for (const file of files) {
  //       const modalClass = (await import(`../../modals/${file.slice(0, -3)}.js`)).default;
  //       const modalInstant = new modalClass();
  //       this.modals.set(modalInstant.name, modalInstant);
  //     }
  //   }

  //   async _cacheButtons() {
  //     const files = fs.readdirSync('src/buttons');
  //     for (const file of files) {
  //       const buttonClass = (await import(`../../buttons/${file.slice(0, -3)}.js`)).default;
  //       const buttonInstant = new buttonClass();
  //       this.buttons.set(buttonInstant.name, buttonInstant);
  //     }
  //   }

  //   async _cacheSlashCommands() {
  //     const files = fs.readdirSync('src/commands/slash');
  //     for (const file of files) {
  //       const cmdClass = (await import(`../../commands/slash/${file.slice(0, -3)}.js`)).default;
  //       const cmdInstant = new cmdClass();
  //       this.commands.slash.set(cmdInstant.data.name, cmdInstant);
  //     }
  //   }

  async _cacheMessageCommands() {
    const files = fs.readdirSync("src/commands/message");
    for (const file of files) {
      const cmdClass = (
        await import(`../../commands/message/${file.slice(0, -3)}.js`)
      ).default;
      const cmdInstant = new cmdClass();
      this.commands.message.set(cmdInstant.name, cmdInstant);

      cmdInstant.aliases.forEach((alias) =>
        this.aliases.set(alias, cmdInstant.name)
      );
    }
  }

  async _loadListeners() {
    const files = fs.readdirSync("src/listeners");
    for (const file of files) {
      const listenerClass = (
        await import(`../../listeners/${file.slice(0, -3)}.js`)
      ).default;
      const listenerInstant = new listenerClass();
      listenerInstant.once
        ? this.once(
            listenerInstant.name,
            (...args) => void listenerInstant.run(...args)
          )
        : this.on(
            listenerInstant.name,
            (...args) => void listenerInstant.run(...args)
          );
    }
  }

  async login(token) {
    // await this._cacheSlashCommands();
    await this._cacheMessageCommands();
    // await this._cacheModals();
    // await this._cacheButtons();
    await this._loadListeners();

    await this.db.$connect();

    return super.login(token);
  }
}

export default Client;

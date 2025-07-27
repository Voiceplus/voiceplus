import {
  Client as DJSClient,
  GatewayIntentBits as Intents,
  Options,
  Partials,
  Sweepers,
} from "discord.js";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { loadLanguages, t } from "../util/functions.js";

class Client extends DJSClient {
  constructor() {
    super({
      intents: [
        Intents.Guilds,
        Intents.GuildMembers,
        Intents.GuildMessages,
        Intents.MessageContent,
        Intents.DirectMessages,
        Intents.GuildVoiceStates,
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
        VoiceStateManager: 50,
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
    this.selectMenus = new Map();
    this.languages = loadLanguages();
  }

  t(key, lang = "en", replacements = {}) {
    // Just a proxy to your utility function
    return t(this.languages, key, lang, replacements);
  }

  //   async _cacheModals() {
  //     const files = fs.readdirSync('src/modals');
  //     for (const file of files) {
  //       const modalClass = (await import(`../../modals/${file.slice(0, -3)}.js`)).default;
  //       const modalInstant = new modalClass();
  //       this.modals.set(modalInstant.name, modalInstant);
  //     }
  //   }

  async _cacheSelectMenus() {
    const files = fs.readdirSync("src/selectMenus");
    for (const file of files) {
      const selectMenuClass = (
        await import(`../../selectMenus/${file.slice(0, -3)}.js`)
      ).default;
      const selectMenuInstance = new selectMenuClass();
      this.selectMenus.set(selectMenuInstance.name, selectMenuInstance);
    }
  }

  async _cacheButtons() {
    const files = fs.readdirSync("src/buttons");
    for (const file of files) {
      const buttonClass = (
        await import(`../../buttons/${file.slice(0, -3)}.js`)
      ).default;
      const buttonInstant = new buttonClass();
      this.buttons.set(buttonInstant.name, buttonInstant);
    }
  }

  async _cacheSlashCommands() {
    const files = fs.readdirSync("src/commands/slash");
    for (const file of files) {
      const cmdClass = (
        await import(`../../commands/slash/${file.slice(0, -3)}.js`)
      ).default;
      const cmdInstant = new cmdClass();
      this.commands.slash.set(cmdInstant.data.name, cmdInstant);
    }
  }

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

      const handler = (...args) => listenerInstant.run(...args);

      listenerInstant.once
        ? this.once(listenerInstant.name, handler)
        : this.on(listenerInstant.name, handler);
    }
  }

  async login(token) {
    await this._cacheSlashCommands();
    await this._cacheMessageCommands();
    // await this._cacheModals();
    await this._cacheButtons();
    await this._cacheSelectMenus();
    await this._loadListeners();

    await this.db.$connect();

    return super.login(token);
  }
}

export default Client;

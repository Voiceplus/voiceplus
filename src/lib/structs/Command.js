import { PermissionsBitField } from "discord.js";
import client from "../../client.js";

export default class Command {
  constructor(options = {}) {
    this.data = options.data || null;
    this.clientPermissions = options.clientPermissions
      ? new PermissionsBitField(options.clientPermissions)
      : null;

    this.name = options.name || null;
    this.description = options.description || null;
    this.aliases = options.aliases || [];
    this.args =
      typeof options.args === "string" ? [options.args] : options.args || null;
    this.slashOnly = options.slashOnly || false;

    this.devOnly = options.devOnly || false;
    this.allowDM = options.allowDM || false;
    this.guildResolve = options.guildResolve || false;

    this.client = client;
  }
}

export function data(dataObject) {
  return function (TargetClass) {
    return class extends TargetClass {
      constructor(...args) {
        super(...args);
        this.data = dataObject;
      }
    };
  };
}

export function properties(props) {
  return function (TargetClass) {
    return class extends TargetClass {
      constructor(...args) {
        super(...args);

        this.clientPermissions = props.clientPermissions
          ? new PermissionsBitField(props.clientPermissions)
          : null;
        this.devOnly = props.devOnly ?? false;
        this.allowDM = props.allowDM ?? false;
        this.guildResolve = props.guildResolve ?? false;
        this.name = props.name ?? null;
        this.description = props.description ?? null;
        this.aliases = props.aliases ?? [];
        this.args =
          typeof props.args === "string" ? [props.args] : props.args ?? null;
        this.slashOnly = props.slashOnly ?? false;
      }
    };
  };
}

import { PermissionsBitField } from "discord.js";
import client from "../../client.js";

export default class Command {
  constructor() {
    this.data = null;
    this.clientPermissions = null;

    this.name = null;
    this.description = null;
    this.aliases = [];
    this.args = null;
    this.slashOnly = false;

    this.devOnly = false;
    this.allowDM = false;
    this.guildResolve = false;

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
        this.args = typeof props.args === 'string' ? [props.args] : props.args ?? null;
        this.slashOnly = props.slashOnly ?? false;
      }
    };
  };
}

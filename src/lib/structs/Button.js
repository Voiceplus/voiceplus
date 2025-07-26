// lib/structs/Button.js
import client from "../../client.js";

class Button {
  constructor(options = {}) {
    this.name = options.name;
    this.clientPermissions = options.clientPermissions ?? [];
    this.userPermissions = options.userPermissions ?? [];
    this.client = client;
  }
}

export default Button;

import client from "../../client.js";

class Select {
  constructor(options = {}) {
    this.name = options.name;
    this.clientPermissions = options.clientPermissions ?? [];
    this.client = client;
  }
}

export default Select;

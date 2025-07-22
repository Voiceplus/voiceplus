import client from "../../client.js";

class Listener {
  constructor(name, once = false) {
    this.name = name;
    this.once = once;
    this.client = client;
  }
}

export default Listener;

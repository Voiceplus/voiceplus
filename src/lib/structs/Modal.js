import client from "../../client.js";

class Modal {
  constructor(options = {}) {
    this.name = options.name;
    this.client = client;
  }
}

export default Modal;

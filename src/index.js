import "dotenv/config";
import client from "./client.js";

await client.login(process.env.TOKEN);

process.on("unhandledRejection", (e) => console.error(e));

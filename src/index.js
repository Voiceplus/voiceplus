import "dotenv/config";
import "./routines.js"
import client from "./client.js";

await client.login(process.env.TOKEN);

process.on("unhandledRejection", (e) => console.error(e));

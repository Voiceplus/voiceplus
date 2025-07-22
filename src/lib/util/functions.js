import client from "../../client.js";
export const commandsPermissionCache = new Map();

export async function confirmGuild(guildId) {
  if (!commandsPermissionCache.has(guildId)) {
    const permissions = await client.application.commands.permissions.fetch({
      guild: guildId,
    });
    commandsPermissionCache.set(guildId, permissions);
  }
  const guild = await client.db.guild.findUnique({
    where: { id: guildId },
  });

  if (guild) return guild;

  return client.db.guild.create({ data: { id: guildId } });
}

export async function checkBlacklisted(id) {
  return await client.db.blacklist.findFirst({
    where: {
      OR: [{ userId: id }, { guildId: id }],
    },
  });
}

export async function getStaff() {
  const staff = await client.db.staff.findMany({
    select: { userId: true },
  });

  return staff.map((s) => s.userId);
}

export function getDevIds() {
  return process.env.DEVS
    ? process.env.DEVS.split(",").map((id) => id.trim())
    : [];
}

const snowflakeReg = /^\d{17,19}$/;
export async function getUser(user) {
  if (user.startsWith("<@")) {
    user = user.slice(2, -1);
    if (user.startsWith("!")) user = user.slice(1);
  }

  if (!snowflakeReg.test(user)) return null;

  return await client.users.fetch(user).catch(() => null);
}

export async function getMember(guild, user) {
  if (user.startsWith("<@")) {
    user = user.slice(2, -1);
    if (user.startsWith("!")) user = user.slice(1);
  }

  if (!snowflakeReg.test(user)) return null;

  if (typeof guild === "string")
    return client.guilds.cache
      .get(guild)
      ?.members.fetch(user)
      .catch(() => null);
  else return guild.members.fetch(user).catch(() => null);
}

export async function bin(data, ext = "txt") {
  const binReq = await fetch("https://hst.sh/documents", {
    method: "POST",
    body: typeof data === "object" ? JSON.stringify(data, null, 2) : data,
  });

  if (!binReq.ok)
    throw `Error uploading to hastebin; status code: ${binReq.status}`;
  const bin = await binReq.json();
  return `https://hst.sh/${bin.key}.${ext}`;
}

import client from "../../client.js";
import {
  PermissionsBitField,
  EmbedBuilder,
  Colors,
  MessageFlags,
} from "discord.js";
import fs from "fs";
import path from "path";
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

export function formatPermissionName(permission) {
  permission = permission.replace(/Guild/g, "Server");

  const words = permission
    .split(/_|(?=[A-Z])/)
    .filter(Boolean)
    .map((word) => {
      if (word.toLowerCase() === "useapplicationcommands")
        return "Use Application Commands";
      if (word.toLowerCase() === "viewauditlog") return "View Audit Log";

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

  return words.join(" ");
}

export async function webhookSend(webhookURL, messageData) {
  const req = await fetch(webhookURL, {
    body: JSON.stringify(messageData),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!req.ok) throw await req.json();
}

export function createComplexCustomId(name, option, data) {
  return `${name}:${option ?? ""}?${
    typeof data === "string" ? data : data ? data.join("&") : ""
  }`;
}

export function readComplexCustomId(customId) {
  const colonIndex = customId.indexOf(":");
  if (colonIndex === -1) return { name: customId, option: null, data: null };

  const name = customId.slice(0, colonIndex);

  let questionIndex = customId.indexOf("?");
  if (questionIndex === -1) questionIndex = customId.length;

  const dataStr = customId.slice(questionIndex + 1);
  const data = dataStr ? dataStr.split("&") : null;
  const option = customId.slice(colonIndex + 1, questionIndex);

  return { name, option: option || null, data };
}

export async function checkBotPermissions(interaction, requiredPermissions) {
  const botMember = interaction.guild?.members.me;
  if (!botMember) return false;

  const missing = new PermissionsBitField(requiredPermissions)
    .toArray()
    .filter((perm) => !botMember.permissions.has(perm));

  if (missing.length === 0) return false;

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setAuthor({ name: "Missing Permissions!" })
    .setDescription(
      [
        `I need the following permissions to manage temporary channels and server categories:`,
        `\`${missing.map(formatPermissionName).join("`, `")}\``,
        `**Why are these needed?**`,
        `They’re required to properly set up and control temporary voice channels.`,
      ].join("\n")
    );

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  return true;
}

export async function checkUserPermissions(interaction, requiredPermissions) {
  if (!interaction.member) return false;

  const missing = new PermissionsBitField(requiredPermissions)
    .toArray()
    .filter((perm) => !interaction.member.permissions.has(perm));

  if (missing.length === 0) return false;

  const formattedPermissions = missing.map(formatPermissionName).join(", ");

  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setAuthor({ name: "Missing Permissions!" })
    .setDescription(
      `You must have the **${formattedPermissions}** permission to use this command.`
    );

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  return true;
}

export function loadLanguages() {
  const localesDir = path.join(process.cwd(), "locales");
  const languages = {};
  for (const file of fs.readdirSync(localesDir)) {
    if (file.endsWith(".json")) {
      const langCode = file.replace(".json", "");
      const rawData = JSON.parse(
        fs.readFileSync(path.join(localesDir, file), "utf-8")
      );

      if (Array.isArray(rawData)) {
        // merge all objects in array into one
        languages[langCode] = Object.assign({}, ...rawData);
      } else {
        languages[langCode] = rawData;
      }
    }
  }
  return languages;
}

export function t(languages, key, lang = "en", replacements = {}) {
  const translation = languages[lang]?.[key];
  if (!translation) return key; // fallback to key if missing

  return translation.replace(
    /\{(\w+)\}/g,
    (_, k) => replacements[k] ?? `{${k}}`
  );
}

export const guildLanguageCache = new Map();

export async function getGuildLanguage(guildId) {
  if (guildLanguageCache.has(guildId)) {
    return guildLanguageCache.get(guildId);
  }
  const guild = await client.db.guild.findUnique({ where: { id: guildId } });
  const lang = guild?.language || "en";
  guildLanguageCache.set(guildId, lang);
  return lang;
}



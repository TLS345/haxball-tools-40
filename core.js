// ============================
//     HAXBALL TOOLS - DAY 40
//   DISCORD ↔ HAXBALL SYNC
//      BY TLS / Teleese
// ============================

import readline from "readline";
import { Client, GatewayIntentBits } from "discord.js";
import HaxballJS from "haxball.js";

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function getConfig() {
  let haxballToken = process.env.HAXBALL_TOKEN;
  let discordToken = process.env.DISCORD_TOKEN;
  let discordChannelId = process.env.DISCORD_CHANNEL_ID;
  let roomName = process.env.ROOM_NAME || "Teleese Room :)";
  let maxPlayers = parseInt(process.env.MAX_PLAYERS || "10");
  let isPublic = process.env.PUBLIC === "true";

  if (!haxballToken) haxballToken = await ask("Enter your Haxball token: ");
  if (!discordToken) discordToken = await ask("Enter your Discord bot token: ");
  if (!discordChannelId)
    discordChannelId = await ask("Enter your Discord channel ID: ");

  return {
    roomName,
    maxPlayers,
    public: isPublic,
    haxballToken,
    discordToken,
    discordChannelId,
  };
}

(async () => {
  const CONFIG = await getConfig();

  if (!CONFIG.haxballToken || !CONFIG.discordToken || !CONFIG.discordChannelId) {
    console.error("❌ Missing configuration. Exiting...");
    process.exit(1);
  }

  HaxballJS.then(async (HBInit) => {
    const room = HBInit({
      roomName: CONFIG.roomName,
      maxPlayers: CONFIG.maxPlayers,
      public: CONFIG.public,
      token: CONFIG.haxballToken,
    });

    console.log(`[HAXBALL] Room created successfully ✅ (${CONFIG.roomName})`);

    room.onRoomLink = (link) => {
      console.log(`🔗 Room link: ${link}`);
    };

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.once("ready", () => {
      console.log(`[DISCORD] Logged in as ${client.user.tag}`);
    });

    await client.login(CONFIG.discordToken);

    room.onPlayerChat = (player, message) => {
      console.log(`[Haxball] ${player.name}: ${message}`);
      const channel = client.channels.cache.get(CONFIG.discordChannelId);
      if (channel) channel.send(`**${player.name}:** ${message}`);
    };

    client.on("messageCreate", (msg) => {
      if (msg.channel.id === CONFIG.discordChannelId && !msg.author.bot) {
        room.sendAnnouncement(
          `[Discord] ${msg.author.username}: ${msg.content}`,
          null,
          0x87cefa,
          "bold"
        );
      }
    });

    room.onPlayerJoin = (player) => {
      room.sendAnnouncement(`👋 Welcome ${player.name}!`, null, 0x32cd32, "bold");
      const channel = client.channels.cache.get(CONFIG.discordChannelId);
      if (channel) channel.send(`🟢 **${player.name}** joined the room.`);
    };

    room.onPlayerLeave = (player) => {
      room.sendAnnouncement(`👋 ${player.name} left the room.`, null, 0xff4500, "bold");
      const channel = client.channels.cache.get(CONFIG.discordChannelId);
      if (channel) channel.send(`🔴 **${player.name}** left the room.`);
    };

    console.log("[CORE] Chat synchronization is live 🚀");
  }).catch((err) => {
    console.error("❌ Error initializing Haxball:", err);
    process.exit(1);
  });
})();

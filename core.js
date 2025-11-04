// ============================
//     HAXBALL TOOLS - DAY 40
//   DISCORD ↔ HAXBALL SYNC
//      BY TLS / Teleese
// ============================

import { Client, GatewayIntentBits } from "discord.js";
import HaxballJS from "haxball.js";



const CONFIG = {
  roomName: "Teleese Room :)", // put any name u want idc 
  maxPlayers: 10,
  public: true,

  // .env variables too easy to edit for dumb guys 
  haxballToken: process.env.HAXBALL_TOKEN,  
  discordToken: process.env.DISCORD_TOKEN,
  discordChannelId: process.env.DISCORD_CHANNEL_ID,
};

if (!CONFIG.haxballToken) {
  console.error("❌ Missing Haxball token (HAXBALL_TOKEN).");
  process.exit(1);
}
if (!CONFIG.discordToken) {
  console.error("❌ Missing Discord token (DISCORD_TOKEN).");
  process.exit(1);
}
if (!CONFIG.discordChannelId) {
  console.error("❌ Missing Discord channel ID (DISCORD_CHANNEL_ID).");
  process.exit(1);
}

HaxballJS.then(async (HBInit) => {
  const room = HBInit({
    roomName: CONFIG.roomName,
    maxPlayers: CONFIG.maxPlayers,
    public: CONFIG.public,
    token: CONFIG.haxballToken,
  });

  console.log("[HAXBALL] Room created successfully ✅");

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
      room.sendChat(`[Discord] ${msg.author.username}: ${msg.content}`);
    }
  });

  room.onPlayerJoin = (player) => {
    room.sendChat(`👋 Welcome ${player.name}!`);
    const channel = client.channels.cache.get(CONFIG.discordChannelId);
    if (channel) channel.send(`🟢 **${player.name}** joined the room.`);
  };

  room.onPlayerLeave = (player) => {
    const channel = client.channels.cache.get(CONFIG.discordChannelId);
    if (channel) channel.send(`🔴 **${player.name}** left the room.`);
  };

  console.log("[CORE] Chat synchronization is live 🚀");
});

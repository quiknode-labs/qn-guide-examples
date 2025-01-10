require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const getMetrics = require('./actions/getMetrics');
const openaiHelper = require('./actions/openaiHelper');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required to read message content
  ],
});

// Thread-specific context storage
const THREAD_CONTEXT = new Map();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignore bot messages

  // Handle follow-up queries in threads
  if (message.channel.isThread()) {
    const context = THREAD_CONTEXT.get(message.channel.id);

    if (!context) {
      message.channel.send("This thread has no active context. Please start a new query.");
      return;
    }

    const includeTimestamp = /time|date|when|confirmed|timestamp/i.test(message.content);
    const prompt = `You are Michael Scott, the quirky and often inappropriate boss from The Office. 
    You are answering questions about Ethereum block ${context.blockNumber}.
    Here is the known data for block ${context.blockNumber}:
    ${JSON.stringify(context.blockData, null, 2)}
    User's query: "${message.content}"
    Respond as Michael Scott would: provide an accurate answer first, and then add a humorous remark in Michael's style. 
    ${includeTimestamp ? `Mention the block timestamp (${context.blockData.blockTimestamp}) as part of the response.` : 'Do not mention the block timestamp unless explicitly asked.'}
    Keep your response under 150 tokens.`;

    try {
      const response = await openaiHelper(prompt);
      await message.reply(response);
    } catch (error) {
      console.error("OpenAI Error:", error.message);
      message.reply("Uh-oh, looks like something went wrong. Classic Michael mistake!");
    }
    return;
  }

  const blockNumberMatch = message.content.match(/block(?:\s*number)?\s*(\d+)/i);

  if (blockNumberMatch) {
    const blockNumber = parseInt(blockNumberMatch[1], 10);

    try {
      const blockData = await getMetrics(blockNumber);

      if (!blockData) {
        message.channel.send(`No data found for block ${blockNumber}. That's what she said!`);
        return;
      }

      const thread = await message.startThread({
        name: `Block ${blockNumber} Query`,
        autoArchiveDuration: 60,
      });

      THREAD_CONTEXT.set(thread.id, { blockNumber, blockData });

      const includeTimestamp = /time|date|when|confirmed|timestamp/i.test(message.content);
      const prompt = `You are Michael Scott, the quirky and often inappropriate boss from The Office. 
      You are answering questions about Ethereum block ${blockNumber}.
      Here is the known data for block ${blockNumber}:
      ${JSON.stringify(blockData, null, 2)}
      User's query: "${message.content}"
      Respond as Michael Scott would: provide an accurate answer first, and then add a humorous remark in Michael's style. 
      ${includeTimestamp ? `Mention the block timestamp (${blockData.blockTimestamp}) as part of the response.` : 'Do not mention the block timestamp unless explicitly asked.'}
      Keep your response under 150 tokens.`;

      const response = await openaiHelper(prompt);
      await thread.send(response);
    } catch (error) {
      console.error("Error:", error.message);
      message.channel.send(`I couldn't process your query for block ${blockNumber}.`);
    }
  } else {
    const funnyResponses = [
      "I'm sorry, I can't read your mind. Do you know how many times I've been asked to do that in the office? Just give me a block number!",
      "This feels like a setup for 'that's what she said.' Anyway, I need a block number to work with.",
      "No block number? That’s okay, I’ll just sit here awkwardly until you give me one.",
      "Imagine I'm your assistant... but I need details. Which block are we talking about?",
      "You’re lucky I’m not Dwight, or I’d make you fill out a block request form. Just give me the number!"
    ];
    const followUp = "Could you please specify the block number you'd like to know about?";

    message.channel.send(funnyResponses[Math.floor(Math.random() * funnyResponses.length)]);
    setTimeout(() => {
      message.channel.send(followUp);
    }, 2000);
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

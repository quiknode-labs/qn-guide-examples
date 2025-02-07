import { TwitterApi } from "twitter-api-v2";
// import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

async function testTwitterIntegration() {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  });

//   const llm = new ChatAnthropic({
//     anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
//     modelName: "claude-3-opus-20240229",
//   });

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "gpt-4o-mini",
  });

  try {
    // Test 1: Post a tweet
    console.log("Testing tweet posting...");
    const tweet = await client.v2.tweet(
      "Hello from Base AI Agent! 🤖 #TestTweet"
    );
    console.log("Tweet posted:", tweet.data.id);

    // Test 2: Get recent mentions
    console.log("\nTesting mentions retrieval...");
    const mentions = await client.v2.userMentionTimeline(
      process.env.TWITTER_USER_ID!
    );
    console.log("Recent mentions:", mentions.data);

    console.log("\nAll tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testTwitterIntegration().catch(console.error);

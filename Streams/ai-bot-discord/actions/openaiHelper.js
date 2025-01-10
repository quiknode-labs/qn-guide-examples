const axios = require('axios');

const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

module.exports = async (prompt) => {
  const MAX_RETRIES = 5; // Maximum retries for handling rate limits
  let retryDelay = 1000; // Initial retry delay (in milliseconds)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        openaiEndpoint,
        {
          model: "gpt-4", // Use GPT-4 for higher quality responses
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200, // Limit the response length to 200 tokens
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Log only rate limit details
      console.log("Rate Limit Details:", {
        remainingRequests: response.headers['x-ratelimit-remaining-requests'],
        resetTime: response.headers['x-ratelimit-reset-requests'],
      });

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn(`Rate limit hit. Retrying in ${retryDelay / 1000}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Increase delay exponentially
      } else {
        console.error("OpenAI API Error:", err.response?.data || err.message);
        throw new Error("Failed to generate response.");
      }
    }
  }

  return "I'm currently experiencing high demand and cannot process your request. Please try again later.";
};

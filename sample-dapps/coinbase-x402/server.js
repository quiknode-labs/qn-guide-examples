import express from "express";
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402"; // For mainnet
import dotenv from "dotenv";
import path from "path";
import { log } from "./utils/log.js";
import { videoAccessHandler } from "./handlers/videoAccessHandler.js";

dotenv.config();

const app = express();

// Use Base Sepolia (testnet) for development
const network = "base-sepolia";
const facilitatorObj = { url: "https://x402.org/facilitator" };

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), "public")));

app.use(express.json());

// x402 payment middleware configuration
app.use(
  paymentMiddleware(
    process.env.WALLET_ADDRESS, // your receiving wallet address
    {
      // Protected endpoint for authentication
      "GET /authenticate": {
        price: "$0.10", // Set your desired price
        network: network,
      },
    },
    facilitatorObj
  )
);

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`${req.method} ${req.url}`);
  log(`Request Headers: ${JSON.stringify(req.headers)}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Authentication endpoint - just redirects to the authenticated content
app.get("/authenticate", (req, res) => {
  log("Payment successful, redirecting to video content");
  res.redirect("/video-content");
});

// Video content endpoint - serves the authenticated content
app.get("/video-content", videoAccessHandler);

// Serve the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

export default app;

// This block runs the server locally
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4021;
  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}
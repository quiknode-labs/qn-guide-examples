import { log } from "../utils/log.js";
import path from "path";

export function videoAccessHandler(req, res) {
  const startTime = Date.now();
  try {
    log("Processing video access request");
    
    // Send the video content page
    res.sendFile(path.join(process.cwd(), "public", "video-content.html"));
    
    log(`Request completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    log("Error serving video content:", "error", error);
    res.status(500).send({
      error: "Failed to serve video content",
      message: error.message,
    });
  }
}
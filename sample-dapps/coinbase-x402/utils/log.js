export function log(message, level = "info", error = null) {
  // Skip logging in production unless it's an error
  if (process.env.NODE_ENV === "production" && level !== "error") return;

  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (error) {
    logMessage += `\n${error.stack || error}`;
  }
  
  console.log(logMessage);
}
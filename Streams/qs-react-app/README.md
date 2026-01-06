# Quicknode Streams React Dashboard

A React dashboard that listens to the webhook server (port 3000) via Socket.IO and visualizes incoming Quicknode Streams data in real time.

## Prerequisites
- Node.js 18+
- The Streams webhook server running from the parent `Streams/app.js` (see `../README.md`)

## Setup
1. Install deps:
   ```bash
   npm install
   ```
2. Start the webhook server from the repo root (in another terminal):
   ```bash
   node Streams/app.js
   ```
3. Start the React app (runs on port 3001):
   ```bash
   npm start
   ```

## How it works
- Quicknode Streams posts to the webhook at `http://localhost:3000/webhook`.
- The server broadcasts events over Socket.IO; this UI subscribes on port 3001 and renders the stream payloads.

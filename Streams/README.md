This repository is based on the guide: [How to Build with Streams - Visualizing Streams data with React](https://www.quicknode.com/guides/quicknode-products/streams/visualizing-streams-data-with-react)

To start the project, follow these steps:

# Server

- In your terminal within your projects root directory run the command `ngrok http 3000`
- Install dependencies: `npm install`
- Start the server with `node app.js`

Completing the steps above should result in your app is listening on port 3000

# Frontend

- In your terminal, navigate to the `qs-react-app` folder
- Install dependencies: `npm install`
- Start the server: `npm run start`

# Streams

Login to your [QuickNode account](https://quicknode.com/login), and navigate to the **Streams** tab via the dashboard.

Click **Create Stream** on the top-right of the Streams page follow the next steps:

### Stream Settings

  - **Chain**: Ethereum; Network: Mainnet
  - **Dataset**: Block with Receipts
  - **Stream start**: Latest block + doesn't end
  - **Reorg Handling**: Leave as-is


### Destination Settings

  - **Destination type**: Webhook
  - **URL**: Add your `ngrok` URL + `/webhook` to the end (e.g., `https://6e09-50-223-15-62.ngrok-free.app/webhook`)
  - **Include metadata in**: Body
  - **Custom headers**: Content-type: application/json

> Other fields not mentioned in above sections, leave as-is

Once you create the Stream, you'll see data being fed to the React app in real-time!

![React App - Streams](https://i.ibb.co/MBnGyDw/streams.png)

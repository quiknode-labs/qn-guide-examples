# How to Create a Telegram Bot using QuickAlerts

#### Prerequisites
- A QuickNode account with [QuickAlerts](https://www.quicknode.com/quickalerts?utm_source=qn-github&utm_campaign=quickalerts_telegram_bot&utm_content=sign-up&utm_medium=generic).
- [Node.JS](https://nodejs.org/en/) installed.
- [Ngrok](https://ngrok.com/) installed globally on system.

---
### Step 1️⃣ - Creating the Bot on Telegram and adding it to a channel🤖
Open your Telegram app (Web/Desktop/Mobile) and search for `@BotFather` or go to https://t.me/BotFather. Open BotFather in Telegram and send a command `/newbot` in the chat, then give your bot a unique name for example, `QuickAlerts Bot` in the example below, then give it a username for example, `myquickalert_bot` in the example below. Once the BotFather creates your bot copy the username and the bot token.

<img src="https://user-images.githubusercontent.com/41318044/218246184-82822b29-b93b-4c72-86eb-85aa3a8f074b.png"  width="800" height="400">

Then create a new channel on Telegram, add a bot `myidbot` as administrator. Send a command `/getgroupid`, copy the id and then remove the bot. Refer animation below.

<img src="https://user-images.githubusercontent.com/41318044/218247223-6c3e70c9-efba-4c85-9b3a-65e6df56f40b.gif"  width="800" height="400">

Now add your QuickAlerts Bot in this channel using the username.

<img src="https://user-images.githubusercontent.com/41318044/218247724-0936f5e6-e90c-4d90-95d1-1d9919a052d0.gif"  width="800" height="400">

At this point you should have the Token of your bot and channel ID of your channel.

---
### Step 2️⃣ - Setting up the backend for bot🪛

#### Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo, navigate to this project's directory, install dependencies and open the project directory in a code editor (VS code in this case).

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/QuickAlerts/Telegram_bot
npm install
code .
```

Open a Terminal window and run ngrok on a port (make sure you have ngrok installed globally on your system).

```bash
ngrok http 5001
```

<img src="https://user-images.githubusercontent.com/41318044/218252391-967a4c78-5c9c-4ec0-a819-487adca341d5.png"  width="800" height="250">

Copy the URL which you get after running the above command.

Now create a `.env` file in your `/Telegram_bot` directory and paste the following in it:

```bash
TOKEN=<bot_token>
PORT=5001
```

Replace `<bot_token>` with the bot token you got from BotFather in the last step. Make sure the value of PORT is exactly the same as the port number used with the ngrok command.

In the index.js file, replace `<TELEGRAM_CHANNEL_ID>` on line 24 with the channel ID you got from step 2.

---
### Step 3️⃣ - Setting up QuickAlerts🔔
Setup an alert on the [QuickAlerts](https://www.quicknode.com/quickalerts?utm_source=qn-github&utm_campaign=quickalerts_telegram_bot&utm_content=sign-up&utm_medium=generic) dashboard, while setting up the WebHook in the dashboard use the URL you got from ngrok with a `/webhook` suffix. So it should look something like this `https://31f5-2401-4900-1c96-acd1-501f-36bc-819c-c5f5.ngrok.io/webhook`

<img src="https://user-images.githubusercontent.com/41318044/218255250-012bacde-6c71-4ade-b55b-ce432e3ed870.png"  width="800" height="250">

Learn how to setup a QuickAlert:
[Guide](https://www.quicknode.com/guides/knowledge-base/an-overview-of-quicknodes-quickalerts), [Video](https://youtu.be/Y3UZDxX-ZD8)

An example QuickAlerts expression to get notified when ever a Bomber Hero NFT on Polygon chain is transfered:

```JavaScript
(tx_logs_address == '0xd8a06936506379dbbe6e2d8ab1d8c96426320854') && (tx_logs_topic0 == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
```

---
### Step 4️⃣ - Running the bot🏃‍♂️💨
Open a new terminal window and run:

```bash
npm run dev
```

Now your Telegram channel should start recieving messages from the bot, the information in the messages is fed by QuickAlerts.

<img src="https://user-images.githubusercontent.com/41318044/218255804-8adb5fb2-c48f-45cc-bf2d-47e03046262d.png"  width="800" height="400">

You can use/create different variables from line 17-20 and edit the message part in index.js file from line 28-29 based on the kind of information you want to display in the Telegram message. With QuickAlerts there is immense possibilities around the kind of alerts one can create. 

Above and beyond!
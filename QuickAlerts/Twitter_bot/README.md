# How to Create a Twitter Bot to Track New Liquidity Pools on Uniswap using QuickAlerts

#### Prerequisites

- A [QuickNode](https://www.quicknode.com/quickalerts?utm_source=qn-github&utm_campaign=quickalerts_twitter_bot&utm_content=sign-up&utm_medium=generic) account
- [Node.js](https://nodejs.org) 18.16.0>, [Ethers.js](https://docs.ethers.org/v5) 5.7, [twitter-api-v2](https://www.npmjs.com/package/twitter-api-v2) 1.15.0 installed
- [Ngrok](https://ngrok.com/) installed globally
- [Twitter API Keys](https://developer.twitter.com/en/portal/dashboard) (shown in Step 2)
- [VSCode](https://code.visualstudio.com/)

### Step 1️⃣ - Setting up your Environment

To begin, run the following command to clone the **qn-guide-examples** repo, navigate to this project's directory, install dependencies and open the project directory in a code editor (VSCode in this case):

```sh
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/QuickAlerts/Twitter_bot
npm install
code .
```

After, create a **.env** file that will hold your private Twitter credentials:

```
echo > .env
```

Open the file and input the following placeholder values for now.

```
PORT=8000
appKey=
appSecret=
accessToken=
accessSecret=
```

### Step 2️⃣ - Setup a Twitter Developer Account and Create API Keys 

Navigate to your [Twitter Developer Portal Dashboard](https://developer.twitter.com/en/portal/dashboard) and go to one of your Apps within a Project (if you don't have this yet, you can do it now).

> Note to make sure your App has **Read & Write** permissions enabled.

<img width="1450" alt="twitter" src="https://github.com/quiknode-labs/qn-guide-examples/assets/101136230/d04b92ac-aaf4-47d9-a077-d56e0c025b71">

On the **Keys and Tokens** tab within your App, you'll need to extract both your **API Key and Secret** and **Access Token and Secret**. With both sets of keys, paste them accordingly into your **.env** file. Remember to save the file.

### Step 3️⃣ - Setting up the Backend for the Twitter Bot

Open a terminal window and run the following command to start the Express.js server (check out the [guide](https://www.quicknode.com/guides/quicknode-products/quickalerts/how-to-track-uniswap-liquidity-pools-using-quickalerts-and-twitter) for an explanation of the code):

```
node index.js
```

> You should see a message like: `Express server is listening on PORT 8000.... ` - This means your server is up and running locally on PORT 8000 (e.g., http://localhost:8000)

Then, open a separate terminal window and run the following command to start a **ngrok** http server on port 8000 (make sure you have ngrok installed globally on your system).

```
ngrok http 8000
```

<img width="1186" alt="ngrok" src="https://github.com/quiknode-labs/qn-guide-examples/assets/101136230/0b375775-dee8-4918-b3ca-62b2bd7d627b">

By now, both servers (Express.js and ngrok) should be running so that our QuickAlert can access it properly.

### Step 4️⃣ - Setting up QuickAlerts🔔

> Learn how to setup a QuickAlert:
[Guide](https://www.quicknode.com/guides/knowledge-base/an-overview-of-quicknodes-quickalerts), [Video](https://youtu.be/Y3UZDxX-ZD8)

**Select Template**

Select the blockchain network you want to track Uniswap liquidity pools on, then create a name for your alert and choose the blank template.

**Create Expression**

The alert expression used to identify new liquidity pools being created on Uniswap v3 will be this:

```
((tx_logs_topic0 == '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118' && tx_logs_address == '0x1f98431c8ad98523631ae4a59f267346ea31f984'))
```

**Select Destination**

For the **Webhook** destination, we'll need to use the URL referenced in our terminal running the **ngrok** server. So it should look something like this https://31f5-2401-4900-1c96-acd1-501f-36bc-819c-c5f5.ngrok.io/webhook.

In the end, click **Create Webhook**, then toggle the Webhook destination on and click **Deploy Alert**. You can edit any QuickAlert's settings by clicking the specific QuickAlert on the [QuickAlerts Dashboard](https://dashboard.quicknode.com/quick-alerts) page.

### Step 5️⃣ - Running the bot🏃‍♂️💨

Up until this point, you have created a QuickAlert and set up a server with Express.js and Ngrok that listens to incoming POST requests and makes a tweet with the Twitter API when a QuickAlert sends a notification to our Webhook destination.

Since it could take a while for someone to create a liquidity pool on Ethereum mainnet, we'll showcase how this should look, given one occurs. You can replicate this behavior by creating your own liquidity pool and testing it on a testnet like Goerli or Sepolia.

<img width="881" alt="tweet" src="https://github.com/quiknode-labs/qn-guide-examples/assets/101136230/1b5e45d6-f689-442e-94c1-b2175cef783c">


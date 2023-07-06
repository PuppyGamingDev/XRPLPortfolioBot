# XRPLPortfolioBot
XRPL wallet portfolio bot for Discord by [PuppyTools](https://puppy.tools)

## Requrements
- NodeJS v16+
- Ability to Copy&Paste some stuff

## Setup
Create a new file called `.env` and paste the following into it
```
TOKEN=
CLIENTID=
MONGOURI=
XUMM_API_KEY=
XUMM_API_SECRET=
NETWORK=
```
Install the required packages with `npm install` or `npm i discord.js mongoose xrpl xumm-sdk dotenv node-schedule axios`

While they are installing you can begin gathering your information for the `.env` file.

- `TOKEN` and `CLIENTID` are your Bot Token and Client ID from Discord Application > [GUIDE HERE](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- `MONGOURI` is a MongoDB Connection String > [GUIDE HERE](https://www.mongodb.com/docs/guides/atlas/connection-string/)
- `XUMM_API_KEY` and `XUMM_API_SECRET` require you to create an application with XUMM and get the values > [GUIDE HERE](https://xumm.readme.io/docs/register-your-app)
- `NETWORK` is the RPC you will be connecting to. I DO NOT SUGGEST using a public network as you will easily get ratelimited. You can get a generous one for free and even fairly priced tiers through [QuickNode](https://www.quicknode.com?tap_a=67226-09396e&tap_s=3536451-d11bb1&utm_source=affiliate&utm_campaign=generic&utm_content=affiliate_landing_page&utm_medium=generic) who now feature XRPL!

Once you have all your values, close & open the terminal (avoids any issues with it not reading the .env values) and then in the console run `node deploy-commands.js` and it will register the Bot's commands globally so any server the bot is in will be able to use them.


On the Discord Developer Dashboard for your application, navigate to `OAUTH2 > URL Generator` and tick the boxes for `bot` & `application.commands` and copy the URL that is generated below it and paste into your browser to invite the bot to your server. (The bot shouldn't need any extra permissions as all interactions are based on replying to interactions and not actual posting)

Once your bot is in, in the console run `node PortfolioBot.js` and you should see that it's running when it outputs to the console!

## Commands

### /link
Link your wallet with the bot so it gets a reference of your wallet.

### /portfolio
Will grab your wallet estimate!

### /tip
While you are having fun, why not send me a tip if you feel I deserve it :)

## Extra Notes
The bot will update colleciton floor prices every 20 minutes using the [xrpl.services](https://api.xrpldata.com/docs/static/index.html) API for any collection found in all of the accounts linked. Newly linked accounts that contain new collections not currently known will need to wait till the next update.

Also every 30 minutes the bot will refresh its Token prices from [xrplmeta](https://xrplmeta.org/) API.

## Finishing up
If you have any questions, my DMs are always open on

- Twitter > @iamshiffed
- Discord > Shiffed#2071
- New Discord Handles > shiffed
- Email > shiffed@puppy.tools

Tips are always welcome and help continue development

XRPL: `rm2AEVUcxeYh6ZJUTkWUqVRPurWdn4E9W`

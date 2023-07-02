/* eslint-disable no-inline-comments */
const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
require("dotenv/config");
const mongoConnect = require("./utilities/mongo-connect");
const { reloadUsers, reloadCollections } = require("./utilities/Storage");
require('./utilities/Updater');

// Declare needed Intents
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Declare and Map commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.cooldowns = new Collection();

// Runs when bot logs in
client.once(Events.ClientReady, async () => {
    // Initiate MongoDB connection first
    await mongoConnect();
    await reloadUsers();
    await reloadCollections();
    console.log(`XRPL Portfolio Bot is running`);
});

// Command Handling
client.on(Events.InteractionCreate, async (interaction) => {
    const { cooldowns } = client;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 10;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
        }
    }
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
    // Handle Autocomplete in Commands
    else if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.autocomplete(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
});

// Log the bot in
client.login(process.env.TOKEN);

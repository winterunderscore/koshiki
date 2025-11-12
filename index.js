const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { parse } = require('discord-command-parser');
const { prefix, token, google_API_KEY, database} = require('./config.json');

const Sequelize = require('sequelize');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });

const sequelize = new Sequelize(database.name, database.user, database.passsword, {
        host: "localhost",
        dialect: "sqlite",
        logging: false,
        storage: "database.sqlite"
});

// for notif system
client.youtubers = sequelize.define('youtubers', {
        channel_id: {
                type: Sequelize.STRING,
                unique: true
        }, // youtube channel id
        last_upload: Sequelize.STRING, // last uploaded video id
        notif_channel: Sequelize.STRING // channel id of the notif channel in discord
});


client.commands = new Collection();
const commandsFolderPath = path.join(__dirname, 'commands');
const commandsFolder = fs.readdirSync(commandsFolderPath);

for (const folder of commandsFolder) {
        const commandsPath = path.join(commandsFolderPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
        for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command)
                } else {
                        console.log(`missing 'data' and/or 'execute' property in file ${filePath}`)
                };
        };
};



client.on(Events.MessageCreate, async (message) => {
        const parsed = parse(message, prefix, { allowBots: false, allowSpaceBeforeCommand: true });
        if (!parsed.success) return;

        const cmd = message.client.commands.get(parsed.command) || message.client.commands.find(command => command.data.aliases.some(alias => alias === parsed.command));

        if (!cmd) {
                message.reply(`couldn't find command '${parsed.command}'`)
        };

        try {
                await cmd.execute(parsed);
        } catch (error) {
                consolle.log(error);
                message.reply(`error executing command '${parsed.command}'`);
        };
})

client.once(Events.ClientReady, (client) => {
        client.youtubers.sync();
        console.log(`ready,,, logged in as ${client.user.tag} :pleading:`);

        console.log(client.commands);
        setInterval(() => {
                client.commands.get("yt").extra.notify(client);
        }, 20*60*1000) // 5 mins
});

client.login(token);

const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');
const oraImport = require('ora');
const ora = oraImport.default || oraImport;
const gradientImport = require('gradient-string');
const gradient = gradientImport.default || gradientImport;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();

// ─────────────────────────────────────────────────────────────
// Command Loader
// ─────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commandsAction = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commandsAction.push(command.data.toJSON());
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// ─────────────────────────────────────────────────────────────
// Event Loader
// ─────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// ─────────────────────────────────────────────────────────────
// Slash Command Deployment
// ─────────────────────────────────────────────────────────────
const rest = new REST().setToken(token);

(async () => {
    const spinner = ora(chalk.blue('Deploying slash commands...')).start();
    try {
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commandsAction },
        );
        spinner.succeed(chalk.green(`Successfully reloaded ${data.length} commands!`));
    } catch (error) {
        spinner.fail(chalk.red('Failed to deploy commands.'));
        console.error(error);
    }
})();

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────
client.login(token);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

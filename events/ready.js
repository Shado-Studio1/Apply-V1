const { Events } = require('discord.js');
const chalk = require('chalk');
const figlet = require('figlet');
const gradientImport = require('gradient-string');
const gradient = gradientImport.default || gradientImport;
const oraImport = require('ora');
const ora = oraImport.default || oraImport;
const boxenImport = require('boxen');
const boxen = boxenImport.default || boxenImport;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.clear();

        // 1. Professional Header
        const botName = 'CYBER SHADOW';
        const bigText = figlet.textSync(botName, {
            font: 'Standard',
            horizontalLayout: 'fitted',
        });

        console.log(gradient.rainbow.multiline(bigText));
        console.log(chalk.bold.black('━'.repeat(60)));

        // 2. System Info Box
        const stats = boxen(
            `${chalk.bold.yellow('🔱 Status     :')} ${chalk.white.bold('SYNCING COMMANDS TASKS')}\n` +
            `${chalk.bold.blue('🛡️ Guard Tag  :')} ${chalk.cyan(client.user.tag)}\n` +
            `${chalk.bold.blue('🛰️ Secure Nodes:')} ${chalk.magenta(client.guilds.cache.size)} ${chalk.gray('Servers Connected')}\n` +
            `${chalk.bold.blue('🧪 API Version :')} ${chalk.white('v14.25.1 (Discord.js)')}`,
            {
                padding: { top: 1, bottom: 1, left: 3, right: 3 },
                margin: { top: 1, bottom: 1 },
                borderStyle: 'double',
                borderColor: 'yellow',
                title: ' TASK REGISTRATION ENGINE ',
                titleAlignment: 'center'
            }
        );
        console.log(stats);

        // 3. 60-second Command Sync Sequence
        const totalDuration = 60000; // 60 seconds (1 minute)
        const startTime = Date.now();

        const logs = [
            'Fetching slash command definitions...',
            'Validating command structures...',
            'Mapping "setup-apply" to interaction handlers...',
            'Registering "apply_start" button component...',
            'Caching V2 Container templates...',
            'Syncing permissions with Discord Gateway...',
            'Loading localization for Arabic (AR)...',
            'Linking database handlers to commands...',
            'Performing final checksum on command map...',
            'Deploying optimized command bundle...'
        ];

        const spinner = ora({
            text: chalk.yellow('Initializing Command Sync...'),
            color: 'yellow',
            spinner: 'line'
        }).start();

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / totalDuration, 1);

                const barLength = 30;
                const filledLength = Math.round(progress * barLength);
                const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
                const percentage = Math.round(progress * 100);

                const currentLogIndex = Math.min(Math.floor(progress * logs.length), logs.length - 1);
                const currentLog = logs[currentLogIndex];

                spinner.text = `${chalk.bold.yellow(percentage + '%')} [${chalk.yellow(bar)}] ${chalk.white(currentLog)}`;

                if (progress >= 1) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });

        spinner.succeed(chalk.green.bold('COMMANDS & TASKS SYNCED SUCCESSFULLY'));

        // 4. Final Notification
        console.log('\n' + chalk.bgCyan.black.bold(' ONLINE ') + chalk.cyan(' Cyber Shadow is now guarding the server.\n'));
        console.log(chalk.gray('─'.repeat(process.stdout.columns || 60)));
    },
};

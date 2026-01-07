const fs = require('node:fs');
const readline = require('node:readline');
const chalk = require('chalk');
const figlet = require('figlet');

const gradientImport = require('gradient-string');
const gradient = gradientImport.default || gradientImport;

// USE A STABLE INTERFACE WITHOUT SPINNER INTERFERENCE
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startSetup() {
    try {
        console.clear();

        // Header
        console.log(gradient.rainbow.multiline(figlet.textSync('OXYGEN V2', { font: 'Standard' })));
        console.log(chalk.cyan('━'.repeat(60)));

        console.log(chalk.bold.yellow('\n[!] WARNING: This will overwrite config.json.'));
        const confirm = await ask(chalk.white('❓ Type "y" to proceed: '));

        if (confirm.toLowerCase() !== 'y') {
            console.log(chalk.red('\n[✖] Cancelled.'));
            rl.close();
            return;
        }

        const config = {};
        const fields = [
            { key: 'token', label: 'Discord Bot Token', icon: '🔑' },
            { key: 'clientId', label: 'Application Client ID', icon: '🛡️' },
            { key: 'mongoUri', label: 'MongoDB Connection URI', icon: '🌀' },
            { key: 'applyChannelId', label: 'Log Channel ID', icon: '📡' },
            { key: 'programmerRole', label: 'Programmer Role ID', icon: '💻' },
            { key: 'supportRole', label: 'Support Role ID', icon: '🎧' }
        ];

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            console.log('\n' + chalk.bold.cyan(`┌── [STEP ${i + 1}/6] ───────────────────────────`));
            console.log(chalk.bold.cyan(`│ ${field.icon}  REQUESTING: ${field.label}`));

            const value = await ask(chalk.white(`└── ENTER VALUE > `));
            config[field.key] = value.trim();

            console.log(chalk.green(`    ✔ ${field.label} REGISTERED.`));
        }

        console.log('\n' + chalk.cyan('━'.repeat(60)));
        console.log(chalk.bold.yellow('💾 SAVING DATA... PLEASE WAIT.'));

        await sleep(1500);
        fs.writeFileSync('config.json', JSON.stringify(config, null, 4));

        console.log(chalk.green.bold('\n✅ DEPLOYMENT SUCCESSFUL! config.json is ready.'));
        console.log(chalk.white('   Run "npm start" to launch.'));
        console.log(chalk.cyan('━'.repeat(60)) + '\n');

        rl.close();

    } catch (err) {
        console.error(chalk.red('\n[FATAL ERROR]'), err);
        rl.close();
    }
}

startSetup();

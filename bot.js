const discord = require('discord.js');
const client = new discord.Client();

client.on('ready', () => {
    console.log('Bot ready!');
});

client.on('message', message => {
    if (message.content === 'ping' && message.author.tag === "#4590") {
        message.reply('pong');
    }
});

client.login(process.env.BOT_TOKEN);
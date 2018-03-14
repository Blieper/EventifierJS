const discord = require('discord');
const client = new discord.Client();

client.on('ready', () => {
    console.log('Bot ready!');
});

client.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
    }
});

client.login(process.env.BOT_TOKEN);
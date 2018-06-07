app = {};

app.discord   = require('discord.js');
const client  = app.client = new app.discord.Client();
app.commands  = require('./modules/commands');
app.mongoDB   = require('./modules/mongo')

app.mongoDB.init(app);
app.commands.init(app);

client.on('ready', () => {
    console.log('Bot ready!');
});

client.on('message', message => {
    app.checkCommands(message);
});

client.login(process.env.IP.BOT_TOKEN);
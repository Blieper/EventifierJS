app = {};

app.discord   = require('discord.js');
const client  = app.client = new app.discord.Client();
app.commands  = require('./modules/commands');
app.mongoDB   = require('./modules/mongo')

console.log(app.discord.Permissions);

app.mongoDB.init(app);
app.commands.init(app);

client.on('ready', () => {
    console.log('Bot ready!');
});

client.on('message', message => {
    app.checkCommands(message);
});

client.login('NDA5MDYxNTIyNTE4ODM1MjAw.DYskAA.9ybs1_qApvuf7tFIoRPOYHTSAmg');
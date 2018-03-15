exports.init = function (app) {

    app.registerCommand('eventcreate', {
        whitelist: ['205306963444236288', '266640841735405568'],
        pars: [
            {name: "name"}
        ]
    }, x => {
        let guild = x.message.guild;

        guild.createChannel('testchannel', 'category');
    });

}
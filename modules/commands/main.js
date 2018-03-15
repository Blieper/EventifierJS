exports.init = function (app) {

    app.registerCommand('test', {
        pars: [
            { name: 'arandomparameter', type: 'nonnum', optional: true },
        ],
    }, x => {

    });


    app.registerCommand('help', {
        description:
            `This is the command you just used.
You can probably see what it does already.`
    }, x => {
        let embed = {
            embed: {
                color: 16318549,
                title: "Command list",
                description: "Here is a list of commands that you can use with me!",
                fields: [],
            }
        };

        let commands = app.commands;
        let user = x.message.author;

        for (cmd in commands) {

            let command = commands[cmd];

            // Whitelist check
            if (command.settings.whitelist.length > 0) {
                if (command.settings.whitelist.indexOf(user.id) === -1) {
                    continue;
                }
            }

            let textObject = ""

            textObject += "**Command**\n\t";
            textObject += command.command || "-";
            textObject += "\n\n";

            if (command.description) {
                textObject += "**Description**\n\t";
                textObject += command.description.replace(/\n/g, "\n\t");
                textObject += "\n\n";
            }

            if (command.pars) {
                textObject += "**Parameters**\n";

                for (par of command.pars) {
                    textObject += "\t" + par.name + "\t(" + par.type;
                    if (par.optional) {
                        textObject += ", optional"
                    }

                    textObject += ")\n";
                }
            }

            textObject += "\n"

            embed.embed.fields.push({
                name: "--------------------------------------------------------------------------------------------",
                value: textObject
            })
        }

        x.message.author.send(embed);
    });

    console.log('main.js loaded');

}
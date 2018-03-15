exports.init = function (app) {

    app.registerNamespace ('std', {
        whitelist: ['205306963444236288', '266640841735405568','266607839525601281'],
        roles: ['Eventifier Tester'],
        description: `Standard functions`
    });

    app.registerCommand('std','removeChannel', {
        pars: [
            {name: 'id'}
        ],
        roles: ['Administrator'],
        description:
            `Removes the given channel`
    }, x => {
        let guild = x.message.guild;

        x.message.channel.send({
            embed: {
                color: 16318549,
                title: "Searching!",
                description: "Looking for channel " + x.id + "...",
            }
        });

        let channel = guild.channels.find(val => val.id === x.id)

        if (channel) {
            x.message.channel.send({
                embed: {
                    color: 16318549,
                    title: "Deleting!",
                    description: "Deleting channel " + x.id + "...",
                }
            })

            channel.delete().then(x => {
                x.message.channel.send({
                    embed: {
                        color: 16318549,
                        title: "Success!",
                        description: "Channel removed!",
                    }
                })
            });            
        } else {
            x.message.channel.send({
                embed: {
                    color: 16318549,
                    title: "Error!",
                    description: "Couldn't find channel!",
                }
            })
        }
    });

    app.registerCommand('std','help', {
        description:
            `This is the command you just used.
You can probably see what it does already.`
    }, x => {
        let namespaces = app.namespaces;
        let user = x.message.author;

        if (x.string.length == 0) {
            let embed = {
                embed: {
                    color: 16318549,
                    title: "Namespace list",
                    description: "Here is a list of namespaces that you have access to. To look at each namespace's commands, type 'std help [name of namespace]'",
                    fields: [],
                }
            };

            for (i in namespaces) {

                let namespace = namespaces[i];

                // Role check
                if (namespace.settings.roles.length > 0) {
                    if (!message.member.roles.some(r => namespace.settings.roles.includes(r.name))) {
                        return
                    } 
                }

                // Whitelist check
                if (namespace.settings.whitelist.length > 0) {
                    if (namespace.settings.whitelist.indexOf(user.id) === -1) {
                        continue;
                    }
                }

                let textObject = ""

                textObject += "**Namespace**\n\t";
                textObject += namespace.name || "-";
                textObject += "\n\n";

                if (namespace.description) {
                    textObject += "**Description**\n\t";
                    textObject += namespace.description.replace(/\n/g, "\n\t");
                    textObject += "\n\n";
                }

                textObject += "\n"

                embed.embed.fields.push({
                    name: "--------------------------------------------------------------------------------------------",
                    value: textObject
                })
            }

            x.message.author.send(embed);
        } else {
            let namespace = null;

            for (i in namespaces) {
                if (namespaces[i].name.search(x.string) === 0) {
                    namespace = namespaces[i];

                    break;
                }
            }

            if (!namespace) {
                return;
            }

            let commands = namespace.commands;
            let user = x.message.author;

            let embed = {
                embed: {
                    color: 16318549,
                    title: "Commands for '" + namespace.name + "'",
                    description: namespace.description,
                    fields: [],
                }
            };

            for (cmd in commands) {
                let command = commands[cmd];

                // Role check
                if (namespace.settings.roles.length > 0) {
                    if (!message.member.roles.some(r => namespace.settings.roles.includes(r.name))) {
                        return
                    } 
                }
                // Whitelist check
                if (command.settings.whitelist.length > 0) {
                    if (command.settings.whitelist.indexOf(user.id) === -1) {
                        continue;
                    }
                }

                let textObject = ""

                textObject += "**Command**\n\t";
                textObject += command.name || "-";
                textObject += "\n\n";

                if (command.pars) {
                    textObject += "**Parameters**\n";

                    for (par of command.pars) {
                        textObject += "\t" + par.name + "\t(" + (par.type || 'string');
                        if (par.optional) {
                            textObject += ", optional"
                        }

                        textObject += ")\n";
                    }

                    textObject += "\n";
                }

                if (command.description) {
                    textObject += "**Description**\n\t";
                    textObject += command.description.replace(/\n/g, "\n\t");
                    textObject += "\n\n";
                }


                textObject += "\n"

                embed.embed.fields.push({
                    name: "--------------------------------------------------------------------------------------------",
                    value: textObject
                })
            }

            x.message.author.send(embed);
        }
    });

    console.log('main.js loaded');

}

exports.prefix = '!';

exports.init = function (app) {
    app.isHelping = [];
    app.namespaces = [];

    app.commandFeedback = function (msg, err, opt) {
        if (!opt) {
            opt = {}
        }

        console.log(JSON.stringify(opt));

        msg.channel.send({
            embed: {
                color: 16318549,
                title: opt.type || "Error!",
                description: err,
            }
        });

        if (!opt.type) {
            console.log('enabling help');
            app.isHelping[msg.author.id] = false;
            return;
        }

        if (opt.end) {
            if (opt.end === true) {
                console.log('enabling help');
                app.isHelping[msg.author.id] = false;
            }
        }
    }

    app.registerNamespace = function (namespace, settings) {
        app.namespaces[namespace] = {
            name: namespace,
            settings: {},
            description: settings.description,
            commands: []
        }

        let cmdset = app.namespaces[namespace].settings;
        cmdset.whitelist = settings.whitelist || [];
        cmdset.roles = settings.roles || [];

        console.log('New namespace registered: ' + JSON.stringify(app.namespaces[namespace]));
    }

    app.registerCommand = function (namespace, command, settings, callback) {
        app.namespaces[namespace].commands[command] = {
            name: command,
            namespace: app.namespaces[namespace],
            settings: {},
            callback: callback,
            pars: settings.pars,
            description: settings.description,
            antispam: settings.antispam
        };

        settings.pars = undefined;

        let cmdset = app.namespaces[namespace].commands[command].settings;

        cmdset.whitelist = settings.whitelist || [];
        cmdset.useSingleString = true;
        cmdset.roles = settings.roles || [];

        if (app.namespaces[namespace].commands[command].pars !== undefined) {
            cmdset.useSingleString = false;
        }
    }

    app.checkCommands = function (message) {
        let smessage = message.content;

        if (smessage.search(exports.prefix) === 0) {
            smessage = smessage.substring(exports.prefix.length);
        } else {
            return;
        }

        for (i in app.namespaces) {
            let namespace = app.namespaces[i];

            // Namespace found!
            if (smessage.search(namespace.name) === 0) {
                let user = message.author;

                if (app.isHelping[user.id] === true) {
                    return;
                }
                
                smessage = smessage.substring(namespace.name.length + 1);

                // Role check
                if (namespace.settings.roles.length > 0 && message.guild) {
                    if (!message.member.roles.some(r => namespace.settings.roles.includes(r.name))) {
                        return
                    }
                }

                // Whitelist check
                if (namespace.settings.whitelist.length > 0) {
                    if (namespace.settings.whitelist.indexOf(user.id) === -1) {
                        return;
                    }
                }

                for (j in namespace.commands) {
                    let command = namespace.commands[j];

                    // Namespace found!
                    if (smessage.search(command.name) === 0) {
                        // Role check
                        if (command.settings.roles.length > 0 && message.guild) {
                            if (!message.member.roles.some(r => command.settings.roles.includes(r.name))) {
                                return
                            }
                        }

                        // Whitelist check
                        if (command.settings.whitelist.length > 0) {
                            if (command.settings.whitelist.indexOf(user.id) === -1) {
                                return;
                            }
                        }

                        if (command.antispam) {
                            app.isHelping[user.id] = true;
                        }

                        // Get string after command
                        let afterCommand = smessage.substring(command.name.length + 1).trim();

                        // Initiate input object
                        let input = {};

                        let argsJSONString = afterCommand;
                        let isInMarkdown = false;

                        // Cleanup new line characters 
                        for (i = argsJSONString.length-1; i > 0; i--) {
                            let mdLookAhead = argsJSONString[i] + argsJSONString[i - 1] + argsJSONString[i - 2];
                            if (mdLookAhead === "```") {
                                isInMarkdown = !isInMarkdown;
                                i -= 2;
                                continue;
                            } 

                            if (!isInMarkdown) {
                                if (argsJSONString[i] === "\n") {
                                    let left = argsJSONString.substring(0,i);
                                    let right = argsJSONString.substring(i+1);
                                
                                    argsJSONString = left + right;
                                    i--;
                                }
                            }
                        }

                        if (!command.settings.useSingleString) {
                            try {
                                // Quote elements in string
                                argsJSONString = argsJSONString.replace(/(```(.|\n)*```)|([^,\s:][\w\d\s\'\"]*[^:,])/g, function (x) {
                                    let ret = '"' + x + '"';
                                    return ret;
                                });

                                // Change existing line breaks
                                argsJSONString = argsJSONString.replace(/\n/g, '\\n');

                                // Get JSON object
                                argsJSONString = '{' + argsJSONString + '}';

                                let json = JSON.parse(argsJSONString);

                                for (j in json) {
                                    if (json[j].startsWith("```") && json[j].endsWith("```")) {
                                        json[j] = json[j].substring(3, json[j].length - 3);
                                    }
                                }
                                // Set input to the json object
                                input = json;

                                let parErr = ''
                                let hasError = false;

                                let queried = json;
                                // Get pars from the command
                                let pars = command.pars;

                                // Check for pars that are not meant to be there
                                for (i of Object.keys(json)) {
                                    let exists = false;

                                    for (par of pars) {
                                        let name = par.name;

                                        if (name === i) {
                                            exists = true;
                                            break;
                                        }
                                    }

                                    if (!exists) {
                                        app.commandFeedback(message, "Unexpected argument found: '" + i + "'");
                                        return;
                                    }
                                }

                                // Check if pars are correct
                                for (par of pars) {
                                    let name = par.name;
                                    let type = par.type || 'string';
                                    let optional = par.optional || false;
                                    let pattern = par.pattern || null;

                                    //find in query
                                    let inQuery = queried[name];

                                    if (!optional && inQuery == undefined) {
                                        parErr += '\tRequired parameter \'' + name + '\' not found!';
                                        hasError = true;
                                        continue;
                                    }

                                    if (optional && inQuery == undefined) {
                                        continue;
                                    }

                                    if (pattern) {
                                        console.log(pattern);

                                        if (!pattern.test(inQuery)) {
                                            parErr += '\tParameter \'' + name + '\' does not match required pattern!';
                                            hasError = true;
                                            continue;
                                        }
                                    }

                                    if (type == "numeric" && Number(inQuery) == NaN) {
                                        parErr += '\tParameter \'' + name + '\' expected a numeric value, but got a string value instead!\n';
                                        hasError = true;
                                    }

                                    if (type == "nonnum" && !(Number(inQuery) !== Number(inQuery))) {
                                        parErr += '\tParameter \'' + name + '\' expected a non-numeric value, but got a numeric value instead!\n';
                                        hasError = true;
                                    }
                                }

                                // Error in the parameters
                                if (hasError) {
                                    app.commandFeedback(message, parErr);

                                    return;
                                }
                            } catch (err) {
                                // JSON object could not be created due to bad formatting

                                app.commandFeedback(message, "This command needs arguments. Be sure to format this command as:\n'command [key]:[value][, [key]:[value]*]'");

                                return;
                            }
                        }

                        // Set message object and aftercommand string
                        input.message = message;
                        input.string = afterCommand.trim();

                        // Call function
                        command.callback(input);
                    }
                }
            }
        }
    }

    require('./commands/events.js').init(app);
    require('./commands/main.js').init(app);

}
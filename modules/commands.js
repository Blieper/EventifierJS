
exports.prefix = '!';

exports.init = function (app) {
    app.namespaces = [];

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
            settings: {},
            callback: callback,
            pars: settings.pars,
            description: settings.description
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

                smessage = smessage.substring(namespace.name.length + 1);

                // Role check
                if (namespace.settings.roles.length > 0) {
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
                        if (command.settings.roles.length > 0) {
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

                        // Get string after command
                        let afterCommand = smessage.substring(command.name.length + 1)

                        // Initiate input object
                        let input = {};

                        if (!command.settings.useSingleString) {
                            try {
                                // Quote elements in string
                                let argsJSONString = afterCommand.replace(/[^:,()\s][\w\s\d]*/g, function (x) {
                                    let ret = '"' + x + '"';
                                    return ret;
                                });

                                // Get JSON object
                                argsJSONString = '{' + argsJSONString + '}';

                                let json = JSON.parse(argsJSONString);

                                // Set input to the json object
                                input = json;

                                let parErr = ''
                                let hasError = false;

                                let queried = json;
                                // Get pars from the command
                                let pars = command.pars;

                                // Check if pars are correct
                                for (par of pars) {
                                    let name = par.name;
                                    let type = par.type || 'string';
                                    let optional = par.optional || false;

                                    //find in query
                                    let inQuery = queried[name];

                                    if (!optional && inQuery == undefined) {
                                        parErr += '\tRequired parameter \'' + name + '\' not found!';
                                        hasError = true;
                                        continue;
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
                                    message.channel.send({
                                        embed: {
                                            color: 16318549,
                                            title: "Command error!",
                                            description: parErr,
                                        }
                                    });

                                    return;
                                }
                            } catch (err) {

                                // JSON object could not be created due to bad formatting
                                message.channel.send({
                                    embed: {
                                        color: 16318549,
                                        title: "Error!",
                                        description: "This command needs arguments. Be sure to format this command as:\n'command [key]:[value][, [key]:[value]*]'",
                                    }
                                });

                                return;
                            }
                        }

                        // Set message object and aftercommand string
                        input.message = message;
                        input.string = afterCommand;

                        console.log(input);

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
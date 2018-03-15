
exports.init = function (app) {
    app.commands = [];

    app.registerCommand = function (command, settings, callback) {
        app.commands[command] = {
            command: command,
            settings: {},
            callback: callback,
            pars: settings.pars,
            description: settings.description
        };

        settings.pars = undefined;

        let cmdset = app.commands[command].settings;

        cmdset.whitelist = settings.whitelist || [];
        cmdset.useSingleString = true;

        if (app.commands[command].pars !== undefined) {
            cmdset.useSingleString = false;
        }

        console.log(command + ": " + app.commands[command].pars + ", " + JSON.stringify(app.commands[command].settings));
    }

    app.checkCommands = function (message) {
        for (i in app.commands) {
            let command = app.commands[i];

            // Command found!
            if (message.content.search(command.command) === 0) {
                let user = message.author;

                // Whitelist check
                if (command.settings.whitelist.length > 0) {
                    if (command.settings.whitelist.indexOf(user.id) === -1) {
                        return;
                    }
                }

                // Get string after command
                let afterCommand = message.content.substring(command.command.length + 1)

                // Initiate input object
                let input = {};

                if (!command.settings.useSingleString) {
                    try {
                        // Quote elements in string
                        let argsJSONString = afterCommand.replace(/\w+/g, function (x) {
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
                            message.reply({
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
                        message.reply({
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
                input.string =  afterCommand;

                // Call function
                command.callback(input);
            }
        }
    }

    require('./commands/events.js').init(app);
    require('./commands/main.js').init(app);

}
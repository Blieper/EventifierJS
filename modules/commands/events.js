exports.init = function (app) {

    app.registerNamespace('event', {
        whitelist: ['205306963444236288', '266640841735405568', '266607839525601281'],
        description: `This namespace is dedicated to event commands.`,
        roles: ["Eventifier Tester"]
    });

    app.registerCommand('event', 'delete', {
        whitelist: ['205306963444236288', '266640841735405568', '266607839525601281'],
        pars: [
            { name: "name", optional: true },
            { name: "user", optional: true },
        ],
        description: `Deletes the specified event. 
This will get rid of it's channels.`
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }

        let query = {};

        if (x.user) {
            query = { userid: x.user }
        } else {
            query = { name: x.name }
        }

        // try to find event with the same name
        dbo.collection('events').findOne(query, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                app.commandFeedback(x.message, 'Deleting event... (' + result.name + ')', {type: "Callback!"});

                let channel = guild.channels.find(val => val.id === result.eventData.general)
                if (channel) {
                    channel.delete()
                        .then(() => {
                            let channel = guild.channels.find(val => val.id === result.eventData.host)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            let channel = guild.channels.find(val => val.id === result.eventData.voice)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            let channel = guild.channels.find(val => val.id === result.eventData.category)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            let role = guild.roles.get(result.eventData.role);
                            if (role) {
                                role.delete()
                                app.commandFeedback(x.message, 'Deleting role...', {type: "Callback!"});
                            }
                        }).then(() => {
                            let role = guild.roles.get(result.eventData.hostrole);
                            if (role) {
                                role.delete()
                                app.commandFeedback(x.message, 'Deleting host role...', {type: "Callback!"});
                            }
                        }).then(() => {
                            app.commandFeedback(x.message, 'Successfully deleted channels! (' + result.name + ')', {type: "Callback!"});

                            dbo.collection("events").deleteOne({ name: result.name }, function (err, obj) {
                                if (err) throw err;
                                console.log("1 document deleted");

                                app.commandFeedback(x.message, 'Successfully deleted event from database!', {end: true, type: "Callback!"});
                            });
                        }).catch(err => {
                            app.commandFeedback(x.message, 'Error while deleting channels (' + result.name + ')');
                        });
                }
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
            }
        });
    });

    app.registerCommand('event', 'create', {
        whitelist: ['205306963444236288', '266640841735405568', '266607839525601281'],
        pars: [
            { name: "name", pattern: "[^\n][\w\d\s']+" }
        ],
        description: `Creates an event with the name 'name'. 
Automatically makes a voice, general and host channel inside a special category.`
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }

        // try to find current event hosted by user
        dbo.collection('events').findOne({ userid: x.message.author.id }, { _id: 0, userid: 1, name: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                // Don't do anything if the user is found
                console.log('Event from user found! (' + result.name + ')');

                app.commandFeedback(x.message, "It seems like you're already hosting an event. (" + result.name + ")");
            } else {
                // try to find event with the same name
                dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1 }, function (err, result) {
                    if (err) throw err;

                    if (result) {
                        // Don't do anything if the user is found
                        console.log('An event with that name already exists! (' + result.name + ')');

                        app.commandFeedback(x.message, 'An event with that name already exists! (' + result.name + ')');
                    } else {
                        let name = x.name.replace(/\s/, '-');

                        let eventData = {}

                        // Create a new contestant role
                        guild.createRole({
                            name: x.name + ' Host', color: 'BLUE',
                        }).then(role => {
                            eventData.hostrole = role.id;

                            x.message.member.addRole(role);

                            // Create a new contestant role
                            return guild.createRole({
                                name: x.name,
                                color: 'BLUE',
                            })
                        }).then(role => {
                            eventData.role = role.id;

                            x.message.member.addRole(role);
                        }).then(() => {
                            return guild.createChannel(x.name, 'category')
                        }).then(ch => {
                            eventData.category = ch.id;

                            return guild.createChannel('general', 'text')
                        }).then(ch => {
                            eventData.general = ch.id;
                            ch.setParent(eventData.category);

                            ch.overwritePermissions(guild.roles.find("name", "@everyone"), {
                                SEND_MESSAGES: false
                            })

                            ch.overwritePermissions(guild.roles.get(eventData.role), {
                                SEND_MESSAGES: true
                            })

                            ch.overwritePermissions(guild.roles.get(eventData.hostrole), {
                                SEND_MESSAGES: true
                            })

                            return guild.createChannel('host', 'text')
                        }).then(ch => {
                            eventData.host = ch.id;
                            ch.setParent(eventData.category);

                            ch.overwritePermissions(guild.roles.find("name", "@everyone"), {
                                VIEW_CHANNEL: false
                            })

                            ch.overwritePermissions(guild.roles.get(eventData.role), {
                                VIEW_CHANNEL: false
                            })

                            ch.overwritePermissions(guild.roles.get(eventData.hostrole), {
                                VIEW_CHANNEL: true
                            })

                            return guild.createChannel('voice', 'voice')
                        }).then(ch => {
                            eventData.voice = ch.id;
                            ch.setParent(eventData.category);

                            ch.overwritePermissions(guild.roles.find("name", "@everyone"), {
                                VIEW_CHANNEL: false
                            })

                            ch.overwritePermissions(guild.roles.get(eventData.role), {
                                VIEW_CHANNEL: true
                            })

                            ch.overwritePermissions(guild.roles.get(eventData.hostrole), {
                                VIEW_CHANNEL: true
                            })
                        }).then(() => {
                            let doc = {
                                userid: x.message.author.id,
                                name: x.name,
                                eventData: eventData,
                                description: x.description,
                                isEvent: true
                            }

                            dbo.collection('events').insertOne(doc, function (err, res) {
                                if (err) throw err;

                                app.commandFeedback(x.message, "New event called '" + x.name + "' created!", {end: true, type: "Callback!"});

                                console.log("1 document inserted: \n" + res);
                            });
                        });
                    }
                });
            }
        });
    });

    app.registerCommand('event', 'list', {
        description: `Lists all of the current events.`
    }, x => {
        let dbo = app.db.db('eventifierjs');

        let embed = {
            embed: {
                color: 16318549,
                title: "Events",
                description: "All current events that are currently being hosted",
                fields: [],
            }
        };

        // try to find current events
        dbo.collection("events").find({ isEvent: true }, { _id: 0, userid: 1, name: 1 }).toArray(function (err, result) {
            if (err) throw err;

            for (event of result) {
                let textObject = ""

                textObject += "**Name**\n\t";
                textObject += event.name || "-";
                textObject += "\n\n";

                if (event.description) {
                    textObject += "**Description**\n\t";
                    textObject += event.description.replace(/\n/g, "\n\t");
                    textObject += "\n\n";
                }

                textObject += "\n"

                embed.embed.fields.push({
                    name: "--------------------------------------------------------------------------------------------",
                    value: textObject
                })
            }

            x.message.author.send(embed);
        });
    });
}
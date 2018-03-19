exports.init = function (app) {

    app.registerNamespace('event', {
        description: `This namespace is dedicated to event commands.`,
        //roles: ["Eventifier Tester"]
    });

    app.registerCommand('event', 'delete', {
        roles: ["Administrator"],
        pars: [
            { name: "name", optional: true },
            { name: "user", optional: true },
        ],
        description: `Deletes the specified event.`,
        antispam: true
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
                app.commandFeedback(x.message, 'Deleting event... (' + result.name + ')', { type: "Callback!" });

                let channel = guild.channels.find(val => val.id === result.eventData.general)
                if (channel) {
                    channel.delete()
                        .then(() => {
                            let channel = guild.channels.find(val => val.id === result.eventData.host)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            let channel = guild.channels.find(val => val.id === result.eventData.descchannel)
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
                                app.commandFeedback(x.message, 'Deleting role...', { type: "Callback!" });
                            }
                        }).then(() => {
                            let role = guild.roles.get(result.eventData.hostrole);
                            if (role) {
                                role.delete()
                                app.commandFeedback(x.message, 'Deleting host role...', { type: "Callback!" });
                            }
                        }).then(() => {
                            app.commandFeedback(x.message, 'Successfully deleted channels! (' + result.name + ')', { type: "Callback!" });

                            dbo.collection("events").deleteOne({ name: result.name }, function (err, obj) {
                                if (err) throw err;

                                app.commandFeedback(x.message, 'Successfully deleted event from database!', { end: true, type: "Callback!" });
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
        pars: [
            { name: "name", pattern: /[\w\d' ]{4,}/g },
            { name: "color", optional: true, pattern: /#([0-9a-fA-F]{6})/g },
            { name: "description", optional: true },
        ],
        description: `Creates an event with the given name. 
Automatically makes a voice, general, description and host channel inside a special category.`,
        antispam: true
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
                app.commandFeedback(x.message, "It seems like you're already hosting an event. (" + result.name + ")");
            } else {
                // try to find event with the same name
                dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1 }, function (err, result) {
                    if (err) throw err;

                    if (result) {
                        // Don't do anything if the user is found
                        app.commandFeedback(x.message, 'An event with that name already exists! (' + result.name + ')');
                    } else {
                        let name = x.name.replace(/\s/, '-');

                        let eventData = {}

                        // eventData.hosts = [x.message.author.id];
                        // eventData.members = [x.message.author.id];
                        eventData.color = x.color || Math.floor(Math.random() * 16777215);

                        // Create a new contestant role
                        guild.createRole({
                            name: x.name + ' Host', color: eventData.color,
                        }).then(role => {
                            eventData.hostrole = role.id;

                            x.message.member.addRole(role);

                            // Create a new contestant role
                            return guild.createRole({
                                name: x.name,
                                color: eventData.color,
                            })
                        }).then(role => {
                            eventData.role = role.id;

                            x.message.member.addRole(role);
                        }).then(() => {
                            return guild.createChannel(x.name, 'category')
                        }).then(ch => {
                            eventData.category = ch.id;

                            return guild.createChannel('description', 'text')
                        }).then(ch => {
                            eventData.descchannel = ch.id;
                            ch.setParent(eventData.category);

                            ch.overwritePermissions(guild.roles.find("name", "@everyone"), {
                                SEND_MESSAGES: false
                            })

                            ch.send("```" + (x.description || " ") + "```")

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
                                hosts: [x.message.author.id],
                                members: [x.message.author.id],
                                isEvent: true,
                            }

                            dbo.collection('events').insertOne(doc, function (err, res) {
                                if (err) throw err;

                                app.commandFeedback(x.message, "New event called '" + x.name + "' created!", { end: true, type: "Callback!" });
                            });
                        });
                    }
                });
            }
        });
    });

    app.registerCommand('event', 'set', {
        pars: [
            { name: "name" },
            { name: "newname", optional: true, pattern: /[\w\d' ]{4,}/g },
            { name: "color", optional: true, pattern: /#([0-9a-fA-F]{6})/g },
            { name: "description", optional: true },
        ],
        description: `Sets the given items of the specified event.`,
        antispam: true
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                let channel = guild.channels.find(val => val.id === result.eventData.category)
                let cloneQuery = { name: x.newname || x.name }

                // try to find event with the same name
                dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
                    if (err) throw err;

                    if (result) {
                        let cloneQuery = { name: x.newname || "@" }

                        // Check if user is a host
                        if (result.hosts.indexOf(x.message.author.id) === -1) {
                            app.commandFeedback(x.message, 'You are not a host of that event!');

                            return;
                        }

                        let event = result;

                        // try to find event with the same new name
                        dbo.collection('events').findOne(cloneQuery, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
                            if (err) throw err;

                            if (result) {
                                // Don't do anything if an event with the same name is found
                                app.commandFeedback(x.message, 'An event with that name already exists! (' + result.name + ')');
                            } else {
                                let category = guild.channels.find(val => val.id === event.eventData.category);
                                let hostrole = guild.roles.get(event.eventData.hostrole);
                                let role = guild.roles.get(event.eventData.role);

                                let newvalues = { $set: {} };

                                if (x.color) {
                                    newvalues.$set.color = x.color;

                                    // Set the color of the role
                                    role.setColor(x.color)
                                        .then(updated => console.log(`Set color of role to ${role.color}`))
                                        .catch(console.error);

                                    // Set the color of the role
                                    hostrole.setColor(x.color)
                                        .then(updated => console.log(`Set color of host role to ${role.color}`))
                                        .catch(console.error);
                                }

                                if (x.newname) {
                                    newvalues.$set.name = x.newname;

                                    // Set the name of the role
                                    role.setName(x.newname)
                                        .then(updated => console.log(`Edited role name from ${role.name} to ${updated.name}`))
                                        .catch(console.error);

                                    // Set the name of the host role
                                    hostrole.setName(x.newname + ' Host')
                                        .then(updated => console.log(`Edited host role name from ${role.name} to ${updated.name}`))
                                        .catch(console.error);

                                    category.setName(x.newname)
                                        .then(updated => console.log(`Edited category name from ${category.name} to ${updated.name}`))
                                        .catch(console.error);
                                }

                                if (x.description) {
                                    newvalues.$set.description = x.description;

                                    let descchannel = guild.channels.find(val => val.id === event.eventData.descchannel);

                                    descchannel.fetchMessage(descchannel.lastMessageID).then(msg => {
                                        msg.delete();
                                    });

                                    descchannel.send("```" + (x.description || eventData.description || " ") + "```")
                                }

                                dbo.collection("events").updateOne({ name: event.name }, newvalues, function (err, res) {
                                    if (err) throw err;
                                    app.commandFeedback(x.message, 'Updated event items!', { end: true, type: 'Callback!' });
                                });
                            }
                        });
                    } else {
                        app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
                    }
                });
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
            }
        });
    });

    app.registerCommand('event', 'join', {
        pars: [
            { name: "name" }
        ],
        description: `Makes you join the given event.`,
        antispam: true
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                let cloneQuery = { name: x.newname || x.name }

                // Check if user isn't already in the event
                if (result.members.indexOf(x.message.author.id) > -1) {
                    app.commandFeedback(x.message, 'You are already part of that event!');

                    return;
                }

                let newvalues = { $push: { members: x.message.author.id } };

                x.message.member.addRole(result.eventData.role);

                dbo.collection("events").updateOne({ name: x.name }, newvalues, function (err, res) {
                    if (err) throw err;
                    app.commandFeedback(x.message, x.message.author.username + " successfully joined '" + x.name + "'!", { end: true, type: 'Callback!' });
                });
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
            }
        });
    });

    app.registerCommand('event', 'leave', {
        pars: [
            { name: "name" }
        ],
        description: `Makes you leave the given event.`,
        antispam: true
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                let cloneQuery = { name: x.newname || x.name }

                // Check if the user isn't the original owner
                if (result.userid === x.message.author.id) {
                    app.commandFeedback(x.message, "You can't leave the event as the original owner!");

                    return;
                }

                // Check if user isn't of the event
                if (result.members.indexOf(x.message.author.id) === -1) {
                    app.commandFeedback(x.message, "You aren't part of that event!");

                    return;
                }

                let newvalues = { $pull: { members: x.message.author.id } };

                x.message.member.removeRole(result.eventData.role);

                dbo.collection("events").updateOne({ name: x.name }, newvalues, function (err, res) {
                    if (err) throw err;
                    app.commandFeedback(x.message, x.message.author.username + " successfully left '" + x.name + "'!", { end: true, type: 'Callback!' });
                });
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
            }
        });
    });

    app.registerCommand('event', 'kick', {
        pars: [
            { name: "name" },
            { name: "user", patten: /.* \d{4}\b/g }
        ],
        description: `Kicks the given user from the given event. Only usable by event hosts`,
        antispam: true
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }
        
        let targetUser = guild.members.find(val => {
            return val.user.username + ' ' + val.user.discriminator === x.user;
        });

        if (!targetUser) {
            app.commandFeedback(x.message, "User not found!");

            return;            
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                let cloneQuery = { name: x.newname || x.name }

                // Check if the user isn't the original owner
                if (result.userid === targetUser.user.id) {
                    app.commandFeedback(x.message, targetUser.user.username + " is the original owner of the event!");

                    return;
                }

                // Check if user isn't of the event
                if (result.members.indexOf(targetUser.user.id) === -1) {
                    app.commandFeedback(x.message, targetUser.user.username + " isn't part of that event!");

                    return;
                }

                // Check if user is a host
                if (result.hosts.indexOf(x.message.author.id) === -1) {
                    app.commandFeedback(x.message, 'Only hosts can kick users from events!');

                    return;
                }

                // Check if user is a host
                if (result.hosts.indexOf(targetUser.user.id) > -1) {
                    app.commandFeedback(x.message, 'Hosts cannot be kicked!');

                    return;
                }

                let newvalues = { $pull: { members: targetUser.user.id } };

                targetUser.removeRole(result.eventData.role);

                dbo.collection("events").updateOne({ name: x.name }, newvalues, function (err, res) {
                    if (err) throw err;
                    app.commandFeedback(x.message, targetUser.user.username + " got kicked from '" + result.name + "'!", { end: true, type: 'Callback!' });
                });
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
            }
        });
    });

    app.registerCommand('event', 'addHost', {
        pars: [
            { name: "name" },
            { name: "user", patten: /.* \d{4}\b/g }
        ],
        description: `Adds a host to the given event. Only usable by event owners.`,
        antispam: true
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }

        let targetUser = guild.members.find(val => {
            return val.user.username + ' ' + val.user.discriminator === x.user;
        });

        if (!targetUser) {
            app.commandFeedback(x.message, "User not found!");

            return;            
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                let cloneQuery = { name: x.newname || x.name }

                // Check if the user isn't the original owner
                if (result.userid !== x.message.author.id) {
                    app.commandFeedback(x.message, "Only the original owner can add hosts!");

                    return;
                }

                // Check if the user isn't the original owner
                if (result.userid === targetUser.user.id) {
                    app.commandFeedback(x.message, targetUser.user.username + " is the original owner of the event!");

                    return;
                }

                // Check if user isn't of the event
                if (result.members.indexOf(targetUser.user.id) === -1) {
                    app.commandFeedback(x.message, targetUser.user.username + " isn't part of that event!");

                    return;
                }

                // Check if user is a host
                if (result.hosts.indexOf(targetUser.user.id) > -1) {
                    app.commandFeedback(x.message, targetUser.user.username + ' is already a host!');

                    return;
                }

                let newvalues = { $push: { hosts: targetUser.user.id } };

                targetUser.addRole(result.eventData.hostrole);

                dbo.collection("events").updateOne({ name: x.name }, newvalues, function (err, res) {
                    if (err) throw err;
                    app.commandFeedback(x.message, targetUser.user.username + " is now a host of '" + result.name + "'!", { end: true, type: 'Callback!' });
                });
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
            }
        });
    });

    app.registerCommand('event', 'removeHost', {
        pars: [
            { name: "name" },
            { name: "user", patten: /.* \d{4}\b/g }
        ],
        description: `Removes a host of the given event. Only usable by event owners.`,
        antispam: true
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            app.commandFeedback(x.message, "Couldn't find server. Are you doing this in a DM chat?");

            return;
        }
        
        let targetUser = guild.members.find(val => {
            return val.user.username + ' ' + val.user.discriminator === x.user;
        });

        if (!targetUser) {
            app.commandFeedback(x.message, "User not found!");

            return;            
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, eventData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                let cloneQuery = { name: x.newname || x.name }

                // Check if the user isn't the original owner
                if (result.userid !== x.message.author.id) {
                    app.commandFeedback(x.message, "Only the original owner can remove hosts!");

                    return;
                }

                // Check if the user isn't the original owner
                if (result.userid === targetUser.user.id) {
                    app.commandFeedback(x.message, targetUser.user.username + " is the original owner of the event!");

                    return;
                }

                // Check if user isn't of the event
                if (result.members.indexOf(targetUser.user.id) === -1) {
                    app.commandFeedback(x.message, targetUser.user.username + " isn't part of that event!");

                    return;
                }

                // Check if user is a host
                if (result.hosts.indexOf(targetUser.user.id) === -1) {
                    app.commandFeedback(x.message, targetUser.user.username + " isn't a host for that event!");

                    return;
                }

                let newvalues = { $pull: { hosts: targetUser.user.id } };

                targetUser.removeRole(result.eventData.hostrole);

                dbo.collection("events").updateOne({ name: x.name }, newvalues, function (err, res) {
                    if (err) throw err;
                    app.commandFeedback(x.message, targetUser.user.username + " is not a host of '" + x.name + "' anymore!", { end: true, type: 'Callback!' });
                });
            } else {
                app.commandFeedback(x.message, 'No such event found! (' + x.name + ')');
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
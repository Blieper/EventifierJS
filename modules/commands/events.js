exports.init = function (app) {

    app.registerCommand('deleteevent', {
        whitelist: ['205306963444236288', '266640841735405568','266607839525601281'],
        pars: [
            { name: "name" }
        ],
        description: `Deletes the specified event. 
This will get rid of it's channels.`
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            x.message.channel.send({
                embed: {
                    color: 16318549,
                    title: "Event error!",
                    description: "Couldn't find server. Are you doing this in a DM chat?",
                }
            }); 
            
            return;
        }

        // try to find event with the same name
        dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1, channelData: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                x.message.channel.send({
                    embed: {
                        color: 16318549,
                        title: "Event command!",
                        description: 'Deleting event... (' + result.name + ')',
                    }
                });

                let channel = guild.channels.find(val => val.id === result.channelData.general)
                if (channel) {
                    channel.delete()
                        .then(() => {
                            let channel = guild.channels.find(val => val.id === result.channelData.host)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            let channel = guild.channels.find(val => val.id === result.channelData.voice)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            let channel = guild.channels.find(val => val.id === result.channelData.category)
                            if (channel) {
                                channel.delete()
                            }
                        }).then(() => {
                            x.message.channel.send({
                                embed: {
                                    color: 16318549,
                                    title: "Event command!",
                                    description: 'Successfully deleted channels! (' + result.name + ')',
                                }
                            })

                            dbo.collection("events").deleteOne({ name: result.name }, function (err, obj) {
                                if (err) throw err;
                                console.log("1 document deleted");
                                x.message.channel.send({
                                    embed: {
                                        color: 16318549,
                                        title: "Event callback!",
                                        description: 'Successfully deleted event from database!',
                                    }
                                })
                            });
                        }).catch(err => {
                            x.message.channel.send({
                                embed: {
                                    color: 16318549,
                                    title: "Event error!",
                                    description: 'Error while deleting channels (' + result.name + ')',
                                }
                            });
                        });
                }
            } else {
                x.message.channel.send({
                    embed: {
                        color: 16318549,
                        title: "Event error!",
                        description: 'No such event found! (' + x.name + ')',
                    }
                });
            }
        });
    });

    app.registerCommand('eventcreate', {
        whitelist: ['205306963444236288', '266640841735405568','266607839525601281'],
        pars: [
            { name: "name" }
        ],
        description: `Creates an event with the name 'name'. 
Automatically makes a voice, general and host channel inside a special category.`
    }, x => {
        let guild = x.message.guild;
        let dbo = app.db.db('eventifierjs');

        if (!guild) {
            x.message.channel.send({
                embed: {
                    color: 16318549,
                    title: "Event error!",
                    description: "Couldn't find server. Are you doing this in a DM chat?",
                }
            }); 
            
            return;
        }

        // try to find current event hosted by user
        dbo.collection('events').findOne({ userid: x.message.author.id }, { _id: 0, userid: 1, name: 1 }, function (err, result) {
            if (err) throw err;

            if (result) {
                // Don't do anything if the user is found
                console.log('Event from user found! (' + result.name + ')');

                x.message.channel.send({
                    embed: {
                        color: 16318549,
                        title: "Event error!",
                        description: "It seems like you're already hosting an event. (" + result.name + ")",
                    }
                });
            } else {
                // try to find event with the same name
                dbo.collection('events').findOne({ name: x.name }, { _id: 0, userid: 1, name: 1 }, function (err, result) {
                    if (err) throw err;

                    if (result) {
                        // Don't do anything if the user is found
                        console.log('An event with that name already exists! (' + result.name + ')');

                        x.message.channel.send({
                            embed: {
                                color: 16318549,
                                title: "Event error!",
                                description: 'An event with that name already exists! (' + result.name + ')',
                            }
                        });
                    } else {
                        let name = x.name.replace(/\s/, '-');

                        let eventChannelData = {}

                        guild.createChannel(x.name, 'category')
                            .then(ch => {
                                eventChannelData.category = ch.id;

                                guild.createChannel('general', 'text')
                                    .then(ch => {
                                        eventChannelData.general = ch.id;
                                        ch.setParent(eventChannelData.category);

                                        guild.createChannel('host', 'text')
                                            .then(ch => {
                                                eventChannelData.host = ch.id;
                                                ch.setParent(eventChannelData.category);

                                                guild.createChannel('voice', 'voice')
                                                    .then(ch => {
                                                        eventChannelData.voice = ch.id;
                                                        ch.setParent(eventChannelData.category);

                                                        let doc = {
                                                            userid: x.message.author.id,
                                                            name: x.name,
                                                            channelData: eventChannelData
                                                        }

                                                        dbo.collection('events').insertOne(doc, function (err, res) {
                                                            if (err) throw err;

                                                            x.message.channel.send({
                                                                embed: {
                                                                    color: 16318549,
                                                                    title: "Event callback!",
                                                                    description: "New event succesfully called '" + x.name + "' created!",
                                                                }
                                                            });

                                                            console.log("1 document inserted: \n" + res);
                                                        });
                                                    });
                                            });
                                    });
                            });

                    }
                });
            }
        });
    });

}
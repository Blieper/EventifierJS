
app.polls = [];

exports.endPoll = function (obj) {
    let embed = {
        embed: {
            color: 16318549,
            title: "Vote results",
            description: obj.poll.text,
            fields: [{
                name: "Options",
                value: ""
            }],
        }
    }

    for (i in obj.poll.options) {
        embed.embed.fields[0].value += "\n[" + obj.poll.options[i].votes + "] " + obj.poll.options[i].text;
    }

    obj.message.channel.send(embed);
}

exports.init = function (app) {

    app.registerNamespace('vote', {
        description: `This namespace is dedicated to voting.`,
    });

    app.registerCommand('vote', 'for', {
        pars: [
            { name: 'title' },
            { name: 'option'}
        ],
        description:
            `Makes you vote.`
    }, x => {
        // Find poll
        let poll = null;

        for (i of app.polls) {
            if (x.title === i.title) {
                poll = i;
                break;
            }
        }

        if (!poll) {
            app.commandFeedback(x.message, "Poll could not be found!");
            return
        }

        if (poll.hasvoted.indexOf(x.message.author.id) > -1) {
            app.commandFeedback(x.message, "You have already voted for this poll!");
            return
        }
 
        let foundOption = -1;

        for (i in poll.options) {
            console.log(i);

            if (poll.options[i].id === x.option) {
                foundOption = i;
                break;
            }
        }

        if (foundOption === -1) {
            app.commandFeedback(x.message, "Could not find that option!");
            return
        }      

        x.message.delete();

        poll.hasvoted.push(x.message.author.id);
        poll.options[foundOption].votes++;
        app.commandFeedback(x.message, x.message.author.username + " voted for '" + poll.options[foundOption].text + "'", {end: true, type: 'Callback!'});
    });

    app.registerCommand('vote', 'call', {
        pars: [
            { name: 'title' },
            { name: 'text' }
        ],
        lazypars: true,
        description:
            `Calls a vote.`
    }, x => {
        let poll = {};
        poll.title = x.title;
        poll.options = [];
        poll.endtime = Date.now();
        poll.channel = x.message.channel;
        poll.text = x.text;
        poll.runtime = 0;
        poll.hasvoted = [];

        if (poll.text.length < 1) {
            app.commandFeedback(x.message, "Votes needs text!");
            return
        }

        for (i of app.polls) {
            if (i.title === x.title) {
                app.commandFeedback(x.message, "A vote with that title already exists!");
                return
            }
        }

        if (x.time) {
            if (/\d/g.test(x.time)) {
                if (x.time > 1) {
                    poll.endtime += 60000 * x.time;
                    poll.runtime += 60000 * x.time;
                } else {
                    poll.endtime += 60000;
                    poll.runtime += 60000;
                }
            } else {
                app.commandFeedback(x.message, "Invalid time given!");
                return
            }
        } else {
            poll.endtime += 60000;
            poll.runtime += 60000;
        }

        for (i in x) {
            if (/\d/g.test(i)) {
                poll.options.push({ text: x[i], votes: 0, id: i });
            }
        }

        if (poll.options.length < 2) {
            app.commandFeedback(x.message, "A vote should have atleast 2 options!");
            return;
        }

        x.message.delete();

        let embed = {
            embed: {
                color: 16318549,
                title: "Vote",
                description: poll.text,
                fields: [{
                    name: "Options",
                    value: ""
                },{
                    name: "Vote command:",
                    value: "!vote for title: " + poll.title + ", option: [option]" 
                }],
            }
        }

        for (i of poll.options) {
            embed.embed.fields[0].value += "\n" + i.id + ": " + i.text;
        }

        x.message.channel.send(embed);

        let object = {};
        object.message = x.message;
        object.poll = poll;

        app.polls.push(poll);

        setTimeout(exports.endPoll, poll.endtime - Date.now(), object);
    });
}
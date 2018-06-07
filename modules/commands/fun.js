exports.init = function (app) {

    app.registerNamespace('fun', {
        description: `This namespace is dedicated to random fun commands.`,
    });

    app.registerCommand('fun', 'rtd', {
        pars: [],
        description:
            `Rolls a 6 sided dice.`
    }, x => {
        let sides = 6;

        let number = Math.ceil(Math.random() * sides);

        app.commandFeedback(x.message, "Result: " + number, {type: 'Rolling a dice!'});
        return
    });

    app.registerCommand('fun', 'd10', {
        pars: [],
        description:
            `Rolls a 10 sided dice.`
    }, x => {
        let sides = 10;

        let number = Math.ceil(Math.random() * sides);

        app.commandFeedback(x.message, "Result: " + number, {type: 'Rolling a d10!'});
        return
    });
} 
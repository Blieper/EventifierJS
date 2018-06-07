exports.init = function (app) {

    app.registerNamespace('fun', {
        description: `This namespace is dedicated to random fun commands.`,
    });

    app.registerCommand('fun', 'rtd', {
        pars: [
            { name: 'sides', optional: true },
        ],
        description:
            `Rolls a 6 sided dice. Number of sides can also be changed`
    }, x => {
        let sides = 6 || Math.max(x.sides,1);

        let number = Math.ceil(Math.random * sides);

        app.commandFeedback(x.message, "Result: " + number, {type: 'Rolling a dice!'});
        return
    });
}
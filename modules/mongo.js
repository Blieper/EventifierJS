exports.init = function (app){

    app.mongoURL = 'mongodb://abradabre:zoopzoop@ds113799.mlab.com:13799/eventifierjs';
    console.log('Mongo: ' + app.mongoURL);

    app.db        = null;
    app.mongodb   = null;

    app.initDb = function(callback) {
        if (app.mongoURL == null) return;

        mongodb = require('mongodb');
        let Server = mongodb.Server;
        let MongoClient = mongodb.MongoClient;
        if (mongodb == null) return;

        console.log('Trying to connect to database...');

        MongoClient.connect(app.mongoURL, function(err, conn) {
            if (err) {
                callback(err);
                return;
            }

            app.db = conn;

            let dbo = app.db.db('eventifierjs');

            //dbo.collection("users").drop();

            dbo.createCollection("events", function(err, res) {
                if (err) throw err;
                console.log("Events collection created!");
            });
            
            console.log('Connected to MongoDB at: %s', app.mongoURL);
        });
    };

    app.initDb(function(err){
        console.log('Error connecting to Mongo. Message:\n'+err);
    });  
}
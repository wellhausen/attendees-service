const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const { Attendee, validate } = require("./model");
const mongoose = require("mongoose");
const amqp = require("amqplib/callback_api");
const config = require("config");
const dbConfig = config.get("dbConfig.db");
//const mongoDB = "mongodb://admin:admin1@ds031978.mlab.com:31978/attendees";

mongoose.connect(dbConfig, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.listen(3001, function () {
  console.log("listening on 3001");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

amqp.connect("amqp://localhost", (err, connection) => {
  if (err) return console.error(err);

  connection.createChannel((err, channel) => {
    if (err) return console.error(err);

    const queueName = "attendee.verified";
    channel.assertQueue(queueName, { durable: true });

    app.post("/attendees", async (req, res) => {
      const { error } = validate(req.body);
      if (error) res.send(error.details[0].message);
      else {
        const payload = Buffer.from(JSON.stringify(req.body));

        const attendee = new Attendee({
          name: req.body.name,
          email: req.body.email,
          company: req.body.company,
          event: req.body.event,
        });

        await attendee.save();
        channel.sendToQueue(queueName, payload);
        console.log("payload:", payload);
        res.send(attendee);
      }
    });
  });
});

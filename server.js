const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const { Attendee, validate } = require("./models/attendee");
const { Event } = require("./models/event");
const mongoose = require("mongoose");
const amqp = require("amqplib/callback_api");
const config = require("config");
const dbConfig = config.get("dbConfig.db");
const CircuitBreaker = require("opossum");

mongoose.connect(dbConfig, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false,
});

var db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.listen(3001, function () {
  console.log("listening on 3001");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// const options = {
//   timeout: 3000,
//   errorThresholdPercentage: 50,
//   resetTimeout: 30000,
// };

amqp.connect("amqp://localhost", (err, connection) => {
  if (err) return console.error(err);

  connection.createChannel((err, channel) => {
    if (err) return console.error(err);

    const queueName = "event.create";
    channel.assertQueue(queueName, { durable: true });

    channel.consume(queueName, async (message) => {
      try {
        const payload = JSON.parse(message.content.toString());
        console.log("Received:", payload);

        // check if event already created

        const event = new Event({
          maxAllowed: payload.generalAttendance,
          eventId: payload._id,
          eventName: payload.name,
          totalAttendees: payload.totalAttendees ? payload.totalAttendees : 0,
        });
        await event.save();
      } catch (e) {
        console.error(e);
      }
      channel.ack(message);
    });
  });

  connection.createChannel(async (err, channel) => {
    if (err) return console.error(err);

    const queueName = "event.modify";

    channel.assertQueue(queueName, { durable: true });

    channel.consume(queueName, async (message) => {
      try {
        const payload = JSON.parse(message.content.toString());
        console.log("Received:", payload);

        let currentEvent = Event.findOne({ evendId: payload._id });

        Event.findOneAndUpdate(
          { eventId: payload._id },
          {
            eventName: payload.name,
            maxAllowed: payload.generalAttendance,
            totalAttendees: currentEvent.totalAttendees,
            new: true,
          },
          null,
          function (err, docs) {
            if (err) {
              console.log(err);
            } else {
              console.log("Original Doc : ", docs);
            }
          }
        );

        await Event.save();
      } catch (e) {
        console.error(e);
      }
      channel.ack(message);
    });
  });

  connection.createChannel((err, channel) => {
    if (err) return console.error(err);

    const exchange = "attendee.verified";
    channel.assertExchange(exchange, "fanout", {
      durable: true,
    });

    app.post("/attendees", async (req, res) => {
      const { error } = validate(req.body);
      if (error) res.status(400).send(error.details[0].message);

      const payload = Buffer.from(JSON.stringify(req.body));

      const currentEvent = await Event.findOne(
        { eventName: req.body.event },
        { eventName: 1, _id: 1, maxAllowed: 1, totalAttendees: 1, eventId: 1 }
      );

      if (!currentEvent) res.status(404).send("Event not found");

      if (currentEvent.totalAttendees + 1 <= currentEvent.maxAllowed) {
        const attendee = new Attendee({
          name: req.body.name,
          email: req.body.email,
          company: req.body.company,
          event: req.body.event,
        });

        await attendee.save();
        res.status(200).send(attendee);
        //channel.publish("attendee.verified", "", Buffer.from(payload));

        let updatedEvent = new Event({
          eventName: currentEvent.eventName,
          totalAttendees: currentEvent.totalAttendees + 1,
          maxAllowed: currentEvent.maxAllowed,
          eventId: currentEvent.eventId,
        });

        await updatedEvent.save();

        Event.findByIdAndDelete(currentEvent._id, function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            console.log("Deleted : ", docs);
          }
        });
      } else {
        res.status(401).send("Event already at capacity");
      }

      //channel.publish("attendee.verified", "", Buffer.from(payload));

      const breaker = new CircuitBreaker(
        channel.publish("attendee.verified", "", Buffer.from(payload)),
        {
          timeout: 3000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
        }
      );
      breaker
        .fire()
        .then(console.log("payload:", payload))
        .catch(console.error("unsuccessfully published to channel"));
    });
  });
});

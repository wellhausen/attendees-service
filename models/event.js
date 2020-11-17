const mongoose = require("mongoose");
const Joi = require("joi");

const Events = mongoose.model(
  "Events",
  new mongoose.Schema({
    eventName: { type: String, required: true },
    maxAllowed: { type: Number, required: true },
    totalAttendees: { type: Number, required: true },
    eventId: { type: String, required: true },
  })
);

exports.Event = Events;

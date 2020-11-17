const mongoose = require("mongoose");
const Joi = require("joi");

const Attendees = mongoose.model(
  "Attendees",
  new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, required: true },
    event: { type: String, required: true },
  })
);

function validateAttendee(attendee) {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    company: Joi.string().required(),
    event: Joi.string().required(),
  });

  return schema.validate(attendee);
}
exports.Attendee = Attendees;
exports.validate = validateAttendee;

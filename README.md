### Attendees Microservice Prompt

This must provide HTTP RESTful APIs to achieve the following:
Sign up for the event
This must publish attendee creation messages so that other microservices can consume them. Use channel name "attendee.verified".
The Attendee Bounded Context is where people come to "buy" their badges. To do this, they provide their name, email, and company. Once their purchase is "approved" (we're not going to do credit card authorization, just auto approve it), they should be able to get their badges.

## The number of attendees should never exceed the maximum number of attendees for the event.

To sign up for an event, send a POST to http://localhost:3001/attendees

{
"name": "Jane Doe",
"email": "test@gmail.com",
"company": "company",
"event": "concert"
}

Will receive an error if a value is missing, or if event is already at capacity.

Messages are published to the "attendee.verified" channel.

To run NPM install, and add config/default.json with the following data:
{"dbConfig":{"db": "mongodb://admin:admin1@ds031978.mlab.com:31978/attendees"}}

Attendees Microservice
---

To submit an attendee, POST to /attendees. All fields are required. 
Example POST: 

{
  "name": "Jane Doe",
  "email": "test@gmail.com",
  "company": "company",
  "event": "concert"
}

Once an attendee is approved, data is published to the "attendee.verified" channel. This service depends on the events channel. Attendees are approved if there is availability for the event. Will receive an error response if a value is missing, or if event is already at capacity.

To run locally
---
NPM install
Add config/default.json with the following data:
{"dbConfig":{"db": "mongodb://admin:admin1@ds031978.mlab.com:31978/attendees"}}

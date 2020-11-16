const amqp = require("amqplib/callback_api");

amqp.connect("amqp://localhost:", (err, connection) => {
  if (err) return console.error(err);

  connection.createChannel((err, channel) => {
    if (err) return console.error(err);
    const queueName = "event.create";
    channel.assertQueue(queueName, { durable: false });

    console.log("Receiving. Press CTRL+C to stop...");
    channel.consume(queueName, (message) => {
      try {
        const payload = JSON.parse(message.content.toString());
        console.log("Received:", payload);
      } catch (e) {
        console.error(e);
      }
      channel.ack(message);
    });
  });
});

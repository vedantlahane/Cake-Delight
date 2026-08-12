const amqp = require('amqplib');
const Notification = require('../models/Notification');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'order_events';
const ROUTING_KEY = 'order.completed';
const QUEUE_NAME = 'notification_order_queue';

async function connectConsumer() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        const q = await channel.assertQueue(QUEUE_NAME, { durable: true });
        await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);

        console.log(`Notification Service consumer listening on queue: ${q.queue}`);

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    console.log('Received order completion event in Notification Service:', content);

                    const notification = new Notification({
                        orderId: content.orderId,
                        userId: content.userId,
                        channel: 'email',
                        status: 'sent'
                    });

                    await notification.save();
                    console.log(`Notification created for user ${content.userId}, Order ID: ${content.orderId}`);

                    channel.ack(msg);
                } catch (err) {
                    console.error('Error processing notification event:', err.message);
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (err) {
        console.error('Failed to start RabbitMQ consumer in Notification Service:', err.message);
        // Retry connection after 5 seconds
        setTimeout(connectConsumer, 5000);
    }
}

module.exports = {
    connectConsumer
};

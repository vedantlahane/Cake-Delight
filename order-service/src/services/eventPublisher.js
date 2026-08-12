const amqp = require('amqplib');

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'order_events';
const ROUTING_KEY = 'order.completed';

async function connectRabbitMQ() {
    if (channel) return channel;
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        console.log('Connected to RabbitMQ in Order Service');
        return channel;
    } catch (err) {
        console.error('RabbitMQ connection error in Order Service:', err.message);
        return null;
    }
}

async function publishOrderCompleted(orderData) {
    try {
        const ch = await connectRabbitMQ();
        if (!ch) {
            console.warn('RabbitMQ channel not available. Skipping event publish.');
            return false;
        }
        const message = Buffer.from(JSON.stringify(orderData));
        ch.publish(EXCHANGE_NAME, ROUTING_KEY, message, { persistent: true });
        console.log(`Event ${ROUTING_KEY} published for order ${orderData._id || orderData.id}`);
        return true;
    } catch (err) {
        console.error('Failed to publish order.completed event:', err.message);
        return false;
    }
}

module.exports = {
    connectRabbitMQ,
    publishOrderCompleted
};

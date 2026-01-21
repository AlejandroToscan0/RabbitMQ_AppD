const amqp = require('amqplib');

class RabbitMQBroker {
    constructor(url, exchange) {
        this.url = url;
        this.exchange = exchange;
        this.channel = null;
        this.connection = null;
    }

    async connect() {
        let retries = 10;
        while (retries > 0) {
            try {
                this.connection = await amqp.connect(this.url);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
                console.log("✅ [RabbitMQ] Conectado exitosamente");
                return; // Salir de la función si conecta
            } catch (error) {
                console.log(`⚠️ RabbitMQ no está listo, reintentando en 5s... (Quedan ${retries} intentos)`);
                retries -= 1;
                // Esperar 5 segundos
                await new Promise(res => setTimeout(res, 5000));
            }
        }
        throw new Error("❌ No se pudo conectar a RabbitMQ después de 10 intentos");
    }

    async publish(routingKey, message) {
        if (!this.channel) throw new Error("Channel not initialized");
        this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`📤 [Broker] Mensaje enviado a '${routingKey}'`);
    }

    async subscribe(queueName, routingKeys, handlerFunction) {
        if (!this.channel) await this.connect();
        
        const q = await this.channel.assertQueue(queueName, { exclusive: false });
        
        // Vincular múltiples routing keys (ej: stock.reserved, stock.rejected)
        for (const key of routingKeys) {
            this.channel.bindQueue(q.queue, this.exchange, key);
        }

        this.channel.consume(q.queue, (msg) => {
            if (msg) {
                const content = JSON.parse(msg.content.toString());
                const routingKey = msg.fields.routingKey;
                // Delegamos la lógica al handler inyectado
                handlerFunction(content, routingKey); 
                this.channel.ack(msg);
            }
        });
    }
}

module.exports = RabbitMQBroker;
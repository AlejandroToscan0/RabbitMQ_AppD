const { v4: uuidv4 } = require('uuid');

class OrderService {
    // Inyección de dependencias (DIP)
    constructor(orderRepository, messageBroker) {
        this.orderRepository = orderRepository;
        this.messageBroker = messageBroker;
    }

    async createOrder(data) {
        const orderId = uuidv4();
        
        const newOrder = {
            orderId,
            customerId: data.customerId,
            items: data.items,
            shippingAddress: data.shippingAddress,
            status: 'PENDING',
            message: "Order received. Inventory check in progress.",
            createdAt: new Date().toISOString()
        };

        // 1. Guardar
        await this.orderRepository.save(newOrder);

        // 2. Publicar Evento (Contrato JSON 5.2)
        const event = {
            eventType: "OrderCreated",
            orderId: orderId,
            correlationId: uuidv4(),
            createdAt: new Date().toISOString(),
            items: data.items
        };

        await this.messageBroker.publish('order.created', event);
        
        return newOrder;
    }

    async getOrder(orderId) {
        return await this.orderRepository.findById(orderId);
    }

    // Método para manejar la respuesta asíncrona
    async processInventoryResult(event, routingKey) {
        const order = await this.orderRepository.findById(event.orderId);
        if (!order) return;

        // Estrategia simple basada en el routingKey (Open/Closed principle friendly)
        const strategies = {
            'stock.reserved': () => {
                order.status = 'CONFIRMED';
                console.log(`✅ Pedido ${order.orderId} CONFIRMADO`);
            },
            'stock.rejected': () => {
                order.status = 'CANCELLED';
                order.reason = event.reason;
                console.log(`❌ Pedido ${order.orderId} CANCELADO`);
            }
        };

        if (strategies[routingKey]) {
            strategies[routingKey]();
            await this.orderRepository.save(order);
        }
    }
}

module.exports = OrderService;
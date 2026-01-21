const express = require('express');
const bodyParser = require('body-parser');

// Importar capas
const InMemoryOrderRepository = require('./domain/order.repository');
const RabbitMQBroker = require('./infrastructure/rabbitmq.broker');
const OrderService = require('./services/order.service');
const OrderController = require('./controllers/order.controller'); // <-- Nuevo import
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const app = express();
app.use(bodyParser.json());

// 1. Instanciar Infraestructura y Dominio
const orderRepository = new InMemoryOrderRepository();
const broker = new RabbitMQBroker(RABBIT_URL, 'ecommerce_exchange');
// 2. Inyectar en Servicio (Negocio)
const orderService = new OrderService(orderRepository, broker);

// 3. Inyectar en Controlador (HTTP)
const orderController = new OrderController(orderService);

// 4. Definir Rutas (Usando el controlador)
app.post('/api/v1/orders', orderController.createOrder);
app.get('/api/v1/orders/:orderId', orderController.getOrder);

// 5. Iniciar Servidor
async function start() {
    await broker.connect();
    
    // Configurar listener asíncrono (RabbitMQ -> Service)
    await broker.subscribe(
        'order_responses_queue', 
        ['stock.reserved', 'stock.rejected'], 
        (msg, key) => orderService.processInventoryResult(msg, key)
    );

    app.listen(8080, () => console.log('🚀 Order Service (SOLID) running on port 8080'));
}

start();
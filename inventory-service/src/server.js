const express = require('express');
const InMemoryInventoryRepository = require('./domain/inventory.repository');
const RabbitMQBroker = require('./infrastructure/rabbitmq.broker');
const InventoryService = require('./services/inventory.service');
const InventoryController = require('./controllers/inventory.controller'); // <-- Nuevo import
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const app = express();

// 1. Instancias
const repo = new InMemoryInventoryRepository();
const broker = new RabbitMQBroker(RABBIT_URL, 'ecommerce_exchange');
const service = new InventoryService(repo, broker);
const controller = new InventoryController(service);

// 2. Rutas
app.get('/api/v1/products/:productId/stock', controller.getStock);

// 3. Inicio
async function start() {
    await broker.connect();

    // Listener (RabbitMQ -> Service)
    await broker.subscribe(
        'inventory_requests_queue',
        ['order.created'],
        (msg) => service.checkAndReserveStock(msg)
    );

    app.listen(8081, () => console.log('🚀 Inventory Service (SOLID) running on port 8081'));
}

start();
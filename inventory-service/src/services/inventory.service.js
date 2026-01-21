class InventoryService {
    constructor(repo, broker) {
        this.repo = repo;
        this.broker = broker;
    }

    // --- AGREGA ESTE MÉTODO ---
   async getProductDetails(productId) {
        // Devuelve el objeto completo { stock, reserved, date... }
        return await this.repo.getProductData(productId);
    }

    async checkAndReserveStock(orderEvent) {
        console.log(`[Inventory] Validando orden ${orderEvent.orderId}`);
        
        let hasStock = true;
        let failedProduct = null;

        // Validar (Lógica pura)
        for (const item of orderEvent.items) {
            const stock = await this.repo.getStock(item.productId); // Nota: await aquí es importante con Postgres
            if (stock < item.quantity) {
                hasStock = false;
                failedProduct = item.productId;
                break;
            }
        }

        if (hasStock) {
            // Ejecutar transacción
            for (const item of orderEvent.items) {
                await this.repo.decreaseStock(item.productId, item.quantity);
            }

            // Publicar Éxito
            const event = {
                eventType: "StockReserved",
                orderId: orderEvent.orderId,
                correlationId: orderEvent.correlationId,
                reservedItems: orderEvent.items,
                reservedAt: new Date().toISOString()
            };
            await this.broker.publish('stock.reserved', event);
            console.log(`✅ Stock reservado para ${orderEvent.orderId}`);

        } else {
            // Publicar Fallo
            const event = {
                eventType: "StockRejected",
                orderId: orderEvent.orderId,
                correlationId: orderEvent.correlationId,
                reason: `Insufficient stock for product ${failedProduct}`,
                rejectedAt: new Date().toISOString()
            };
            await this.broker.publish('stock.rejected', event);
            console.log(`⛔ Stock rechazado para ${orderEvent.orderId}`);
        }
    }
}

module.exports = InventoryService;
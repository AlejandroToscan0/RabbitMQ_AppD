const { Pool } = require('pg');

// Configuración leída de variables de entorno (Docker)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

class PostgresOrderRepository {
    async save(order) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Verificar si existe para decidir si es INSERT o UPDATE
            const check = await client.query('SELECT order_id FROM orders WHERE order_id = $1', [order.orderId]);
            
            if (check.rows.length === 0) {
                // INSERT (Crear pedido)
                await client.query(
                    'INSERT INTO orders (order_id, customer_id, status, created_at) VALUES ($1, $2, $3, $4)',
                    [order.orderId, order.customerId, order.status, order.createdAt]
                );
                
                // Guardar ítems
                for (const item of order.items) {
                    await client.query(
                        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
                        [order.orderId, item.productId, item.quantity]
                    );
                }
            } else {
                // UPDATE (Actualizar estado y razón)
                await client.query(
                    'UPDATE orders SET status = $1, reason = $2 WHERE order_id = $3',
                    [order.status, order.reason || null, order.orderId]
                );
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        return order;
    }

    async findById(orderId) {
        const resOrder = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
        if (resOrder.rows.length === 0) return null;

        const resItems = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
        
        // Mapear de Snake_case (DB) a CamelCase (JS)
        return {
            orderId: resOrder.rows[0].order_id,
            customerId: resOrder.rows[0].customer_id,
            status: resOrder.rows[0].status,
            reason: resOrder.rows[0].reason,
            items: resItems.rows.map(row => ({
                productId: row.product_id,
                quantity: row.quantity
            }))
        };
    }
}

module.exports = PostgresOrderRepository;
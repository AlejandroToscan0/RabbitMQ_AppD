// inventory-service/src/domain/inventory.repository.js

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

class PostgresInventoryRepository {
    
    // --- ESTE ES EL MÉTODO QUE TE FALTA ---
    async getProductData(productId) {
        const res = await pool.query('SELECT * FROM products_stock WHERE product_id = $1', [productId]);
        
        if (res.rows.length > 0) {
            // Mapeamos los nombres de la DB (snake_case) a JS (camelCase)
            return {
                productId: res.rows[0].product_id,
                stock: res.rows[0].stock,
                reservedStock: res.rows[0].reserved_stock,
                updatedAt: res.rows[0].updated_at
            };
        }
        return null;
    }
    // --------------------------------------

    async getStock(productId) {
        const res = await pool.query('SELECT stock FROM products_stock WHERE product_id = $1', [productId]);
        return res.rows.length > 0 ? res.rows[0].stock : 0;
    }

    async decreaseStock(productId, quantity) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Bloqueo de fila para concurrencia (FOR UPDATE)
            const res = await client.query('SELECT stock FROM products_stock WHERE product_id = $1 FOR UPDATE', [productId]);
            
            if (res.rows.length > 0) {
                const currentStock = res.rows[0].stock;
                if (currentStock >= quantity) {
                    // Actualizamos stock y la fecha updated_at
                    await client.query(
                        'UPDATE products_stock SET stock = stock - $1, updated_at = NOW() WHERE product_id = $2', 
                        [quantity, productId]
                    );
                    await client.query('COMMIT');
                    return true;
                }
            }
            await client.query('ROLLBACK');
            return false;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = PostgresInventoryRepository;
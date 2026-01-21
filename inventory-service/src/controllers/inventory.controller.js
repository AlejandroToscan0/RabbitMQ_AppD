class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
        this.getStock = this.getStock.bind(this);
    }

    async getStock(req, res) {
        try {
            const { productId } = req.params;
            
            // CORRECCIÓN: Agregamos 'await' aquí para esperar el dato real
            const data = await this.inventoryService.getProductDetails(productId);

            if (data) {
                // Formato completo según Requisito 4.1.3 del PDF
                res.status(200).json({
                    productId: data.productId,
                    availableStock: data.stock,      // Stock real
                    reservedStock: data.reservedStock, // Stock reservado
                    updatedAt: data.updatedAt        // Fecha actualización
                });
            } else {
                res.status(404).json({ message: "Product not found" });
            }
        } catch (error) {
            console.error("Error fetching stock:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

module.exports = InventoryController;
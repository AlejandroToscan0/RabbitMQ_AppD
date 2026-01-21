class OrderController {
    constructor(orderService) {
        this.orderService = orderService;
        // Bind para no perder el contexto 'this' cuando Express llame a los métodos
        this.createOrder = this.createOrder.bind(this);
        this.getOrder = this.getOrder.bind(this);
    }

    async createOrder(req, res) {
        try {
            // Extraer solo lo necesario (evitar pasar el req completo al servicio)
            const orderData = req.body;
            
            // Llamar al negocio
            const newOrder = await this.orderService.createOrder(orderData);
            
            // Responder (201 Created)
            res.status(201).json(newOrder);
        } catch (error) {
            console.error("Error creating order:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async getOrder(req, res) {
        try {
            const { orderId } = req.params;
            const order = await this.orderService.getOrder(orderId);

            if (order) {
                res.status(200).json(order);
            } else {
                res.status(404).json({ message: "Order not found" });
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

module.exports = OrderController;
# Order Service

Este microservicio es el punto de entrada para la gestión de pedidos en la plataforma de comercio electrónico. Su responsabilidad principal es registrar la intención de compra, coordinar la validación de inventario de forma asíncrona y mantener el estado final del pedido.

## Arquitectura y Diseño

El servicio está construido sobre **Node.js** utilizando una arquitectura en capas para cumplir con los principios SOLID:

* **Controller Layer:** Maneja las peticiones HTTP y respuestas JSON estandarizadas.
* **Service Layer:** Contiene la lógica de negocio y la coordinación de eventos.
* **Repository Layer:** Abstrae la comunicación con PostgreSQL.
* **Infrastructure:** Gestiona la conexión con el Message Broker (RabbitMQ).

### Flujo de Eventos (Event-Driven)

Este servicio actúa como **Publicador** y **Consumidor**:

1.  **Publica:** `order.created` al recibir una solicitud POST válida.
2.  **Consume:**
    * `stock.reserved`: Actualiza el estado del pedido a **CONFIRMED**.
    * `stock.rejected`: Actualiza el estado del pedido a **CANCELLED** indicando la razón.

## API Reference

### 1. Crear Pedido
Registra un pedido con estado inicial `PENDING`.

* **Método:** `POST`
* **Ruta:** `/api/v1/orders`
* **Body:**
    ```json
    {
      "customerId": "uuid-cliente",
      "items": [
        {
          "productId": "uuid-producto",
          "quantity": 2
        }
      ],
      "shippingAddress": {
        "country": "EC",
        "city": "Quito",
        "street": "Av. Amazonas"
      }
    }
    ```

### 2. Consultar Pedido
Devuelve el estado actual del pedido y sus detalles.

* **Método:** `GET`
* **Ruta:** `/api/v1/orders/:orderId`
* **Respuesta Exitosa (200):**
    ```json
    {
      "orderId": "uuid-generado",
      "customerId": "uuid-cliente",
      "status": "CONFIRMED", // o CANCELLED / PENDING
      "items": [...],
      "updatedAt": "2026-01-21T..."
    }
    ```

## Variables de Entorno

Este servicio requiere las siguientes variables inyectadas por Docker Compose:

* `PORT`: Puerto de escucha (Defecto: 8080).
* `DATABASE_URL`: Cadena de conexión a PostgreSQL.
* `RABBITMQ_URL`: Cadena de conexión a RabbitMQ.
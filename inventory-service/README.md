# Inventory Service

Este microservicio gestiona el stock de los productos y garantiza la integridad de los datos durante transacciones concurrentes. Funciona de manera reactiva escuchando eventos de creación de pedidos.

## Características Técnicas

* **Manejo de Concurrencia:** Utiliza transacciones de base de datos con bloqueo de fila (`FOR UPDATE`) en PostgreSQL. Esto previene condiciones de carrera donde múltiples pedidos podrían reservar el mismo stock simultáneamente.
* **Persistencia:** Los datos de stock, incluyendo la cantidad reservada y la fecha de actualización, se almacenan de forma persistente.
* **Comunicación:** Utiliza `amqplib` para la integración con RabbitMQ.

### Lógica de Negocio

Al recibir un evento de pedido:
1.  Verifica si existe stock suficiente para **todos** los ítems solicitados.
2.  Si hay stock: Decrementa la cantidad en la base de datos y emite el evento `stock.reserved`.
3.  Si no hay stock: No modifica la base de datos y emite el evento `stock.rejected` con la razón del fallo.

## API Reference

### 1. Consultar Stock
Endpoint para verificación manual del inventario de un producto específico.

* **Método:** `GET`
* **Ruta:** `/api/v1/products/:productId/stock`
* **Respuesta Exitosa (200):**
    ```json
    {
      "productId": "uuid-producto",
      "availableStock": 98,
      "reservedStock": 0,
      "updatedAt": "2026-01-21T..."
    }
    ```

## Configuración de Docker

El servicio está configurado para ignorar la carpeta `node_modules` local mediante `.dockerignore`, asegurando que las dependencias se instalen limpiamente dentro del contenedor durante el proceso de construcción (`docker-compose build`).

## Variables de Entorno

* `PORT`: Puerto de escucha (Defecto: 8081).
* `DATABASE_URL`: Cadena de conexión a PostgreSQL (Compartida con la red interna).
* `RABBITMQ_URL`: Cadena de conexión al broker de mensajería.

# 🛒 Sistema de Microservicios E-commerce (Event-Driven)

Este proyecto implementa una arquitectura de microservicios para un sistema de comercio electrónico, utilizando un enfoque orientado a eventos asíncronos. El sistema garantiza la consistencia de datos entre pedidos e inventario, maneja concurrencia y sigue principios de diseño de software robusto.

## 📋 Tecnologías y Arquitectura

* **Lenguaje:** Node.js (v18)
* **Contenedorización:** Docker & Docker Compose
* **Base de Datos:** PostgreSQL (con extensión `pgcrypto` para UUIDs)
* **Mensajería:** RabbitMQ (Intercambio de eventos asíncronos)
* **Patrones de Diseño:**
* **SOLID:** Separación de responsabilidades.
* **Repository Pattern:** Abstracción de la capa de datos.
* **Dependency Injection:** Desacoplamiento de módulos.
* **Event-Driven:** Comunicación no bloqueante entre servicios.



---

## 🚀 Instrucciones de Instalación y Ejecución

### Prerrequisitos

* Tener instalado **Docker Desktop** (o Docker Engine + Docker Compose).
* (Opcional) Postman para realizar las pruebas de API.

### Paso 1: Levantar el Sistema

Abra una terminal en la raíz del proyecto y ejecute el siguiente comando. Esto construirá las imágenes, creará la red interna e inicializará la base de datos.

```bash
docker-compose -f infrastructure/docker-compose.yml up --build

```

Espere hasta ver los mensajes de conexión exitosa en la consola:

> `✅ [RabbitMQ] Conectado exitosamente`

---

## ⚠️ Paso 2: Obtener UUIDs de Productos (IMPORTANTE)

El sistema genera **UUIDs aleatorios** automáticamente al iniciar la base de datos para simular un entorno real. Para probar el sistema, **primero debe consultar qué IDs se generaron**.

Mantenga la terminal de logs abierta, abra una **nueva terminal** y ejecute:

```bash
docker exec -it postgres_db psql -U admin -d ecommerce_db -c "SELECT * FROM products_stock;"

```

Verá una tabla similar a esta. **Copie los IDs que aparezcan en su pantalla:**

| product_id (UUID) | stock | Descripción |
| --- | --- | --- |
| `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | **100** | **Producto A** (Use este para prueba exitosa) |
| `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` | **0** | **Producto B** (Use este para prueba de fallo) |

---

## 🧪 Guía de Pruebas (Postman / cURL)

### Escenario A: Compra Exitosa (Happy Path)

Simula la compra de un producto con stock suficiente.

**Petición:**

* **Método:** `POST`
* **URL:** `http://localhost:8080/api/v1/orders`
* **Body (JSON):** *(Reemplace `UUID_CON_STOCK` por el ID obtenido en el Paso 2)*

```json
{
  "customerId": "9f7a1e2a-31f6-4a53-b0d2-6f4f1c7a3b2e",
  "items": [
    {
      "productId": "PEGAR_AQUI_UUID_CON_STOCK", 
      "quantity": 2
    }
  ],
  "shippingAddress": { "city": "Quito", "street": "Av. Amazonas" }
}

```

**Resultado Esperado:**

1. Recibirá un `orderId` con estado inicial `PENDING`.
2. Al consultar el estado (`GET http://localhost:8080/api/v1/orders/{orderId}`), el estado cambiará a **`CONFIRMED`**.
3. Al consultar el stock (`GET http://localhost:8081/api/v1/products/{productId}/stock`), el `availableStock` habrá bajado de **100 a 98**.

---

### Escenario B: Compra Fallida (Sin Stock)

Simula la compra de un producto sin inventario.

**Petición:**

* **Método:** `POST`
* **URL:** `http://localhost:8080/api/v1/orders`
* **Body (JSON):** *(Reemplace `UUID_SIN_STOCK` por el ID con 0 stock)*

```json
{
  "customerId": "9f7a1e2a-31f6-4a53-b0d2-6f4f1c7a3b2e",
  "items": [
    {
      "productId": "PEGAR_AQUI_UUID_SIN_STOCK", 
      "quantity": 1
    }
  ],
  "shippingAddress": { "city": "Guayaquil" }
}

```

**Resultado Esperado:**

1. Recibirá un `orderId`.
2. Al consultar el estado del pedido, verá:
* `status`: **`CANCELLED`**
* `reason`: *"Insufficient stock for product..."*



---

## 📊 Arquitectura del Flujo de Datos

El sistema sigue el siguiente flujo asíncrono:

1. **Order Service** recibe la petición HTTP y guarda la orden en estado `PENDING`.
2. Publica el evento `order.created` en **RabbitMQ**.
3. **Inventory Service** consume el evento.
4. Realiza una transacción en Base de Datos con bloqueo (`FOR UPDATE`) para verificar y descontar stock de forma segura.
5. Publica el resultado (`stock.reserved` o `stock.rejected`) en RabbitMQ.
6. **Order Service** consume el resultado y actualiza el estado final de la orden (`CONFIRMED` o `CANCELLED`).

### Evidencia de Configuración (RabbitMQ Management)

Puede visualizar los Exchanges y Colas accediendo a:

* **URL:** [http://localhost:15672](https://www.google.com/search?q=http://localhost:15672)
* **User:** `guest`
* **Pass:** `guest`

---

## 🛠️ Comandos de Mantenimiento

Si desea reiniciar la base de datos desde cero (borrar datos y generar nuevos UUIDs):

```bash
# Detiene los servicios y borra los volúmenes de datos persistentes
docker-compose -f infrastructure/docker-compose.yml down -v

# Reconstruye y levanta
docker-compose -f infrastructure/docker-compose.yml up --build

```

##  Evidencia Funcionamiento 
![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-5.png)
![alt text](image-6.png)
# Grupo 12

**Profesora:** Luz Mairet Chourio\
**Ayudante:** Benjamín Daza

**Integrantes:**

* Pablo Gutiérrez - 202473610-8
* Danae Ojeda - 202373516-7
* Catalina Diaz - 202473507-1
* Nicolas Matta - 201956634-2
* Mauricio Godoy - 202304014-2

## Documentacion

La documentacion de este proyecto se encuentra en la [Wiki](../../wikis/home)

## Tecnologías utilizadas

- **Frontend:** React.js
- **Backend:** Node.js
- **Base de datos:** PostgreSQL
- **Infraestructura:** Docker y Docker Compose
- **Visualización de BD:** pgAdmin

## Cómo levantar el proyecto

### 1. Clonar el repositorio

```bash
git clone [url del repositorio]
```

### 2. Levantar todos los servicios con Docker

```bash
docker-compose up --build
```

### 3. Abrir en el navegador

Formulario (Frontend) | http://localhost:3001

### 4. Credenciales de pgAdmin

- **Email:** admin@admin.com
- **Password:** admin
- **Host de conexión:** postgres_db
- **Puerto:** 5432
- **Base de datos:** mydb
- **Usuario BD:** user
- **Contraseña BD:** password

### 5. Apagar el proyecto

```bash
docker-compose down
```
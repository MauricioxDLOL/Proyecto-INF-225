# Grupo 02

**Profesora:** Anelis Pereira\
**Ayudante:** Benjamín Daza

**Integrantes:**

* Enrique Manzano - 202330530-8
* Cristofer Rojas Medina - 202373543-4
* Fernanda Pérez - 202210108-3
* Tomás Salinas - 202330528-6
* Nicolas Matta - 201956634-2
* Mauricio Godoy - 202304014-2

## Videos

[Video Hito 3](https://youtu.be/PjLKx8o2MZk)

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

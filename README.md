# Event Booking System

A full-stack **Event Booking System** built using **React, Node.js, Express, Sequelize, and MySQL**, fully containerized with **Docker Compose** for easy setup and development.

---

## Environment Setup

### Frontend Environment Variables

Create a `.env` file inside the **client** directory:

```
client/.env
```

Example:

```env
VITE_API_BASE_URL=http://api.example.com
```

---

### Backend Environment Variables

Create a `.env.docker` file inside the **server** directory:

```
server/.env.docker
```

Example:

```env
NODE_ENV=development
PORT=5000

DB_HOST=db
DB_PORT=3306
DB_NAME=event_booking_db
DB_USER=root
DB_PASSWORD=this.admin
```

---

## Docker Compose Database Configuration (Important)

In the `docker-compose.yml` file, the **MySQL service must define the following environment variables** to initialize the database correctly:

```yaml
environment:
  MYSQL_ROOT_PASSWORD: this.admin
  MYSQL_DATABASE: event_booking_db
```

These values **must match** the database credentials provided in `server/.env.docker`.

---

## Running the Application

From the **root directory**, run:

```bash
docker-compose up --build
```

---


### URL Setup

```bash
C:\Windows\System32\drivers\etc\

# added for local testing of nginx as reverse proxy 
127.0.0.1 app.example.com
127.0.0.1 api.example.com
```

## Application URLs

* **Frontend:** [http://app.example.com](http://app.example.com)
* **Backend API:** [http://api.example.com](http://api.example.com)

---

## Stopping the Application

Stop containers:

```bash
docker-compose down
```

Stop containers and remove volumes:

```bash
docker-compose down -v
```


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
VITE_API_BASE_URL=http://localhost:5000
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

## Database Seeders (Important)

When the application starts, **Sequelize seeders automatically run** and populate the database with initial data.

---

### Users Seeder

The users seeder creates **default users with roles**:

| Role          | Email                                                           | Password       |
| ------------- | --------------------------------------------------------------- | -------------- |
| ADMIN         | [alice.admin@example.com](mailto:alice.admin@example.com)       | `Admin@123`    |
| EVENT_MANAGER | [bob.manager@example.com](mailto:bob.manager@example.com)       | `Manager@123`  |
| EVENT_MANAGER | [mike.manager@example.com](mailto:mike.manager@example.com)     | `Manager@123`  |
| CUSTOMER      | [sobby.customer@example.com](mailto:sobby.customer@example.com) | `Customer@123` |
| CUSTOMER      | [jenny.customer@example.com](mailto:jenny.customer@example.com) | `Customer@123` |

> Passwords are securely hashed using **bcrypt**.

---

### Events Seeder

The events seeder creates **sample events**, linked to existing users:

* Tech Conference 2025
* Music Festival 2025
* Startup Meetup 2026
* Art Expo 2026

## Application URLs

* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5000](http://localhost:5000)

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


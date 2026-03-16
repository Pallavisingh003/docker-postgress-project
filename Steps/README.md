# Containerized Web Application with PostgreSQL using Docker Compose and Macvlan/Ipvlan


## Aim of the Project
The aim of this project is to develop and deploy a containerized web application using Node.js + Express as the backend and PostgreSQL as the database, leveraging Docker and Docker Compose for isolated, reproducible, and scalable deployment. The project focuses on demonstrating:
1) Containerization of backend and database services.
2) Data persistence across container restarts using Docker volumes.
3) Efficient deployment using Docker multi-stage builds and separate   Dockerfiles.
4) Network management using Macvlan or Ipvlan for container networking.
5) REST API functionality for managing user data.
   
____

## Procedure

STEP 1 — Create Project Folder

mkdir docker-postgres-project
cd docker-postgres-project
Create subfolders:
mkdir backend
mkdir database
Final structure:
docker-postgres-project
│
├── backend
├── database
└── docker-compose.yml


STEP 2 — Create Backend Application

cd backend
Initialize Node.js project:
npm init -y
Install dependencies:
npm install express pg

STEP 3 — Create Backend Code
Create file: backend/server.js
const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: 5432,
});

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name TEXT
    )
  `);
}

createTable();

app.get("/health", (req, res) => {
  res.send("API running");
});

app.post("/users", async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    "INSERT INTO users(name) VALUES($1) RETURNING *",
    [name]
  );
  res.json(result.rows[0]);
});

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

STEP 4 — Backend Dockerfile (Multi-Stage Build)
Create backend/Dockerfile:
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app /app
USER appuser
EXPOSE 3000
CMD ["node","server.js"]

STEP 5 — Create .dockerignore
Create backend/.dockerignore:
node_modules
npm-debug.log
.git
Reduces image size.

STEP 6 — Database Dockerfile
Go to database folder, create database/Dockerfile:
FROM postgres:15-alpine

ENV POSTGRES_DB=mydb
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=secret

STEP 7 — Create Docker Compose File
In project root, create docker-compose.yml:
version: "3.9"

services:

  database:
    build: ./database
    container_name: postgres_db
    restart: always
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      mynet:
        ipv4_address: 192.168.1.50
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      retries: 5

  backend:
    build: ./backend
    container_name: backend_api
    restart: always
    depends_on:
      database:
        condition: service_healthy
    environment:
      DB_HOST: 192.168.1.50
      POSTGRES_DB: mydb
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    networks:
      mynet:
        ipv4_address: 192.168.1.51
    ports:
      - "3000:3000"

volumes:
  pgdata:

networks:
  mynet:
    external: true
    
STEP 8 — Create Macvlan Network
Find your interface:
ifconfig
Example interface: en0
Create network:
docker network create -d macvlan \
--subnet=192.168.1.0/24 \
--gateway=192.168.1.1 \
-o parent=en0 \
mynet

STEP 9 — Build and Start Containers
docker compose up --build -d
docker ps
You should see:
backend_api
postgres_db

STEP 10 — Inspect Network (Screenshot Required)
docker network inspect mynet

STEP 11 — Check Container IPs
docker inspect backend_api

STEP 12 — Test API Using Thunder Client
Health check:
GET http://192.168.1.51:3000/health
Insert user:
POST http://192.168.1.51:3000/users
Body JSON:
{
  "name":"Pallavi"
}
Fetch users:
GET http://192.168.1.51:3000/users

STEP 13 — Volume Persistence Test

Stop containers:
docker compose down
Start again:
docker compose up -d
Check /users endpoint — data should still exist.

STEP 14 — Output

STEP 15 — Push to GitHub

git init
git add .
git commit -m "docker project"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main GIVE ME GIT CODES

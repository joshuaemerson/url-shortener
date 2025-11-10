import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import redis from 'redis'

// Init express app
const app = express();
app.use(express.json()); // to parse request body

// Set-up PostgreSQL connection
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || '5432',
    database: process.env.POSTGRES_DB || 'urlshortener',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Set-up Redis client
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
})

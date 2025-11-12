# URL Shortener Service

A scalable URL shortener service built with Node.js, Express, PostgreSQL, and Redis.

## Features

- ✨ Shorten URLs with automatic or custom short codes
- 🚀 Redis caching for lightning-fast redirects
- 📊 Click analytics and tracking
- 🔄 RESTful API
- 🐳 Fully containerized with Docker
- 💾 PostgreSQL for reliable data persistence

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/get-started) and Docker Compose
- [PostgreSQL](https://www.postgresql.org/) (if running without Docker)
- [Redis](https://redis.io/) (if running without Docker)

---

## Quick Start with Docker

### 1. Clone and Setup

```bash
# Create project directory
mkdir url-shortener
cd url-shortener

# Create .env file
cp .env.example .env
```

### 2. Start Services

```bash
# Start all services (PostgreSQL, Redis, App)
npm run docker:up

# Initialize the database
npm run docker:init
```

### 3. Test It Works

```bash
# Health check
curl http://localhost:3000/health

# Create a short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com"}'

# Response:
# {
#   "shortCode": "aB3xY9",
#   "shortUrl": "http://localhost:3000/aB3xY9",
#   "originalUrl": "https://www.google.com",
#   "createdAt": "2024-11-10T20:00:00.000Z"
# }

# Use the short URL (redirects to Google)
curl -L http://localhost:3000/aB3xY9
```

---

## Local Development (without Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```bash
PORT=3000
NODE_ENV=development

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=urlshortener
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start PostgreSQL and Redis

Make sure PostgreSQL and Redis are running locally:

```bash
# PostgreSQL (example)
psql -U postgres -c "CREATE DATABASE urlshortener;"

# Redis (example)
redis-server
```

### 4. Initialize Database

```bash
npm run init-db
```

### 5. Start the Application

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The API will be available at `http://localhost:3000`

---

## API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Health Check

**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-10T20:00:00.000Z"
}
```

---

#### 2. Create Short URL

**POST** `/api/shorten`

Create a shortened URL.

**Request Body:**
```json
{
  "url": "https://www.example.com/very-long-url",
  "customCode": "optional-custom-code"
}
```

**Response (201 Created):**
```json
{
  "shortCode": "aB3xY9",
  "originalUrl": "https://www.example.com/very-long-url",
  "shortUrl": "http://localhost:3000/aB3xY9",
  "createdAt": "2024-11-10T20:00:00.000Z"
}
```

**Error Responses:**
- `400` - URL is required or invalid format
- `409` - Custom code already exists

**Examples:**

```bash
# Auto-generated code
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.github.com"}'

# Custom code
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.github.com", "customCode": "github"}'
```

---

#### 3. Redirect to Original URL

**GET** `/:shortCode`

Redirects to the original URL.

**Example:**
```bash
# Browser: Navigate to
http://localhost:3000/aB3xY9

# cURL: See the redirect
curl -I http://localhost:3000/aB3xY9
```

**Response:**
- `302` - Redirects to original URL
- `404` - Short code not found

---

#### 4. Get Analytics

**GET** `/api/analytics/:shortCode`

Get analytics for a specific short URL.

**Response:**
```json
{
  "short_code": "aB3xY9",
  "original_url": "https://www.example.com",
  "clicks": 42,
  "created_at": "2024-11-10T20:00:00.000Z",
  "last_accessed": "2024-11-10T21:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/analytics/aB3xY9
```

---

#### 5. List All URLs

**GET** `/api/urls`

Get a paginated list of all shortened URLs.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response:**
```json
{
  "urls": [
    {
      "short_code": "aB3xY9",
      "original_url": "https://www.example.com",
      "clicks": 42,
      "created_at": "2024-11-10T20:00:00.000Z",
      "last_accessed": "2024-11-10T21:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3
  }
}
```

**Example:**
```bash
# First page (10 items)
curl http://localhost:3000/api/urls

# Second page with 20 items per page
curl http://localhost:3000/api/urls?page=2&limit=20
```

---

## Docker Commands

### Start Services

```bash
# Start in background
npm run docker:up

# View logs
npm run docker:logs

# Check status
npm run docker:ps
```

### Stop Services

```bash
# Stop (keeps data)
npm run docker:stop

# Stop and remove containers (keeps volumes)
npm run docker:down

# Remove everything including data
npm run docker:clean
```

### Database Operations

```bash
# Initialize database
npm run docker:init

# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d urlshortener

# Connect to Redis
docker-compose exec redis redis-cli
```

### Rebuild After Code Changes

```bash
npm run docker:build
```

### Fresh Start

```bash
# Complete reset
npm run docker:setup
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `urlshortener` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

---

## Project Structure

```
url-shortener/
├── server.js              # Main application
├── init-db.js            # Database initialization script
├── package.json          # Dependencies and scripts
├── Dockerfile            # Container image definition
├── docker-compose.yml    # Multi-container setup
├── .env                  # Environment variables (not committed)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

---

## Database Schema

### `urls` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `short_code` | VARCHAR(50) | Unique short code |
| `original_url` | TEXT | Original long URL |
| `clicks` | INTEGER | Number of clicks (default: 0) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `last_accessed` | TIMESTAMP | Last access timestamp |

**Indexes:**
- `idx_short_code` on `short_code` (for fast lookups)
- `idx_created_at` on `created_at DESC` (for pagination)

---

## How It Works

### Request Flow

```
User Request
    ↓
Check Redis Cache
    ↓
If cached → Return URL (1-2ms)
    ↓
If not cached → Query PostgreSQL (10-50ms)
    ↓
Cache result in Redis
    ↓
Update click counter (async)
    ↓
Redirect user to destination
```

### Performance

- **Cache Hit (99% of requests)**: ~1-2ms response time
- **Cache Miss**: ~10-50ms response time
- **Scalability**: Can handle 100,000+ redirects/second with Redis cache

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or change PORT in .env
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

### Application Not Starting

```bash
# Check all logs
docker-compose logs -f

# Rebuild from scratch
npm run docker:clean
npm run docker:setup
```

---

## Development Workflow

### Making Changes

1. Edit code in `server.js`
2. Rebuild: `npm run docker:build`
3. Test changes: `curl http://localhost:3000/health`

---

## Production Considerations

### Security

- [ ] Change default passwords in production
- [ ] Use environment-specific secrets management
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add authentication for admin endpoints
- [ ] Validate and sanitize all inputs

### Scaling

- [ ] Use a load balancer
- [ ] Run multiple application instances
- [ ] Consider PostgreSQL replication
- [ ] Use Redis Cluster for high availability

---
## Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Uses [PostgreSQL](https://www.postgresql.org/) for persistence
- Caches with [Redis](https://redis.io/)
- Containerized with [Docker](https://www.docker.com/)

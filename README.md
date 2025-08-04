# KeygenmusicAPI

A simple API for Keygenmusic, providing access to their music data in a structured format.<br>

# Installation

### Docker Setup

```bash
docker run -d -p 3000:3000 ghcr.io/kizuren/keygenmusic-api
```

### Docker Compose Setup

```bash
docker compose up -d
```

### Docker Compose with build

```bash
docker compose up -d --build
```

# Usage

This API has a rate limit of 100 requests per minute. (If you host it yourself, you can set your own rate limit.)<br>
The docs are available at [https://keygenmusic.kizuren.dev/docs](https://keygenmusic.kizuren.dev/docs)

# Legal
This project is under the MIT License.<br>
You can find the full license text in the [LICENSE](LICENSE) file.

This project is an unofficial API for Keygenmusic, created to provide access to their music data in a structured format. It is intended for educational and personal use only. Enjoy :)
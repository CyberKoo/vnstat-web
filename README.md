# vnStat Web

English | [Simplified Chinese](README_CN.md)

vnStat Web is a web interface for vnStat, the network traffic monitor. It displays real-time bandwidth and historical traffic statistics for each network interface in the browser. It is a pure frontend application: the built files can be served by any static file server.

## Screenshots

**Live monitoring — light and dark theme**

![Live monitoring (light theme)](docs/screenshots/live-light.png)
![Live monitoring (dark theme)](docs/screenshots/live-dark.png)

**Daily traffic — calendar heatmap, trend chart and monthly quota**

![Daily traffic](docs/screenshots/daily-light.png)

**Interface overview — 30-day aggregate trend**

![Interface overview](docs/screenshots/overview-light.png)

**Mobile layout**

<img src="docs/screenshots/mobile-light.png" width="360" alt="Live monitoring on a mobile viewport" />

## Features

- **Real-time monitoring** — current RX/TX rates, today's totals and bandwidth utilization per interface, with a replayable rate curve for the last 48 hours
- **Historical statistics** — traffic by hour, day, month and year, plus an all-time peak ranking
- **Calendar heatmap** — daily traffic distribution over the past year in a calendar view
- **Hour-of-day profile** — a 24-hour traffic distribution and a weekday × hour heatmap
- **Monthly quota** — set a monthly quota to track current usage, progress and the projected end-of-month total
- **Interface overview** — aggregated traffic, per-interface share and a 30-day trend across all interfaces
- **Multiple languages** — Simplified Chinese, Traditional Chinese, English, Japanese, Russian, German and Spanish; follows the browser language by default and can be switched in the interface
- **Rate units** — rates can be displayed in bits (e.g. Mbps) or bytes (e.g. MiB/s)
- **Dark theme** — follows the system setting by default and can be switched manually
- **Mobile layout** — switches automatically to a mobile layout on narrow screens

## Requirements

- vnStat installed on the server, with a version that supports JSON output
- A running API that serves vnStat data (see "Data API" below)
- Node.js 20 or later and pnpm 9 or later, only needed when building from source

## Deployment

### Build

```bash
pnpm install
cp .env.example .env
pnpm build
```

Edit the variables in `.env` as described below before building. The output is written to `dist/`. The default template already produces a deployable bundle, since the app only ever requests `/api/v1` relative to its own origin.

### Configuration

All variables live in `.env`. Only the first group is compiled into the bundle:

| Variable                                | Description                                                                                      | Default   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- |
| `VITE_APP_BASE_API`                     | URL prefix the app uses for data requests; must match the mount path of the data API             | `/api/v1` |
| `VITE_APP_MAX_POINTS`                   | Number of data points kept on the real-time chart                                                | `60`      |
| `VITE_APP_LINK_SPEED`                   | Link speed (Mbps), used to compute bandwidth utilization when the API reports no interface speed | `1000`    |
| `VITE_APP_SSE_SHUTDOWN_RECONNECT_DELAY` | Delay (ms) before reconnecting after the live stream shuts down                                  | `30000`   |

The dev and preview servers read one more pair, declared in `.env.development`. The app never reads them, so they cannot reach a build:

| Variable          | Description                                                                           | Default |
| ----------------- | ------------------------------------------------------------------------------------- | ------- |
| `VITE_API_SERVER` | Address of the data API, used only as the proxy target of the dev and preview servers | —       |
| `VITE_APP_PROXY`  | Enable that proxy. When `false`, `VITE_API_SERVER` is ignored entirely                | `false` |

### Nginx example

The app requests data only under `/api/v1`. In production, reverse-proxy that path to the data API in your static server:

```nginx
server {
    listen 80;
    root /var/www/vnstat-web;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### Local development

```bash
pnpm dev
```

With the proxy enabled, the dev server forwards `/api/v1` to the address in `VITE_API_SERVER`.

The app always requests `/api/v1` relative to its own origin. `VITE_API_SERVER` and `VITE_APP_PROXY` configure the dev and preview servers only, so a build never embeds a machine-specific address — which is why production is set up by reverse-proxying the path instead.

## Data API

vnStat Web does not include a server-side component and must be paired with a gateway that exposes vnStat data as JSON. The recommended companion is [vnstat-rs-api](https://github.com/CyberKoo/vnstat-rs-api), a Rust gateway that converts vnStat output into a REST API and streams live traffic in real time.

## License

[BSD 3-Clause](LICENSE) © 2025 [CyberKoo](https://github.com/CyberKoo)

The full license text is available in [LICENSE](LICENSE).

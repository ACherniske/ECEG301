<p align="center">
  <img src="https://img.shields.io/badge/MedRoute-Suite-2563eb?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xOSAxN2gtNGwtNCA0bC0xLTEyaDEwbC0xIDh6Ii8+PC9zdmc+" alt="MedRoute Suite"/>
</p>

<h1 align="center">MedRoute Suite</h1>

<p align="center">
  <strong>Healthcare Transportation Management Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub Pages"/>
  <img src="https://img.shields.io/badge/Data-Google%20Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white" alt="Google Sheets"/>
</p>

---

## Overview

MedRoute Suite is a comprehensive healthcare transportation management platform designed to streamline patient transportation logistics. It connects healthcare providers with drivers to ensure patients reach their medical appointments safely and on time. This project was created as part of ECEG 301 - Praxis of Engineering Design at Bucknell University in 2025. The goal of the course was to practice systems engineering, planning, and execution while completing research and interviews about topics surrounding United Nations Sustainable Development Goal 3 - Good Health and Wellbeing.

## Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (GitHub Pages)"]
        LP[Landing Page]
        PP[Provider Portal]
        DP[Driver Portal]
    end

    subgraph Backend["Backend (Vercel)"]
        API[Express.js API]
        AUTH[JWT Authentication]
        EMAIL[Email Service]
        MAPS[Google Maps Service]
    end

    subgraph Data["Data Layer"]
        GS[(Google Sheets)]
    end

    LP --> PP
    LP --> DP
    PP <--> API
    DP <--> API
    API <--> AUTH
    API --> EMAIL
    API <--> MAPS
    API <--> GS
```

## Project Structure

```mermaid
graph LR
    subgraph Root["📁 ECEG301"]
        B["📁 backend"]
        F["📁 frontend"]
        GH["📁 gh-pages-root"]
        S["📁 scripts"]
    end

    subgraph Backend["backend/"]
        API2["📁 api"]
        ROUTES["📁 routes"]
        SERVICES["📁 services"]
        CONFIG["📁 config"]
    end

    subgraph Frontend2["frontend/"]
        PROV["📁 provider-portal"]
        DRIV["📁 driver-portal"]
    end

    B --> Backend
    F --> Frontend2
```

## Features

| Portal | Features |
|--------|----------|
| **Provider Portal** | Patient search, Appointment management, Ride scheduling, Dashboard analytics |
| **Driver Portal** | Available rides view, Ride acceptance, Real-time status updates, Trip history |

## Ride Workflow

```mermaid
stateDiagram-v2
    [*] --> pending: Provider creates ride
    pending --> confirmed: Patient confirms via email
    confirmed --> claimed: Driver accepts
    claimed --> en_route: Driver starts navigation
    en_route --> in_transit: Patient picked up
    in_transit --> arrived: At appointment
    arrived --> completed: Trip finished
    
    pending --> cancelled: Provider cancels
    confirmed --> cancelled: Patient/Provider cancels
    claimed --> cancelled: Driver cancels
    
    note right of pending: Awaiting patient confirmation
    note right of confirmed: Available for drivers
    note right of claimed: Driver assigned
    note right of completed: Trip logged in history
```

> **See [FLOWS.md](./FLOWS.md) for detailed user and technical flow diagrams.**

## Quick Start

### Prerequisites
- Node.js 20.x
- npm or yarn
- Google Cloud Service Account (for Sheets API)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev
```

### Frontend Setup
```bash
# Provider Portal
cd frontend/provider-portal
npm install
npm run dev

# Driver Portal
cd frontend/driver-portal
npm install
npm run dev
```

## Live Demo

| Portal | URL |
|--------|-----|
| Landing Page | [acherniske.github.io/ECEG301](https://acherniske.github.io/ECEG301) |
| Provider Portal | [acherniske.github.io/ECEG301/provider](https://acherniske.github.io/ECEG301/provider) |
| Driver Portal | [acherniske.github.io/ECEG301/driver](https://acherniske.github.io/ECEG301/driver) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, TailwindCSS, Zustand, React Router |
| **Backend** | Node.js, Express.js, JWT, bcrypt |
| **Database** | Google Sheets API |
| **Services** | Google Maps API, Nodemailer |
| **Deployment** | Vercel (API), GitHub Pages (Frontend) |

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User authentication |
| `POST /api/auth/driver/login` | Driver authentication |
| `GET /api/org/:orgId/rides` | Get organization rides |
| `POST /api/org/:orgId/rides` | Create new ride |
| `GET /api/driver/rides` | Get available rides |
| `PATCH /api/driver/rides/:id/accept` | Accept a ride |

> See [`backend/routes/COMPLETE_API_DOCUMENTATION.md`](./backend/routes/COMPLETE_API_DOCUMENTATION.md) for full API docs.

## Security

- JWT token-based authentication
- bcrypt password hashing
- Organization-scoped data isolation
- CORS protection
- Input validation

## License

This project is part of ECEG301 coursework.

---

<p align="center">
  <sub>Built with ❤️ for healthcare accessibility</sub>
</p>

# Provider Portal Frontend

A React-based web application for healthcare providers to schedule rides for patients

## Features

- Daily Dashboard
- Ride Scheduling System
- EHR Integration
- Secure Authentication
- Responsive Design for Desktop

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```

### Environment Setup

Create a `.env` file in the root directory with the following variables:
```
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH_DOMAIN=your-auth-domain
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API service functions
├── utils/         # Helper functions
└── styles/        # Global styles
```
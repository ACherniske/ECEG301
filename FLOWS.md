# MedRoute Suite - Flow Diagrams

Detailed user and technical flow diagrams for the MedRoute Suite healthcare transportation platform.

---

## Our System Design Process

As part of ECEG 301, we followed a structured systems engineering approach to design and build MedRoute Suite. This document captures how we worked through each phase of the design process, using diagrams to communicate our thinking and validate our architecture decisions.

### 1. Problem Identification

Through our research aligned with UN SDG 3 (Good Health and Wellbeing), we identified **transportation as a key challenge in rural areas**. Many patients miss critical medical appointments simply because they lack reliable transportation options. This problem disproportionately affects elderly patients, those with disabilities, and low-income communities where public transit is limited or nonexistent.

### 2. Stakeholder Identification

We began by identifying the key users who would interact with our system. Through interviews and research, we identified three primary stakeholders:

- **Healthcare Providers** - Staff at medical facilities who need to arrange transportation for patients
- **Patients** - Individuals who need rides to medical appointments but may lack reliable transportation
- **Drivers** - Volunteer or employed drivers who provide the transportation service

This stakeholder analysis directly informed our system architecture, ensuring each user type has a dedicated interface tailored to their needs.

### 2. High-Level Architecture Design

With our stakeholders defined, we designed the system architecture to show how each component connects. We chose a decoupled architecture with:

- **Separate frontend portals** for providers and drivers (different use cases, different interfaces)
- **Centralized backend API** handling all business logic
- **Google Sheets as our database** (rapid prototyping, easy data inspection during development)
- **Third-party services** for email notifications and distance calculations

---

## System Architecture

```mermaid
graph TB
    subgraph Users["Users"]
        PROV[Healthcare Provider]
        PAT[Patient]
        DRV[Driver]
    end
    
    subgraph Frontend["Frontend - GitHub Pages"]
        LP[Landing Page]
        PP[Provider Portal]
        DP[Driver Portal]
    end
    
    subgraph Backend["Backend - Vercel"]
        API[Express.js API]
        AUTH[JWT Auth]
        EMAIL[Email Service]
        MAPS[Google Maps]
    end
    
    subgraph Data["Data Layer"]
        GS[(Google Sheets)]
    end
    
    PROV --> PP
    PAT --> EMAIL
    DRV --> DP
    
    PP --> API
    DP --> API
    API --> GS
    API --> EMAIL
    API --> MAPS
```

### Why This Architecture?

We chose this architecture based on several key decisions:

1. **Static frontend hosting (GitHub Pages)** - Free, reliable, and integrates with our version control workflow
2. **Serverless backend (Vercel)** - Scales automatically, no server management, generous free tier
3. **Google Sheets as database** - Allowed non-technical stakeholders to view/edit data during development and testing
4. **Modular services** - Email and Maps are separate concerns, making the system easier to test and maintain

---

## User Flows

### 3. User Journey Mapping

After establishing our architecture, we mapped out the detailed user journeys for each stakeholder. These flowcharts helped us identify all the screens we needed to build and the decision points users would encounter.

### Provider: Scheduling a Ride

```mermaid
flowchart TD
    A[Provider logs in] --> B[Opens Dashboard]
    B --> C[Clicks 'Schedule Ride']
    C --> D[Step 1: Search Patient]
    D --> E{Patient Found?}
    E -->|No| D
    E -->|Yes| F[Step 2: Select Appointment]
    F --> G[View upcoming appointments from EHR]
    G --> H[Select appointment]
    H --> I[Step 3: Transportation Details]
    I --> J[Enter pickup address]
    J --> K[Add notes/requirements]
    K --> L{Round trip needed?}
    L -->|Yes| M[Enable round trip]
    L -->|No| N[Submit ride request]
    M --> N
    N --> O[Ride created with 'pending' status]
    O --> P[Email sent to patient]
    P --> Q[Provider sees confirmation]
```

### Patient: Confirming a Ride

```mermaid
flowchart TD
    A[Patient receives email] --> B[Clicks confirmation link]
    B --> C[Views ride details page]
    C --> D{Confirm ride?}
    D -->|Yes| E[Clicks 'Confirm Ride']
    E --> F[Status changes to 'confirmed']
    F --> G[Ride visible to drivers]
    D -->|No| H[Can contact provider]
```

### Driver: Accepting and Completing a Ride

```mermaid
flowchart TD
    A[Driver logs in] --> B[Views Available Rides]
    B --> C[Sees ride cards with details]
    C --> D[Selects ride to accept]
    D --> E{Accept ride?}
    E -->|Yes| F[Clicks 'Accept Ride']
    F --> G[System calculates pickup time]
    G --> H[Status: 'claimed']
    H --> I[Ride moves to 'My Rides']
    
    I --> J[Driver starts trip]
    J --> K[Status: 'en route']
    K --> L[Arrives at pickup]
    L --> M[Picks up patient]
    M --> N[Status: 'in transit']
    N --> O[Arrives at appointment]
    O --> P[Status: 'arrived']
    
    P --> Q{Round trip?}
    Q -->|No| R[Complete ride]
    Q -->|Yes| S[Wait for appointment]
    S --> T[Return pickup]
    T --> U[Transport home]
    U --> R
    R --> V[Status: 'completed']
```

### What We Learned from User Flow Mapping

Creating these flowcharts helped us:
- **Identify edge cases** - What happens if a patient doesn't confirm? What if a driver cancels mid-trip?
- **Design the status system** - We needed clear states (pending → confirmed → claimed → completed) to track rides
- **Plan the UI/UX** - Each box in the flowchart roughly corresponds to a screen or component we needed to build

---

## Technical Flows

### 4. Sequence Diagram Design

Once we understood the user journeys, we designed the technical implementation using sequence diagrams. These show the exact API calls, database operations, and service integrations that happen behind the scenes.

### Ride Creation - Backend Process

This sequence diagram shows what happens when a provider submits a new ride request. We designed this flow to include:
- **Validation** - Ensuring all required data is present and the appointment isn't in the past
- **Duplicate detection** - Preventing accidental double-bookings
- **Distance calculation** - Using Google Maps to estimate travel time
- **Email notification** - Sending confirmation requests to patients

```mermaid
sequenceDiagram
    participant PP as Provider Portal
    participant API as Express API
    participant GS as Google Sheets
    participant MAPS as Google Maps
    participant EMAIL as Email Service
    participant PAT as Patient

    PP->>API: POST /api/org/:orgId/rides
    API->>API: Validate JWT token
    API->>API: Validate required fields
    API->>GS: Check for duplicate rides
    
    alt Duplicate found
        API-->>PP: 409 Conflict
    else No duplicate
        API->>MAPS: Calculate distance & duration
        MAPS-->>API: Travel time data
        API->>API: Calculate pickup time
        API->>API: Generate confirmation token
        API->>GS: Insert new ride row
        GS-->>API: Success
        API->>EMAIL: Send confirmation email
        EMAIL->>PAT: Confirmation link email
        API-->>PP: 201 Created + ride details
    end
```

### Ride Acceptance - Backend Process

When a driver accepts a ride, the system performs several operations to ensure a smooth handoff:

```mermaid
sequenceDiagram
    participant DP as Driver Portal
    participant API as Express API
    participant GS as Google Sheets
    participant MAPS as Google Maps

    DP->>API: PATCH /api/driver/rides/:id/accept
    API->>API: Validate driver JWT
    API->>GS: Get ride details
    GS-->>API: Ride data
    
    API->>API: Check ride status = 'confirmed'
    
    alt Already claimed
        API-->>DP: 400 Ride unavailable
    else Available
        API->>GS: Get driver details
        API->>MAPS: Calculate driver → pickup distance
        MAPS-->>API: Distance data
        API->>API: Calculate optimal pickup time
        API->>GS: Update ride with driver info
        GS-->>API: Success
        API-->>DP: 200 OK + pickup time
    end
```

### Authentication Flow

We implemented JWT-based authentication to secure our API. This sequence shows the login process:

```mermaid
sequenceDiagram
    participant User as User
    participant FE as Frontend
    participant API as Express API
    participant GS as Google Sheets

    User->>FE: Enter credentials
    FE->>API: POST /api/auth/login
    API->>GS: Query user accounts
    GS-->>API: User record
    API->>API: Verify password (bcrypt)
    
    alt Invalid credentials
        API-->>FE: 401 Unauthorized
    else Valid
        API->>API: Generate JWT token
        API-->>FE: 200 OK + token + user data
        FE->>FE: Store token in localStorage
        FE->>User: Redirect to dashboard
    end
```

### Technical Design Decisions

Through creating these sequence diagrams, we made several key technical decisions:

| Decision | Rationale |
|----------|-----------|
| JWT tokens | Stateless authentication - no session storage needed on serverless backend |
| bcrypt hashing | Industry standard for password security |
| Confirmation tokens | Allows patients to confirm rides without creating accounts |
| Google Maps integration | Accurate travel time estimates for pickup time calculation |

---

## Ride Status Lifecycle

Understanding how a ride transitions through different states was critical for building a reliable system. This state diagram helped us define clear boundaries for what actions are allowed at each stage:

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

### Status Design Considerations

Creating this state machine helped us answer important questions:

- **Who can cancel when?** Different stakeholders have different cancellation windows based on the ride status
- **What triggers state changes?** Each transition has a specific API endpoint and validation logic
- **How do we prevent race conditions?** A ride must be `confirmed` to be claimed - we check this atomically
- **What happens on errors?** Failed transitions don't corrupt state - rides stay in their current status

---

## Data Flow Overview

```mermaid
flowchart LR
    subgraph Provider["Provider Portal"]
        PS[Patient Search]
        AS[Appointment Select]
        RC[Ride Create]
    end
    
    subgraph Patient["Patient"]
        PE[Email Received]
        PC[Confirm Ride]
    end
    
    subgraph Driver["Driver Portal"]
        VR[View Rides]
        AR[Accept Ride]
        TR[Track Ride]
        CR[Complete Ride]
    end
    
    subgraph Backend["API"]
        API[Express Server]
    end
    
    subgraph Storage["Data"]
        GS[(Google Sheets)]
    end
    
    PS --> API
    AS --> API
    RC --> API
    API --> PE
    PC --> API
    VR --> API
    AR --> API
    TR --> API
    CR --> API
    API <--> GS
```

---

## Component Interaction

We structured our frontend using a clear separation between UI state management (Zustand stores) and API communication (services). This diagram shows how data flows through our component architecture:

```mermaid
flowchart TB
    subgraph FE["Frontend Components"]
        direction TB
        AUTH[Auth Store]
        RIDE[Ride Store]
        DRIVER[Driver Store]
    end
    
    subgraph SERVICES["API Services"]
        direction TB
        AS[authService]
        RS[rideService]
        DS[driverService]
    end
    
    subgraph API["Backend Routes"]
        direction TB
        AR["auth routes"]
        RR["rides routes"]
        DR["driver routes"]
    end
    
    AUTH <--> AS
    RIDE <--> RS
    DRIVER <--> DS
    
    AS <--> AR
    RS <--> RR
    DS <--> DR
```

### Why This Architecture

This component structure evolved from our development experience:

1. **Zustand stores** keep global state simple - no prop drilling through deep component trees
2. **Service layer** abstracts API calls - components don't know about HTTP details
3. **Route separation** on the backend mirrors frontend concerns - easier to find code
4. **Bidirectional arrows** represent the request/response cycle each interaction follows

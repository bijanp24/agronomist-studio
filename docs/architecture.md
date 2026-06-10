# System Architecture & Deployment Philosophy

## Core Stack
* **Frontend:** Angular 22 (Standalone), Tailwind CSS v4, Signals.
* **Backend (Future):** .NET (C#) API or Node.js/Express.
* **Database/Data Warehouse:** Neon (Serverless Postgres), Motherduck.
* **Hosting & CI/CD:** Netlify, GitHub Actions.

## Phase 1: Frontend Isolation & Mocking
* **Decoupled Development:** The application is built as a Full SPA. We do not wait for backend APIs to unblock frontend development.
* **API Simulation Layer:** All data fetching must go through Angular Services that return RxJS Observables, simulating network latency. 
* **Integration Readiness:** By hitting mock endpoints in the client first, we effectively run localized integration tests early in the development cycle. API keys and vendor integrations are deferred until late in the process to avoid external blockers.

## Deployment & QA Philosophy
* **Linux-First for Heavy Lifting:** While development may occur on Windows/Mac, production and E2E testing environments (like Playwright/Puppeteer) must be deployed to containerized Linux instances (Debian/Ubuntu). 
* **Avoiding Windows Server Overhead:** We strictly avoid deploying browser automation to Windows Server VMs to bypass missing Desktop Experience features, Visual C++ redistributable dependency nightmares, and manual registry patching.
* **QA Sustainability:** CI/CD pipelines are treated as a mathematical flow rate. Automated E2E tests must remain stable and isolated (treated almost like their own Class Library) to ensure manual QA queues do not overflow due to fast-paced Chromium updates.

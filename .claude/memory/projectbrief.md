# Project Brief

## What This Project Is

**Namorix** is a browser-based desktop shell, self-hosted. Users open the server URL and see a desktop interface: taskbar, launcher, window manager. System apps (File manager, Terminal, Settings, Log viewer) run in internal shell windows. External addons (apps in Docker containers) open in a **new tab**.

Desktop acts as the central orchestrator: user authentication, addon container lifecycle coordination, and event bus for the entire system.

## Why This Project Exists

- Self-hosted alternative to cloud-based desktops
- Full control over data and addons
- Single-node deployment for personal/home server use
- Familiar browser-based desktop metaphor

## Core Problems It Solves

1. **Unified desktop experience** — Browser-based shell with window management, taskbar, launcher
2. **Addon ecosystem** — Docker-based addons that run locally but open in browser tabs
3. **Centralized auth** — Desktop issues/trusts sessions; addons verify but don't issue tokens
4. **Realtime events** — Socket.IO for shell notifications and addon status updates

## Intended Outcome

A functional self-hosted desktop that users access via browser, with:
- Local system apps (File manager, Terminal, Settings, Log viewer)
- External addons via Docker containers
- Secure HttpOnly cookie-based authentication
- Real-time shell events and notifications
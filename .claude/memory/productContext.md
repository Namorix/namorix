# Product Context

## How This Project Should Work

### User Experience Goals

1. **Familiar Desktop Metaphor** — Users see a taskbar, desktop icons, and windows in a browser-based shell
2. **Seamless Addon Integration** — External addons appear to open instantly in new browser tabs
3. **Responsive Shell** — All interactions feel snappy with real-time status updates
4. **Secure by Default** — HttpOnly cookies, CSRF protection, no token leakage

### User Flow

1. User navigates to server URL → sees login page
2. After login → sees desktop with taskbar, launcher
3. Click system app icon → window opens in shell
4. Click addon icon → tùy mode: widget mở trong dashboard, hoặc full app mở tab mới
5. All notifications appear via SignalR realtime channel

### Design Language

- Browser-based desktop aesthetic with dark/light theme support
- **Material Design 3 Tonal Elevation** — hierarchy thể hiện qua surface tone stack, không dùng border hay box-shadow
- Consistent window chrome (title bar, close/minimize/maximize)
- Taskbar shows running windows and system tray

## What This Project Is NOT

- Not a general-purpose web app
- Not a Docker management dashboard (addon containers are separate apps)
- Not multi-tenant (single-user focus)
- Not a replacement for full desktop environments

## Success Criteria

- User can log in and see desktop
- System apps open and function correctly
- Addons can be installed, started, stopped from UI
- Notifications appear in real-time
- Session persists across browser restarts
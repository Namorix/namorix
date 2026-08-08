# syntax=docker/dockerfile:1

# ---------- Stage 1: Frontend build ----------
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend
WORKDIR /repo
RUN corepack enable
ENV NODE_ENV=production

COPY frontend/pnpm-workspace.yaml frontend/pnpm-lock.yaml frontend/package.json frontend/tsconfig*.json frontend/vite.config.ts frontend/index.html frontend/
COPY frontend/src/ frontend/src/
COPY frontend/packages/ frontend/packages/
COPY frontend/public/ frontend/public/
# vite.config reads backend csproj for version constants — must exist at build time
COPY backend/src/Namorix.Core/Namorix.Core.csproj backend/src/Namorix.Core/
COPY backend/src/Namorix.Server/Namorix.Server.csproj backend/src/Namorix.Server/

RUN cd frontend && pnpm install --frozen-lockfile
RUN cd frontend && pnpm build

# ---------- Stage 2: Backend publish ----------
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG TARGETARCH
WORKDIR /repo
COPY backend/src/ backend/src/
RUN dotnet publish backend/src/Namorix.Server/Namorix.Server.csproj \
    -c Release -o /publish \
    -a $TARGETARCH \
    --self-contained false

# ---------- Stage 3: Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=build /publish .
# Built SPA goes next to the app DLL; Program.cs serves it from ./public
COPY --from=frontend /repo/frontend/dist /app/public

EXPOSE 5001 5002 80 443
ENTRYPOINT ["dotnet", "Namorix.Server.dll"]

# Toolkit PPR (Pagos por Resultado)

## Introducción

Este documento presenta una descripción general de las actividades, metodologías y resultados clave asociados al Toolkit. Su propósito es detallar la arquitectura, los componentes y sus relaciones, así como los procedimientos de instalación, configuración e implementación para un proyecto de trazabilidad y pagos basados en resultados, utilizando el toolkit existente, mecanismos de autenticación segura, trazabilidad en blockchain y pagos mediante tokens y stablecoins.

---

## Contenido

1. [Diagrama de Arquitectura General](#1-arquitectura-general)
2. [Base de Datos](#2-base-de-datos)
3. [SSO (Autenticación)](#3-sso-autenticación)
4. [Backend (API)](#4-backend-api)
5. [Frontend](#5-frontend)

---

## 1. Arquitectura General

![Arquitectura](./img/arquitectura.png)

### Componentes Principales

Este diagrama describe los cuatro componentes principales para ejecutar la aplicación PPR y sus relaciones.

---

## 2. Base de Datos
https://github.com/mongodb/mongo

### Guía Rápida de Instalación de MongoDB

#### Ejecutar el Contenedor de MongoDB

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:latest
```

---

## 3. SSO (Autenticación)

### Configuración de Keycloak
https://github.com/keycloak/keycloak

La aplicación requiere un servidor Keycloak correctamente configurado para la autenticación. A continuación se detalla la configuración necesaria.

### Configuración del Realm

- Crear un nuevo realm llamado `ppr-realm`
- Configurar los ajustes del realm:
  - Habilitar el registro de usuarios si es necesario
  - Establecer los tiempos de expiración de sesión según los requisitos

### Configuración del Cliente

Crear un cliente para la API del backend:

| Configuración | Valor |
|---|---|
| Client ID | `ppr-api-client` |
| Protocolo del Cliente | `openid-connect` |
| Tipo de Acceso | `confidential` |
| Flujo Estándar Habilitado | ACTIVADO |
| Acceso Directo (Direct Access Grants) | ACTIVADO |
| Cuentas de Servicio | ACTIVADO (si se usa autenticación máquina a máquina) |

**URIs de Redirección Válidas**

```
http://localhost:3000/*
https://tu-dominio-de-produccion.com/*
```

### Roles

Crear los siguientes roles de realm:

| Rol | Descripción |
|---|---|
| `Sponsor` | Puede crear y financiar proyectos |
| `Provider` | Puede prestar servicios y cargar evidencias |
| `User` | Puede ver y participar en proyectos |
| `Verifier` | Puede auditar evidencias y aprobar fases |

### Obtener la Clave Pública del Realm

1. Ir a **Configuración del Realm → Claves**
2. Hacer clic en el botón **Clave pública** para la clave RSA
3. Copiar la clave y agregarla al archivo `.env`:

```env
KEYCLOAK_REALM_PUBLIC_KEY="<realm-pk>"
```

### Variables de Entorno

```env
KEYCLOAK_AUTH_SERVER_URL="https://tu-keycloak.ejemplo.com"
KEYCLOAK_REALM="ppr-realm"
KEYCLOAK_CLIENT_ID="ppr-api-client"
KEYCLOAK_SECRET="<tu-client-secret>"
KEYCLOAK_REALM_PUBLIC_KEY="<tu-clave-publica-del-realm>"
```

> **Nota:** El backend utiliza `nest-keycloak-connect` para la validación de JWT. Todos los endpoints de la API (excepto `/health`) requieren un token Bearer válido.

---

## 4. Backend (API)
https://github.com/LACNetNetworks/PPR/tree/main/ppr-backend

Una robusta API backend desarrollada en NestJS para la plataforma PPR, que permite la gestión de financiamiento de proyectos, seguimiento de evidencias e integración con blockchain para mayor transparencia.

### Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| NestJS | 11.x | Framework principal |
| MongoDB | 8.x | Base de datos (vía Mongoose) |
| Keycloak | 26.x | Autenticación y autorización |
| ethers.js | 6.x | Integración con blockchain |
| Swagger | 11.x | Documentación de la API |
| TypeScript | 5.x | Lenguaje de programación |

### Arquitectura

El proyecto sigue los principios de Arquitectura Limpia (Clean Architecture) con tres capas principales:

```
src/
├── application/     # Casos de uso y DTOs (lógica de negocio)
├── domain/          # Entidades, interfaces de repositorios, enums
├── infrastructure/  # Aspectos externos (HTTP, BD, auth, integraciones)
└── bootstrap/       # Inicialización y configuración de la app
```

### Módulos de Dominio

| Módulo | Descripción |
|---|---|
| `projects` | Gestión principal de proyectos |
| `phases` | Fases/etapas del proyecto |
| `tasks` | Tareas de cada fase |
| `contributions` | Contribuciones de financiamiento |
| `evidences` | Archivos de evidencia y anclaje en blockchain |
| `users` | Gestión de usuarios (sponsor, provider, user, verifier) |
| `organizations` | Gestión de organizaciones |
| `transactions` | Registro de auditoría de transacciones |
| `audit-revisions` | Seguimiento de revisiones de auditoría |

### Integraciones

| Integración | Propósito |
|---|---|
| POK API | Integración con servicio externo |
| Blockchain (LNet) | Anclaje y verificación de transacciones |
| Almacenamiento de Archivos (GCS) | Almacenamiento de archivos de evidencia |

### Requisitos Previos

- Node.js 22.x (ver Dockerfile)
- Instancia de MongoDB (local o remota)
- Servidor Keycloak configurado con `ppr-realm`
- Acceso a la red LNet (opcional, para funcionalidades blockchain)
- Acceso a la red ZKSync
- Acceso a cualquier sistema EVM

### Inicio Rápido

#### 1. Instalar dependencias

```bash
npm install
```

#### 2. Configurar el entorno

Copiar `.env.example` a `.env` y configurar:

```env
# Servidor
NODE_ENV="development"
PORT="3000"
GLOBAL_PREFIX="ppr"

# MongoDB
MONGODB_URI="mongodb://user:pass@localhost:27017/ppr_db"
MONGODB_DB="ppr_db"

# Keycloak
KEYCLOAK_AUTH_SERVER_URL="https://tu-keycloak.ejemplo.com"
KEYCLOAK_REALM="ppr-realm"
KEYCLOAK_CLIENT_ID="ppr-api-client"
KEYCLOAK_REALM_PUBLIC_KEY="<tu-clave-publica>"

# Servicios Externos
FILE_STORE_API_URL="<url-api-almacenamiento-archivos>"
FILE_STORE_API_KEY="<tu-api-key>"

# Blockchain (opcional)
RPC_URL="<lacchain-rpc-url>"
PRIVATE_KEY="<clave-privada-blockchain>"
ADDRESS_CONTRACT="<direccion-smart-contract>"
```

#### 3. Ejecutar la aplicación

```bash
# Desarrollo (con recarga en caliente)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

#### 4. Acceder a la API

- **URL Base de la API:** `http://localhost:3000/ppr`
- **Documentación Swagger:** `http://localhost:3000/ppr/docs`
- **Health Check:** `http://localhost:3000/ppr/health`

### Endpoints de la API

#### Proyectos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/projects` | Listar todos los proyectos |
| GET | `/projects/:id` | Obtener proyecto por ID |
| POST | `/projects` | Crear nuevo proyecto |
| PUT | `/projects/:id` | Actualizar proyecto |
| GET | `/projects/:projectId/phases` | Listar fases del proyecto |
| POST | `/projects/:projectId/phases` | Agregar fase al proyecto |
| GET | `/projects/:projectId/members` | Listar miembros del proyecto |
| GET | `/projects/:projectId/contributions` | Listar contribuciones |

#### Usuarios

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/users` | Listar usuarios |
| GET | `/users/:id` | Obtener usuario por ID |
| POST | `/users` | Crear usuario |

#### Evidencias

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/evidences` | Listar evidencias |
| POST | `/evidences` | Cargar evidencia |

> **Nota:** Todos los endpoints requieren autenticación mediante token Bearer a través de Keycloak.

### Docker

#### Construir y ejecutar

```bash
# Construir imagen
docker build -t ppr-backend .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env ppr-backend
```

#### Usando docker-compose

```bash
docker-compose up -d
```

### Scripts

| Script | Descripción |
|---|---|
| `npm run start:dev` | Iniciar con recarga en caliente |
| `npm run start:debug` | Iniciar con depurador |
| `npm run build` | Compilar para producción |
| `npm run start:prod` | Ejecutar compilación de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run format` | Formatear con Prettier |
| `npm run test` | Ejecutar pruebas unitarias |
| `npm run test:e2e` | Ejecutar pruebas e2e |
| `npm run test:cov` | Ejecutar pruebas con cobertura |

### Roles de Usuario

| Rol | Descripción |
|---|---|
| `Sponsor` | Crea y financia proyectos |
| `Provider` | Presta servicios del proyecto, carga evidencias |
| `User` | Se beneficia de los proyectos |
| `Verifier` | Audita evidencias y el progreso del proyecto |

---

## 5. Frontend
https://github.com/LACNetNetworks/PPR/tree/main/ppr-frontend

Un frontend moderno en Next.js 15 para la plataforma PPR, que proporciona paneles de control basados en roles para la gestión de financiamiento de proyectos, seguimiento de evidencias y monitoreo de contribuciones.

### Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 15.x | Framework React (App Router) |
| React | 19.x | Biblioteca de UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4.x | Estilos |
| Keycloak JS | 26.x | Autenticación |
| Recharts | 3.x | Visualización de datos |
| Motion | 12.x | Animaciones |
| Headless UI | 2.x | Primitivas de UI accesibles |

### Arquitectura

```
src/
├── app/                    # App Router de Next.js
│   ├── (app)/              # Rutas protegidas
│   │   ├── sponsor/        # Panel de Sponsor
│   │   ├── provider/       # Panel de Provider
│   │   ├── user/           # Panel de User
│   │   └── verifier/       # Panel de Verifier
│   └── (auth)/             # Rutas de autenticación (login, registro)
├── components/             # Componentes UI reutilizables
│   ├── grids/              # Diseños de cuadrícula
│   ├── tables/             # Tablas de datos
│   ├── dashboards/         # Componentes de panel
│   ├── sidebars/           # Barras de navegación lateral
│   └── ...                 # Modales, formularios, etc.
├── hooks/                  # Hooks personalizados de React
├── lib/                    # Utilidades y servicios de API
└── types/                  # Tipos de TypeScript
```

### Componentes Clave

| Componente | Descripción |
|---|---|
| `sidebar.tsx` | Barra de navegación lateral basada en roles |
| `projects-table.tsx` | Listado y gestión de proyectos |
| `contribution-modal.tsx` | Ingreso de contribuciones |
| `evidence-detail-modal.tsx` | Visualización de evidencias |
| `audit-modal.tsx` | Flujos de trabajo de verificación |
| `keycloak-provider.tsx` | Proveedor de contexto de autenticación |

### Roles de Usuario

| Rol | Panel | Capacidades |
|---|---|---|
| `Sponsor` | `/sponsor` | Crear proyectos, gestionar financiamiento, agregar colaboradores |
| `Provider` | `/provider` | Prestar servicios, cargar evidencias, seguimiento de fases |
| `User` | `/user` | Ver proyectos, seguimiento de beneficios |
| `Verifier` | `/verifier` | Auditar evidencias, aprobar fases |

### Requisitos Previos

- Node.js 18.x o superior
- npm 9.x o superior
- Acceso a la API del Backend PPR
- Servidor Keycloak para autenticación

### Inicio Rápido

#### 1. Instalar dependencias

```bash
npm install
```

#### 2. Configurar el entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/ppr
NEXT_PUBLIC_KEYCLOAK_URL=https://tu-keycloak.ejemplo.com
NEXT_PUBLIC_KEYCLOAK_REALM=ppr-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ppr-frontend
```

#### 3. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

#### 4. Compilar para producción

```bash
npm run build
npm run start
```

### Variables de Entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base de la API del backend |
| `NEXT_PUBLIC_KEYCLOAK_URL` | URL del servidor Keycloak |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Nombre del realm de Keycloak |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | ID del cliente de Keycloak |

### Docker

#### Construir y ejecutar

```bash
# Construir imagen
docker build -t ppr-frontend .

# Ejecutar contenedor
docker run -p 8080:8080 ppr-frontend
```

> El contenedor de producción se ejecuta en el puerto `8080`.

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo en el puerto 5173 |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar ESLint |

### Integración con la API

El frontend se conecta al backend mediante:

- `src/lib/api-client.ts` — Cliente HTTP basado en Axios con autenticación
- `src/lib/api-services.ts` — Hooks de React para operaciones de API (lado cliente)
- `src/lib/api-services-server.ts` — Llamadas a la API del lado servidor

#### Ejemplo de Uso

```typescript
import { useFetchProjects, useCreateProject } from '@/lib/api-services'

function ProjectsList() {
  const fetchProjects = useFetchProjects()
  const createProject = useCreateProject()

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  const handleCreate = async (data) => {
    await createProject(data)
  }
}
```

### Tema de Login de Keycloak

Se incluye un tema de login personalizado para Keycloak en `keycloak-login-theme/`. Desplegarlo en el directorio `themes/` del servidor Keycloak.

### Configuración de Keycloak

El frontend requiere un servidor Keycloak para la autenticación. Utiliza `keycloak-js` y `@react-keycloak/web` para la autenticación del lado cliente.

#### Configuración del Realm

Utilizar el mismo `ppr-realm` que el backend. Asegurarse de que lo siguiente esté configurado:

- **Nombre del realm:** `ppr-realm`
- **Configuración de login:** Configurar según sea necesario (registro, políticas de contraseña, etc.)

#### Configuración del Cliente Frontend

Crear un cliente público para el frontend (separado del cliente del backend):

| Configuración | Valor |
|---|---|
| Client ID | `ppr-frontend` |
| Protocolo del Cliente | `openid-connect` |
| Tipo de Acceso | `public` (sin client secret) |
| Flujo Estándar Habilitado | ACTIVADO |
| Acceso Directo (Direct Access Grants) | DESACTIVADO |
| Flujo Implícito Habilitado | DESACTIVADO |

**URIs de Redirección Válidas**

```
http://localhost:5173/*
https://tu_dominio.com/*
```

#### Orígenes Web (CORS)

```
http://localhost:5173
https://tudominio.com
```

#### Roles

| Rol | Ruta del Panel |
|---|---|
| `sponsor` | `/sponsor` |
| `provider` | `/provider` |
| `user` | `/user` |
| `verifier` | `/verifier` |

> A los usuarios se les debe asignar un rol que determine el acceso a su panel de control.

#### Variables de Entorno

```env
NEXT_PUBLIC_KEYCLOAK_URL="https://tu-keycloak.ejemplo.com"
NEXT_PUBLIC_KEYCLOAK_REALM="ppr-realm"
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="ppr-frontend"
```

### Flujo de Autenticación

1. El usuario navega a la aplicación
2. `KeycloakProvider` se inicializa y verifica si existe una sesión activa
3. Si no está autenticado, el usuario es redirigido al login de Keycloak
4. Tras el login, Keycloak redirige de vuelta con los tokens
5. El frontend almacena los tokens y los incluye en las solicitudes a la API

### Tema de Login Personalizado

Para usar el tema personalizado:

1. Copiar `keycloak-login-theme/` a `<KEYCLOAK_HOME>/themes/ppr-theme`
2. En la Consola de Administración de Keycloak, ir a **Configuración del Realm → Temas**
3. Establecer el **Tema de Login** como `ppr-theme`

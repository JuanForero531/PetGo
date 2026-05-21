# PetGo - Platform de Servicios para Mascotas

## Descripción

PetGo es una plataforma digital que conecta dueños de mascotas con proveedores de servicios especializados. Los usuarios pueden descubrir, contratar y gestionar servicios para sus mascotas, mientras que los proveedores pueden publicar y administrar sus servicios.

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Firebase (Firestore, Authentication)
- **Routing**: React Router v7
- **Styling**: CSS3
- **Font**: DM Sans, Playfair Display

## Características Principales

### Para Usuarios
-  Registro y autenticación
-  Explorar servicios disponibles
-  Ver detalles de servicios
-  Gestionar cuenta

### Para Proveedores
-  Crear y editar servicios
-  Gestionar catálogo de servicios
-  Ver métricas de su negocio
-  Opción de proveedor premium con botón de pago por PayPal

### Para Administradores (Sprint 4)
-  Dashboard con métricas de la plataforma
-  **Gestión completa de usuarios** (NEW)
  - Listar todos los usuarios
  - Buscar y filtrar usuarios
  - Cambiar roles de usuarios
  - Desactivar/Activar cuentas
-  Visualización de análisis de servicios
-  Activar o desactivar el estado premium de proveedores

## Instalación y Setup

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm preview
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Footer.jsx
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   └── ServiceCard.jsx
├── context/            # Context API
│   └── AuthContext.jsx
├── firebase/           # Configuración Firebase
│   ├── auth.js
│   ├── config.js
│   └── firestore.js
├── pages/              # Páginas de la aplicación
│   ├── AdminDashboard.jsx
│   ├── AdminUsers.jsx       # NUEVO - Gestión de usuarios
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── RecoverPassword.jsx
│   ├── ServiceDetail.jsx
│   ├── ServiceForm.jsx
│   └── ServiceList.jsx
├── styles/             # Estilos CSS
│   ├── AdminDashboard.css
│   ├── AdminUsers.css        # NUEVO - Estilos de gestión
│   ├── Login.css
│   └── ... más estilos
├── App.jsx
└── main.jsx
```

## Funcionalidades Sprint 4 (Completadas)

### PT-39: Gestión de Usuarios Admin
Página de administración completa para gestionar usuarios del sistema:
- **Búsqueda**: Por nombre, correo o negocio
- **Filtros**: Por rol (Admin, Proveedor, Usuario) y estado (Activo, Inactivo)
- **Estadísticas**: Contadores de usuarios por rol y estado
- **Cambio de Role**: Modal intuitivo para cambiar roles de usuario
- **Control de Estado**: Desactivar/Activar cuentas de usuario

**Acceso**: `/admin/usuarios` (Solo para roles Admin)

### PT-40: Desactivar Cuenta de Usuario
Sistema robusto para desactivación y reactivación de cuentas:
- Desactivar usuarios activos con confirmación
- Reactivar usuarios inactivos
- Interfaz intuitiva con confirmación de acción
- Estados visuales diferenciados

### PT-41: Consultas Firestore para Métricas
Conjunto completo de funciones Firestore para análisis:
- `obtenerMetricasAdmin()`: Métricas generales de la plataforma
- `buscarUsuarios()`: Búsqueda por término
- `obtenerTodosLosUsuarios()`: Listar usuarios
- `actualizarRolUsuario()`: Cambiar roles
- `desactivarUsuario()` / `activarUsuario()`: Control de estado

## Guía de Uso - Panel de Administración

### Acceder al Panel
1. Inicia sesión con una cuenta administrador
2. Navega a "Gestión de usuarios"

### Buscar Usuarios
- Usa el campo de búsqueda para encontrar usuarios por:
  - Nombre o apellido
  - Correo electrónico
  - Nombre del negocio

### Filtrar Usuarios
Usa los selectores para filtrar por:
- **Rol**: Admin, Proveedor, Usuario Regular
- **Estado**: Activos, Inactivos

### Cambiar Rol de Usuario
1. Click en el botón "Rol" correspondiente
2. Selecciona el nuevo rol en el modal
3. Confirma los cambios

### Desactivar/Activar Usuario
1. Click en "Desactivar" (usuario activo) o "Activar" (usuario inactivo)
2. Confirma la acción
3. El estado se actualizará inmediatamente

## Variables de Entorno

Configurar en `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Para el botón de premium del proveedor, configura también `VITE_PAYPAL_URL` con tu enlace directo de PayPal o correo de contacto asociado (por ejemplo, `mailto:forerojuan531@gmail.com`).

## Scripts Disponibles

- `npm run dev`: Ejecutar servidor de desarrollo
- `npm run build`: Build para producción
- `npm run preview`: Preview del build
- `npm run lint`: Verificar linting

## Rutas Disponibles

| Ruta | Componente | Rol Requerido |
|------|-----------|--------------|
| `/` | Login | - |
| `/login` | Login | - |
| `/registro` | Register | - |
| `/recuperar` | RecoverPassword | - |
| `/servicios` | ServiceList | - |
| `/servicios/:id` | ServiceDetail | - |
| `/proveedor/nuevo` | ServiceForm | Proveedor |
| `/proveedor/editar/:id` | ServiceForm | Proveedor |
| `/admin/dashboard` | AdminDashboard | Admin |
| `/admin/usuarios` | AdminUsers | Admin |

## Notas de Desarrollo

- La aplicación usa Firebase Firestore para almacenamiento de datos
- Todos los componentes están protegidos por rutas según el rol del usuario
- Los estilos siguen una paleta de colores consistente (tonos marrones y ámbar)
- Responsive design para dispositivos móviles y tablets

---

**Última actualización**: Sprint 4 - Gestión de Usuarios Admin

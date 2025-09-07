# 🅿️ Sistema de Gestión de Parqueaderos

Sistema completo para la gestión de 300 espacios de parqueo distribuidos en sótanos -1 y -3, con funcionalidades avanzadas de asignación, control de disponibilidad y gestión de restricciones de pico y placa.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Gestión de Empleados**: Registro completo con información del vehículo y restricciones
- **Gestión de Parqueaderos**: Control de 300 espacios en dos sótanos diferentes  
- **Sistema de Asignaciones**: Manual y automática con validaciones inteligentes
- **Control de Disponibilidad**: Consulta por fechas específicas con filtros avanzados
- **Dashboard en Tiempo Real**: Estadísticas y métricas actualizadas automáticamente

### 🛠️ Características Técnicas
- **Arquitectura Modular**: Separación clara de responsabilidades
- **Responsive Design**: Compatible con dispositivos móviles y escritorio
- **Almacenamiento Local**: Persistencia de datos en localStorage
- **Preparado para la Nube**: Capa de abstracción para futura migración a API
- **Sin Dependencias**: Vanilla JavaScript, HTML5 y CSS3 puro

## 📂 Estructura del Proyecto

```
proyecto-parqueadero-slud/
├── public/
│   └── index.html              # Punto de entrada principal
├── src/
│   ├── css/
│   │   ├── base.css           # Estilos base y variables CSS
│   │   ├── components.css     # Componentes reutilizables
│   │   ├── layout.css         # Layout y navegación
│   │   └── dashboard.css      # Estilos específicos del dashboard
│   ├── js/
│   │   ├── modules/
│   │   │   ├── employees.js   # Gestión de empleados
│   │   │   ├── parking.js     # Gestión de parqueaderos
│   │   │   └── ui.js          # Utilidades de interfaz de usuario
│   │   ├── services/
│   │   │   ├── storage.js     # Servicio de almacenamiento
│   │   │   └── api.js         # Servicio de API (preparado para futuro)
│   │   ├── utils/
│   │   │   ├── constants.js   # Constantes de la aplicación
│   │   │   └── helpers.js     # Funciones utilitarias
│   │   └── app.js             # Aplicación principal
│   └── assets/
│       └── images/            # Recursos gráficos
├── scripts/
│   ├── validate.js            # Validación de código
│   └── backup.js              # Sistema de respaldos
├── package.json               # Configuración del proyecto
├── CLAUDE.md                  # Guía para Claude Code
└── README.md                  # Este archivo
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js >= 14.0.0
- npm >= 6.0.0
- Navegador web moderno

### Instalación Local

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/your-organization/proyecto-parqueadero-slud.git
   cd proyecto-parqueadero-slud
   ```

2. **Instala dependencias** (opcional para desarrollo):
   ```bash
   npm install
   ```

3. **Ejecuta el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

4. **Abre tu navegador** en `http://localhost:3000`

### Instalación Directa

Si solo necesitas ejecutar la aplicación sin herramientas de desarrollo:

1. Descarga los archivos del proyecto
2. Abre `public/index.html` directamente en tu navegador
3. ¡Listo! La aplicación funcionará completamente offline

## 🎮 Uso de la Aplicación

### Navegación
- **Dashboard**: Vista general y estadísticas en tiempo real
- **Empleados**: Gestión completa de empleados y vehículos  
- **Parqueaderos**: Administración de espacios de parqueo
- **Asignaciones**: Control de asignaciones manuales y automáticas
- **Disponibilidad**: Consulta de disponibilidad por fechas

### Atajos de Teclado
- `Alt + 1-5`: Navegación rápida entre pestañas
- `Ctrl + S`: Exportar datos como respaldo

### Flujo de Trabajo Recomendado

1. **Configuración Inicial**:
   - Generar parqueaderos automáticamente (botón "🏗️ Generar Automáticamente")
   - Registrar empleados con su información vehicular

2. **Asignación de Parqueaderos**:
   - Usar asignación automática para eficiencia
   - Asignación manual para casos especiales

3. **Monitoreo Diario**:
   - Revisar dashboard para estadísticas actuales
   - Consultar disponibilidad por fechas específicas

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo en puerto 3000
npm run serve        # Servidor básico

# Producción  
npm start           # Servidor de producción en puerto 8080

# Utilidades
npm run validate    # Validar integridad del código
npm run backup      # Crear respaldo de datos
```

## 📊 Características de los Datos

### Empleados
- Información personal (nombre, cédula, área)
- Datos del vehículo (placa, tipo)
- Restricciones de pico y placa
- Fecha de registro

### Parqueaderos  
- Numeración automática y personalizada
- Distribución por sótanos (-1 y -3)
- Tipos: Carros, Motos, Bicicletas
- Estados: Disponible, Ocupado, Mantenimiento

### Asignaciones
- Relación empleado-parqueadero
- Fechas de inicio y fin
- Control de estado activo/inactivo
- Validaciones de compatibilidad

## 🌐 Migración a la Nube

La aplicación está preparada para migrar fácilmente a un backend en la nube:

### Servicios Implementados
- **StorageService**: Abstracción de almacenamiento (localStorage + API)
- **APIService**: Cliente HTTP preparado para endpoints REST
- **Configuración**: Variables de entorno para desarrollo/producción

### Endpoints API Esperados
```
GET    /api/employees         # Obtener empleados
POST   /api/employees         # Crear empleado  
PUT    /api/employees/:id     # Actualizar empleado
DELETE /api/employees/:id     # Eliminar empleado

GET    /api/parking-spaces    # Obtener parqueaderos
POST   /api/parking-spaces    # Crear parqueadero
PUT    /api/parking-spaces/:id # Actualizar parqueadero
DELETE /api/parking-spaces/:id # Eliminar parqueadero

GET    /api/assignments       # Obtener asignaciones
POST   /api/assignments       # Crear asignación
PUT    /api/assignments/:id   # Actualizar asignación
DELETE /api/assignments/:id   # Eliminar asignación

GET    /api/analytics/dashboard      # Estadísticas del dashboard
GET    /api/analytics/availability   # Consulta de disponibilidad
```

## 🐛 Solución de Problemas

### Problemas Comunes

**La aplicación no carga**
- Verifica que estés usando un navegador moderno
- Asegúrate de que JavaScript esté habilitado
- Revisa la consola del navegador para errores

**Los datos no se guardan**
- Verifica que localStorage esté habilitado
- Comprueba el espacio disponible en el navegador
- Intenta refrescar la página

**Asignación automática no funciona**
- Asegúrate de tener empleados y parqueaderos registrados
- Verifica que los tipos de vehículo coincidan con los parqueaderos disponibles

### Logs y Depuración

La aplicación genera logs detallados en la consola del navegador:
```javascript
// Abrir consola del navegador (F12)
// Los logs aparecerán con emojis para facilitar identificación:
// 🅿️ - Inicio de aplicación
// ✅ - Operaciones exitosas  
// ❌ - Errores
// 📊 - Información de datos
// 🌐 - Conectividad de red
```

## 🤝 Contribución

### Guías de Desarrollo
1. Mantener la arquitectura modular
2. Seguir las convenciones de nomenclatura establecidas
3. Documentar funciones públicas con JSDoc
4. Probar en múltiples navegadores
5. Optimizar para dispositivos móviles

### Estructura de Commits
```
tipo(scope): descripción

Ejemplo:
feat(employees): add bulk import functionality
fix(dashboard): correct statistics calculation
docs(readme): update installation instructions
```

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para reportar problemas o solicitar nuevas características:
- **Issues**: [GitHub Issues](https://github.com/your-organization/proyecto-parqueadero-slud/issues)
- **Email**: dev@example.com

---

**Desarrollado con ❤️ para una gestión eficiente de parqueaderos**
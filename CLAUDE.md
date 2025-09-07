# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modular parking management system (Sistema de Gestión de Parqueaderos) for managing 300 parking spaces across basement levels -1 and -3. The system follows modern development practices with separated concerns, modular architecture, and cloud-ready infrastructure.

## Architecture

**Modular Architecture**: The application is built with a clean separation of concerns using ES6 modules, organized CSS, and semantic HTML structure. It's designed for maintainability and future scalability.

**Project Structure**:
```
public/index.html           # Main HTML file
src/
├── css/                   # Stylesheets
│   ├── base.css          # CSS variables, reset, typography
│   ├── components.css    # UI components (buttons, forms, tables)
│   ├── layout.css        # Layout and navigation
│   └── dashboard.css     # Dashboard-specific styles
├── js/
│   ├── app.js           # Main application coordinator
│   ├── modules/         # Feature modules
│   │   ├── employees.js # Employee management
│   │   ├── parking.js   # Parking space management
│   │   └── ui.js        # UI utilities and helpers
│   ├── services/        # Data and API services
│   │   ├── storage.js   # Storage abstraction layer
│   │   └── api.js       # API service (cloud-ready)
│   └── utils/           # Utilities and helpers
│       ├── constants.js # Application constants
│       └── helpers.js   # Helper functions
└── assets/              # Static assets
scripts/                 # Build and utility scripts
├── validate.js         # Code validation
└── backup.js          # Backup management
```

**Core Components**:
- **Employee Management**: Complete CRUD operations with validation
- **Parking Space Management**: 300 spaces across two basement levels
- **Assignment System**: Manual and automatic assignment with business rules
- **Dashboard**: Real-time statistics and availability tracking
- **Cloud-Ready**: Storage abstraction for easy API migration

## Development Workflow

**Commands**:
- `npm run dev` - Start development server (port 3000)
- `npm start` - Start production server (port 8080)
- `npm run validate` - Validate project structure and code
- `npm run backup` - Create system backup

**Testing**: 
- Development: `npm run dev` then open http://localhost:3000
- Direct: Open `public/index.html` in browser (works offline)

**Data Persistence**: 
- Local: Browser localStorage with structured format
- Cloud-Ready: API service layer with fallback to localStorage

## Key Modules and Classes

**Main Application (app.js)**:
- `ParkingApp` - Main application coordinator
- Handles inter-module communication and lifecycle

**Employee Management (modules/employees.js)**:
- `EmployeeManager` - Complete employee CRUD operations
- Methods: `addEmployee()`, `deleteEmployee()`, `filterEmployees()`
- Validation: Form validation, duplicate checking, plate format (ABC123)

**Parking Management (modules/parking.js)**:
- `ParkingManager` - Parking space management
- Methods: `addParkingSpace()`, `generateParkingSpaces()`, `getAvailableSpaces()`
- Auto-generation: Creates 300 spaces with predefined distribution

**Assignment Management (modules/assignments.js)**:
- `AssignmentManager` - Handles employee-parking space assignments
- Features: Manual/automatic assignment, pico y placa logic, availability calculation
- Integration: Works with employee and parking managers

**Storage Service (services/storage.js)**:
- `StorageService` - Data persistence abstraction
- Methods: `saveData()`, `loadData()`, `exportData()`, `importData()`
- Supports both localStorage and API backends with automatic fallback

**UI Utilities (modules/ui.js)**:
- Common UI functions: `showAlert()`, `createTable()`, `Modal` class
- Form validation and user interaction helpers

## Business Logic

**Parking Distribution**:
- Carros Sótano -1: 40% (120 spaces)
- Carros Sótano -3: 40% (120 spaces)  
- Motos Sótano -1: 15% (45 spaces)
- Bicicletas Sótano -1: 5% (15 spaces)

**Assignment Rules**:
- Vehicle type must match parking space type
- One employee = one parking space maximum
- Pico y placa restrictions affect daily availability
- Automatic assignment prioritizes compatibility

**Data Validation**:
- Employee: Name, cedula, plate format (ABC123), vehicle type
- Parking: Unique numbering, valid basement level, type matching
- Assignment: Valid employee-parking relationship, date ranges

## Cloud Migration Preparation

**API Endpoints** (Ready for implementation):
```
GET/POST/PUT/DELETE /api/employees/:id
GET/POST/PUT/DELETE /api/parking-spaces/:id  
GET/POST/PUT/DELETE /api/assignments/:id
GET /api/analytics/dashboard
GET /api/analytics/availability
POST /api/sync
```

**Environment Configuration**:
- Development: localStorage mode
- Production: API mode with localStorage fallback
- `APP_CONFIG.API_BASE_URL` for endpoint configuration

## Development Guidelines

**Adding New Features**:
1. Create module in appropriate directory (`modules/`, `services/`, `utils/`)
2. Export class or functions with clear API
3. Add to main app.js imports and initialization
4. Update constants.js for new configuration
5. Add corresponding CSS to appropriate stylesheet

**Code Standards**:
- ES6 modules with explicit imports/exports
- JSDoc comments for public methods
- Error handling with user-friendly messages
- Responsive design considerations
- Accessibility best practices

**Testing Approach**:
- Manual testing via development server (`npm run dev`)
- Use validation script to check structure (`npm run validate`)
- Test offline functionality (direct `public/index.html` opening)
- Verify responsive design on multiple devices

**Build and Validation**:
- No build process required (static files)
- Project structure validation via `scripts/validate.js`
- Automatic backup system via `scripts/backup.js`

## Important Data Structures

**Employee Object**:
```javascript
{
  id: number,
  nombre: string,
  cedula: string,
  area: string,
  telefono: string,
  placa: string,
  tipoVehiculo: 'carro'|'moto'|'bicicleta',
  picoPlaca: 'lunes'|'martes'|...|null,
  fechaRegistro: string
}
```

**Parking Space Object**:
```javascript
{
  id: number,
  numero: string,
  sotano: '-1'|'-3',
  tipo: 'carro'|'moto'|'bicicleta',
  estado: 'disponible'|'ocupado'|'mantenimiento',
  empleadoAsignado: number|null,
  fechaCreacion: string
}
```

**Assignment Object**:
```javascript
{
  id: number,
  empleadoId: number,
  parqueaderoId: number,
  fechaInicio: string,
  fechaFin: string|null,
  activa: boolean,
  fechaCreacion: string
}
```

## Module Communication

**Inter-module Events**: The application uses custom DOM events for module communication:
- `employeeAdded`, `employeeDeleted` - Employee management events
- `parkingSpaceAdded`, `parkingSpaceDeleted` - Parking management events
- `getEmployeeAssignment` - Assignment info requests

**Data Flow**:
1. User interactions trigger module methods
2. Modules emit custom events for cross-module updates
3. Main app coordinator (`ParkingApp`) listens and updates UI
4. All data persists through `StorageService`

## Common Development Tasks

**Adding a New Employee Field**:
1. Update data structure in `constants.js` (if validation needed)
2. Modify `EmployeeManager.addEmployee()` method
3. Update form validation in `ui.js`
4. Add field to employee form in HTML
5. Update CSS styling if needed

**Adding New Parking Space Type**:
1. Add type to `VEHICLE_TYPES` in `constants.js`
2. Update `PARKING_DISTRIBUTION` configuration
3. Modify `ParkingManager.generateParkingSpaces()`
4. Update assignment validation logic
5. Add UI selectors for the new type

**Debugging Common Issues**:
- Check browser console for errors (app uses emoji prefixes: 🅿️, ✅, ❌, 📊, 🌐)
- Use `npm run validate` to check project structure
- Verify localStorage data via browser DevTools
- Test with `npm run dev` instead of direct file opening for full functionality
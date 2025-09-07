/**
 * Application constants
 */

export const APP_CONFIG = {
    MAX_PARKING_SPACES: 300,
    STORAGE_KEY: 'parqueadero-slud-data',
    VERSION: '1.0.0',
    API_BASE_URL: '/api'
};

export const VEHICLE_TYPES = {
    CARRO: 'carro',
    MOTO: 'moto',
    BICICLETA: 'bicicleta'
};

export const PARKING_STATUS = {
    DISPONIBLE: 'disponible',
    OCUPADO: 'ocupado',
    MANTENIMIENTO: 'mantenimiento'
};

export const BASEMENT_LEVELS = {
    MINUS_ONE: '-1',
    MINUS_THREE: '-3'
};

export const DAYS_OF_WEEK = {
    DOMINGO: 'domingo',
    LUNES: 'lunes',
    MARTES: 'martes',
    MIÉRCOLES: 'miércoles',
    JUEVES: 'jueves',
    VIERNES: 'viernes',
    SÁBADO: 'sábado'
};

export const ALERT_TYPES = {
    SUCCESS: 'success',
    DANGER: 'danger',
    WARNING: 'warning',
    INFO: 'info'
};

export const FORM_VALIDATION = {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 50,
    MIN_CEDULA_LENGTH: 6,
    MAX_CEDULA_LENGTH: 15,
    PLATE_REGEX: /^[A-Z]{3}[0-9]{3}$/,
    PHONE_REGEX: /^[0-9]{10}$/
};

export const PARKING_DISTRIBUTION = {
    TOTAL_SPACES: 300,
    CARROS_S1: 120,        // 40% - Sótano -1
    CARROS_S3: 120,        // 40% - Sótano -3  
    MOTOS_S1: 45,          // 15% - Sótano -1
    BICICLETAS_S1: 15      // 5% - Sótano -1
};

export const UI_ELEMENTS = {
    TABS: {
        DASHBOARD: 'dashboard',
        EMPLEADOS: 'empleados',
        PARQUEADEROS: 'parqueaderos',
        ASIGNACIONES: 'asignaciones',
        DISPONIBILIDAD: 'disponibilidad'
    },
    FORMS: {
        EMPLEADO: 'empleadoForm',
        PARQUEADERO: 'parqueaderoForm',
        ASIGNACION: 'asignacionForm'
    }
};

export const ERROR_MESSAGES = {
    REQUIRED_FIELDS: 'Por favor complete todos los campos requeridos',
    DUPLICATE_CEDULA: 'Ya existe un empleado con esta cédula',
    DUPLICATE_PLATE: 'Ya existe un empleado con esta placa',
    DUPLICATE_PARKING: 'Ya existe un parqueadero con este número',
    VEHICLE_TYPE_MISMATCH: 'El tipo de vehículo del empleado no coincide con el tipo de parqueadero',
    EMPLOYEE_ALREADY_ASSIGNED: 'El empleado ya tiene un parqueadero asignado',
    PARKING_ALREADY_ASSIGNED: 'El parqueadero ya está asignado a otro empleado',
    INVALID_PLATE_FORMAT: 'El formato de la placa debe ser ABC123',
    INVALID_PHONE_FORMAT: 'El teléfono debe tener 10 dígitos'
};

export const SUCCESS_MESSAGES = {
    EMPLOYEE_ADDED: 'Empleado agregado exitosamente',
    EMPLOYEE_DELETED: 'Empleado eliminado exitosamente',
    PARKING_ADDED: 'Parqueadero agregado exitosamente',
    PARKING_DELETED: 'Parqueadero eliminado exitosamente',
    PARKING_ASSIGNED: 'Parqueadero asignado exitosamente',
    ASSIGNMENT_ENDED: 'Asignación terminada exitosamente',
    BULK_PARKING_GENERATED: '300 parqueaderos generados automáticamente',
    AUTO_ASSIGNMENTS_COMPLETED: 'Asignaciones automáticas completadas',
    PICO_PLACA_REASSIGNED: 'Parqueadero reasignado por pico y placa'
};

export const PICO_PLACA_CONFIG = {
    LUNES: { lastDigits: [1, 2], day: 'lunes' },
    MARTES: { lastDigits: [3, 4], day: 'martes' },
    MIERCOLES: { lastDigits: [5, 6], day: 'miércoles' },
    JUEVES: { lastDigits: [7, 8], day: 'jueves' },
    VIERNES: { lastDigits: [9, 0], day: 'viernes' }
};
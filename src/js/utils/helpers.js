/**
 * Utility helper functions
 */

import { DAYS_OF_WEEK, FORM_VALIDATION } from './constants.js';

/**
 * Generate unique ID based on timestamp and random number
 * @returns {number} Unique ID
 */
export function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get day of the week from date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Day of the week in Spanish
 */
export function getDayOfWeek(dateString) {
    const days = Object.values(DAYS_OF_WEEK);
    const dateObj = new Date(dateString + 'T00:00:00');
    return days[dateObj.getDay()];
}

/**
 * Calculate pico y placa day based on plate number
 * @param {string} placa - Vehicle plate (e.g., "ABC123")
 * @returns {string} Day of pico y placa restriction
 */
export function calculatePicoPlacaDay(placa) {
    if (!placa || placa.length < 3) return null;
    
    const lastDigit = parseInt(placa.slice(-1));
    
    if (lastDigit === 1 || lastDigit === 2) return 'lunes';
    if (lastDigit === 3 || lastDigit === 4) return 'martes';
    if (lastDigit === 5 || lastDigit === 6) return 'miércoles';
    if (lastDigit === 7 || lastDigit === 8) return 'jueves';
    if (lastDigit === 9 || lastDigit === 0) return 'viernes';
    
    return null;
}

/**
 * Check if today is pico y placa day for a given plate
 * @param {string} placa - Vehicle plate
 * @returns {boolean} True if today is pico y placa day
 */
export function isTodayPicoPlaca(placa) {
    const today = getDayOfWeek(getCurrentDate());
    const picoPlacaDay = calculatePicoPlacaDay(placa);
    return today === picoPlacaDay;
}

/**
 * Get available parking spaces for a given date considering pico y placa
 * @param {Array} parkingSpaces - All parking spaces
 * @param {Array} employees - All employees
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @returns {Object} Available spaces and pico y placa affected spaces
 */
export function calculateDailyAvailability(parkingSpaces, employees, date) {
    const dayOfWeek = getDayOfWeek(date);
    const availableSpaces = [];
    const picoPlacaSpaces = [];
    const occupiedSpaces = [];
    
    parkingSpaces.forEach(space => {
        if (space.estado === 'mantenimiento') return;
        
        if (!space.empleadoAsignado) {
            availableSpaces.push({...space, motivo: 'Sin asignación'});
            return;
        }
        
        const employee = employees.find(emp => emp.id === space.empleadoAsignado);
        if (!employee) {
            availableSpaces.push({...space, motivo: 'Empleado no encontrado'});
            return;
        }
        
        const employeePicoPlacaDay = calculatePicoPlacaDay(employee.placa);
        
        if (dayOfWeek === employeePicoPlacaDay) {
            picoPlacaSpaces.push({
                ...space,
                empleado: employee,
                motivo: `Pico y placa - ${dayOfWeek}`
            });
        } else {
            occupiedSpaces.push({
                ...space,
                empleado: employee,
                motivo: 'Ocupado normalmente'
            });
        }
    });
    
    return {
        available: availableSpaces,
        picoPlaca: picoPlacaSpaces,
        occupied: occupiedSpaces,
        summary: {
            totalAvailable: availableSpaces.length + picoPlacaSpaces.length,
            normallyAvailable: availableSpaces.length,
            picoPlacaAvailable: picoPlacaSpaces.length,
            occupied: occupiedSpaces.length
        }
    };
}

/**
 * Format date to display format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Validate employee form data
 * @param {Object} employeeData - Employee data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateEmployeeData(employeeData) {
    const errors = [];
    const { nombre, cedula, placa, tipoVehiculo, telefono } = employeeData;

    // Required fields validation
    if (!nombre?.trim()) errors.push('El nombre es requerido');
    if (!cedula?.trim()) errors.push('La cédula es requerida');
    if (!placa?.trim()) errors.push('La placa es requerida');
    if (!tipoVehiculo) errors.push('El tipo de vehículo es requerido');

    // Length validations
    if (nombre && (nombre.trim().length < FORM_VALIDATION.MIN_NAME_LENGTH || 
                   nombre.trim().length > FORM_VALIDATION.MAX_NAME_LENGTH)) {
        errors.push(`El nombre debe tener entre ${FORM_VALIDATION.MIN_NAME_LENGTH} y ${FORM_VALIDATION.MAX_NAME_LENGTH} caracteres`);
    }

    if (cedula && (cedula.trim().length < FORM_VALIDATION.MIN_CEDULA_LENGTH || 
                   cedula.trim().length > FORM_VALIDATION.MAX_CEDULA_LENGTH)) {
        errors.push(`La cédula debe tener entre ${FORM_VALIDATION.MIN_CEDULA_LENGTH} y ${FORM_VALIDATION.MAX_CEDULA_LENGTH} caracteres`);
    }

    // Plate format validation
    if (placa && !FORM_VALIDATION.PLATE_REGEX.test(placa.toUpperCase())) {
        errors.push('El formato de la placa debe ser ABC123');
    }

    // Phone format validation (optional field)
    if (telefono && !FORM_VALIDATION.PHONE_REGEX.test(telefono)) {
        errors.push('El teléfono debe tener 10 dígitos');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate parking form data
 * @param {Object} parkingData - Parking data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateParkingData(parkingData) {
    const errors = [];
    const { numero, sotano, tipo } = parkingData;

    if (!numero?.trim()) errors.push('El número de parqueadero es requerido');
    if (!sotano) errors.push('El sótano es requerido');
    if (!tipo) errors.push('El tipo de parqueadero es requerido');

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize string input
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Format parking number with consistent padding
 * @param {string} sotano - Basement level
 * @param {string} tipo - Vehicle type
 * @param {number} numero - Sequential number
 * @returns {string} Formatted parking number
 */
export function formatParkingNumber(sotano, tipo, numero) {
    const prefix = `S${Math.abs(parseInt(sotano))}`;
    const typeCode = {
        'carro': 'C',
        'moto': 'M',
        'bicicleta': 'B'
    };
    return `${prefix}-${typeCode[tipo]}${String(numero).padStart(3, '0')}`;
}

/**
 * Calculate statistics from arrays
 * @param {Array} array - Array to calculate from
 * @param {Function} predicate - Filter function
 * @returns {number} Count of matching items
 */
export function calculateCount(array, predicate) {
    if (!Array.isArray(array)) return 0;
    return predicate ? array.filter(predicate).length : array.length;
}

/**
 * Group array items by property
 * @param {Array} array - Array to group
 * @param {string} property - Property to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, property) {
    if (!Array.isArray(array)) return {};
    return array.reduce((groups, item) => {
        const key = item[property];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Sort array of objects by property
 * @param {Array} array - Array to sort
 * @param {string} property - Property to sort by
 * @param {boolean} ascending - Sort order
 * @returns {Array} Sorted array
 */
export function sortBy(array, property, ascending = true) {
    if (!Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
        const valueA = a[property];
        const valueB = b[property];
        
        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if empty
 */
export function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    return Object.keys(obj).length === 0;
}
/**
 * Parking space management module
 */

import { 
    generateId, 
    getCurrentDate, 
    validateParkingData, 
    sanitizeString, 
    debounce,
    sortBy,
    formatParkingNumber
} from '../utils/helpers.js';
import { 
    ERROR_MESSAGES, 
    SUCCESS_MESSAGES, 
    ALERT_TYPES,
    UI_ELEMENTS,
    PARKING_DISTRIBUTION,
    VEHICLE_TYPES,
    BASEMENT_LEVELS,
    PARKING_STATUS,
    APP_CONFIG
} from '../utils/constants.js';
import storageService from '../services/storage.js';
import { showAlert, showConfirmDialog } from './ui.js';

class ParkingManager {
    constructor() {
        this.parkingSpaces = [];
        this.filteredSpaces = [];
        this.currentFilters = {
            search: '',
            basement: '',
            type: '',
            status: ''
        };
        this.init();
    }

    /**
     * Initialize parking manager
     */
    init() {
        this.bindEvents();
        this.setupFilters();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        const form = document.getElementById(UI_ELEMENTS.FORMS.PARQUEADERO);
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Generate parking spaces button
        const generateBtn = document.getElementById('generarParqueaderos');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleBulkGenerate());
        }

        // Search input
        const searchInput = document.getElementById('buscarParqueadero');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Filter dropdowns
        const filters = [
            { id: 'filtroSotano', key: 'basement' },
            { id: 'filtroTipoParqueadero', key: 'type' },
            { id: 'filtroEstado', key: 'status' }
        ];

        filters.forEach(filter => {
            const element = document.getElementById(filter.id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.currentFilters[filter.key] = e.target.value;
                    this.applyFilters();
                });
            }
        });
    }

    /**
     * Setup filter system
     */
    setupFilters() {
        this.applyFilters = debounce(() => {
            this.filterParkingSpaces();
            this.renderParkingSpaces();
        }, 100);
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = this.getFormData();
        const validation = validateParkingData(formData);
        
        if (!validation.isValid) {
            showAlert(validation.errors.join('<br>'), ALERT_TYPES.DANGER);
            return;
        }

        // Check for duplicates
        if (this.isDuplicateNumber(formData.numero)) {
            showAlert(ERROR_MESSAGES.DUPLICATE_PARKING, ALERT_TYPES.DANGER);
            return;
        }

        try {
            await this.addParkingSpace(formData);
            this.clearForm();
            showAlert(SUCCESS_MESSAGES.PARKING_ADDED, ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error adding parking space:', error);
            showAlert('Error al agregar parqueadero', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Handle bulk parking generation
     */
    async handleBulkGenerate() {
        const currentCount = this.parkingSpaces.length;
        const maxSpaces = APP_CONFIG.MAX_PARKING_SPACES;
        
        if (currentCount >= maxSpaces) {
            showAlert(`Ya existen ${maxSpaces} parqueaderos. No se pueden generar más.`, ALERT_TYPES.WARNING);
            return;
        }

        const remainingSpaces = maxSpaces - currentCount;
        const confirmed = showConfirmDialog(
            `Se generarán ${remainingSpaces} parqueaderos automáticamente. ¿Desea continuar?`,
            'Generar Parqueaderos'
        );

        if (!confirmed) return;

        try {
            await this.generateParkingSpaces(remainingSpaces);
            showAlert(`${SUCCESS_MESSAGES.BULK_PARKING_GENERATED}: ${remainingSpaces} parqueaderos`, ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error generating parking spaces:', error);
            showAlert('Error al generar parqueaderos', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        return {
            numero: sanitizeString(document.getElementById('numeroParqueadero')?.value),
            sotano: document.getElementById('sotanoParqueadero')?.value,
            tipo: document.getElementById('tipoParqueadero')?.value,
            estado: document.getElementById('estadoParqueadero')?.value || PARKING_STATUS.DISPONIBLE
        };
    }

    /**
     * Add new parking space
     * @param {Object} parkingData - Parking data
     */
    async addParkingSpace(parkingData) {
        const parkingSpace = {
            id: generateId(),
            ...parkingData,
            empleadoAsignado: null,
            fechaCreacion: getCurrentDate()
        };

        this.parkingSpaces.push(parkingSpace);
        await this.saveData();
        this.applyFilters();
        
        // Dispatch custom event for other modules
        window.dispatchEvent(new CustomEvent('parkingSpaceAdded', { detail: parkingSpace }));
    }

    /**
     * Generate parking spaces automatically
     * @param {number} totalSpaces - Number of spaces to generate
     */
    async generateParkingSpaces(totalSpaces) {
        const distribution = this.calculateDistribution(totalSpaces);
        const newSpaces = [];

        // Generate parking spaces by type and basement
        const spaceTypes = [
            { type: VEHICLE_TYPES.CARRO, basement: BASEMENT_LEVELS.MINUS_ONE, count: distribution.carrosS1, prefix: 'C' },
            { type: VEHICLE_TYPES.CARRO, basement: BASEMENT_LEVELS.MINUS_THREE, count: distribution.carrosS3, prefix: 'C' },
            { type: VEHICLE_TYPES.MOTO, basement: BASEMENT_LEVELS.MINUS_ONE, count: distribution.motos, prefix: 'M' },
            { type: VEHICLE_TYPES.BICICLETA, basement: BASEMENT_LEVELS.MINUS_ONE, count: distribution.bicicletas, prefix: 'B' }
        ];

        let idCounter = 0;
        spaceTypes.forEach(({ type, basement, count, prefix }) => {
            for (let i = 1; i <= count; i++) {
                const numero = formatParkingNumber(basement, type, this.getNextSequentialNumber(type, basement));
                
                newSpaces.push({
                    id: generateId() + idCounter++,
                    numero,
                    sotano: basement,
                    tipo: type,
                    estado: PARKING_STATUS.DISPONIBLE,
                    empleadoAsignado: null,
                    fechaCreacion: getCurrentDate()
                });
            }
        });

        this.parkingSpaces.push(...newSpaces);
        await this.saveData();
        this.applyFilters();
        
        // Notify other modules
        window.dispatchEvent(new CustomEvent('bulkParkingGenerated', { detail: { count: newSpaces.length } }));
    }

    /**
     * Calculate parking distribution for your specific requirements
     * @param {number} totalSpaces - Total spaces to distribute (default: 300)
     * @returns {Object} Distribution counts
     */
    calculateDistribution(totalSpaces = 300) {
        // Your specific distribution: 300 total spaces
        // Carros Sótano -1: 120 (40%)
        // Carros Sótano -3: 120 (40%) 
        // Motos Sótano -1: 45 (15%)
        // Bicicletas Sótano -1: 15 (5%)
        
        const carrosS1 = PARKING_DISTRIBUTION.CARROS_S1;
        const carrosS3 = PARKING_DISTRIBUTION.CARROS_S3;
        const motos = PARKING_DISTRIBUTION.MOTOS_S1;
        const bicicletas = PARKING_DISTRIBUTION.BICICLETAS_S1;

        return { carrosS1, carrosS3, motos, bicicletas };
    }

    /**
     * Get next sequential number for parking type and basement
     * @param {string} type - Vehicle type
     * @param {string} basement - Basement level
     * @returns {number} Next sequential number
     */
    getNextSequentialNumber(type, basement) {
        const existingSpaces = this.parkingSpaces.filter(space => 
            space.tipo === type && space.sotano === basement
        );
        
        return existingSpaces.length + 1;
    }

    /**
     * Delete parking space
     * @param {number} id - Parking space ID
     */
    async deleteParkingSpace(id) {
        const space = this.parkingSpaces.find(space => space.id === id);
        if (!space) return;

        const confirmed = showConfirmDialog(
            `¿Estás seguro de eliminar el parqueadero ${space.numero}?`,
            'Eliminar Parqueadero'
        );
        if (!confirmed) return;

        try {
            this.parkingSpaces = this.parkingSpaces.filter(space => space.id !== id);
            await this.saveData();
            this.applyFilters();
            
            // Notify other modules
            window.dispatchEvent(new CustomEvent('parkingSpaceDeleted', { detail: { id } }));
            showAlert(SUCCESS_MESSAGES.PARKING_DELETED, ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error deleting parking space:', error);
            showAlert('Error al eliminar parqueadero', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Update parking space
     * @param {number} id - Parking space ID
     * @param {Object} updateData - Data to update
     */
    async updateParkingSpace(id, updateData) {
        const spaceIndex = this.parkingSpaces.findIndex(space => space.id === id);
        if (spaceIndex === -1) return;

        this.parkingSpaces[spaceIndex] = { ...this.parkingSpaces[spaceIndex], ...updateData };
        await this.saveData();
        this.applyFilters();
        
        window.dispatchEvent(new CustomEvent('parkingSpaceUpdated', { 
            detail: { id, data: this.parkingSpaces[spaceIndex] } 
        }));
    }

    /**
     * Check for duplicate number
     * @param {string} numero - Number to check
     * @returns {boolean} Is duplicate
     */
    isDuplicateNumber(numero) {
        return this.parkingSpaces.some(space => space.numero === numero);
    }

    /**
     * Filter parking spaces based on current filters
     */
    filterParkingSpaces() {
        const { search, basement, type, status } = this.currentFilters;
        
        this.filteredSpaces = this.parkingSpaces.filter(space => {
            const matchesSearch = !search || 
                space.numero.toLowerCase().includes(search.toLowerCase());
            
            const matchesBasement = !basement || space.sotano === basement;
            const matchesType = !type || space.tipo === type;
            const matchesStatus = !status || space.estado === status;
            
            return matchesSearch && matchesBasement && matchesType && matchesStatus;
        });

        // Sort by numero
        this.filteredSpaces = sortBy(this.filteredSpaces, 'numero');
    }

    /**
     * Render parking spaces table
     */
    renderParkingSpaces() {
        const tbody = document.getElementById('tablaParqueaderos');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredSpaces.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                        ${this.parkingSpaces.length === 0 ? 'No hay parqueaderos registrados' : 'No se encontraron parqueaderos con los filtros aplicados'}
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredSpaces.forEach(space => {
            const row = document.createElement('tr');
            row.innerHTML = this.getParkingSpaceRowHTML(space);
            tbody.appendChild(row);
        });
    }

    /**
     * Get HTML for parking space table row
     * @param {Object} space - Parking space data
     * @returns {string} HTML string
     */
    getParkingSpaceRowHTML(space) {
        const employeeName = this.getAssignedEmployeeName(space.empleadoAsignado);
        
        return `
            <td>${space.numero}</td>
            <td>Sótano ${space.sotano}</td>
            <td>${space.tipo}</td>
            <td><span class="status-${space.estado}">${space.estado}</span></td>
            <td>${employeeName}</td>
            <td>
                <button class="btn btn-danger" onclick="parkingManager.deleteParkingSpace(${space.id})" 
                        title="Eliminar parqueadero">
                    🗑️
                </button>
            </td>
        `;
    }

    /**
     * Get assigned employee name
     * @param {number} employeeId - Employee ID
     * @returns {string} Employee name or 'No asignado'
     */
    getAssignedEmployeeName(employeeId) {
        if (!employeeId) return 'No asignado';
        
        // Get employee info from employee manager
        const employeeEvent = new CustomEvent('getEmployee', { 
            detail: { employeeId } 
        });
        window.dispatchEvent(employeeEvent);
        
        return 'Cargando...'; // Will be updated by employee module
    }

    /**
     * Clear form
     */
    clearForm() {
        const form = document.getElementById(UI_ELEMENTS.FORMS.PARQUEADERO);
        if (form) {
            form.reset();
            // Set default status
            const statusSelect = document.getElementById('estadoParqueadero');
            if (statusSelect) statusSelect.value = PARKING_STATUS.DISPONIBLE;
            
            // Focus on first input
            const firstInput = form.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }

    /**
     * Load parking spaces data
     * @param {Array} parkingSpaces - Parking spaces array
     */
    loadParkingSpaces(parkingSpaces) {
        this.parkingSpaces = parkingSpaces || [];
        this.applyFilters();
    }

    /**
     * Get all parking spaces
     * @returns {Array} Parking spaces array
     */
    getParkingSpaces() {
        return this.parkingSpaces;
    }

    /**
     * Get parking space by ID
     * @param {number} id - Parking space ID
     * @returns {Object|null} Parking space or null
     */
    getParkingSpaceById(id) {
        return this.parkingSpaces.find(space => space.id === id) || null;
    }

    /**
     * Get available parking spaces
     * @param {string} vehicleType - Filter by vehicle type
     * @returns {Array} Available spaces
     */
    getAvailableSpaces(vehicleType = null) {
        return this.parkingSpaces.filter(space => {
            const isAvailable = space.estado === PARKING_STATUS.DISPONIBLE;
            const matchesType = !vehicleType || space.tipo === vehicleType;
            return isAvailable && matchesType;
        });
    }

    /**
     * Get occupied parking spaces
     * @returns {Array} Occupied spaces
     */
    getOccupiedSpaces() {
        return this.parkingSpaces.filter(space => space.estado === PARKING_STATUS.OCUPADO);
    }

    /**
     * Save data to storage
     */
    async saveData() {
        try {
            const data = await storageService.loadData();
            data.parqueaderos = this.parkingSpaces;
            await storageService.saveData(data);
        } catch (error) {
            console.error('Error saving parking data:', error);
            throw error;
        }
    }

    /**
     * Get statistics
     * @returns {Object} Parking statistics
     */
    getStatistics() {
        const total = this.parkingSpaces.length;
        const available = this.getAvailableSpaces().length;
        const occupied = this.getOccupiedSpaces().length;
        const maintenance = this.parkingSpaces.filter(space => 
            space.estado === PARKING_STATUS.MANTENIMIENTO
        ).length;

        const byType = this.parkingSpaces.reduce((acc, space) => {
            acc[space.tipo] = (acc[space.tipo] || 0) + 1;
            return acc;
        }, {});

        const byBasement = this.parkingSpaces.reduce((acc, space) => {
            acc[`basement_${space.sotano}`] = (acc[`basement_${space.sotano}`] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            available,
            occupied,
            maintenance,
            byType,
            byBasement,
            occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
        };
    }

    /**
     * Export to CSV
     * @returns {string} CSV data
     */
    exportToCSV() {
        if (this.parkingSpaces.length === 0) return '';

        const headers = ['Número', 'Sótano', 'Tipo', 'Estado', 'Empleado Asignado', 'Fecha Creación'];
        const csvData = [headers];

        this.parkingSpaces.forEach(space => {
            const employeeName = this.getAssignedEmployeeName(space.empleadoAsignado);
            
            csvData.push([
                space.numero,
                `Sótano ${space.sotano}`,
                space.tipo,
                space.estado,
                employeeName,
                space.fechaCreacion
            ]);
        });

        return csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
}

// Create global instance
const parkingManager = new ParkingManager();
window.parkingManager = parkingManager; // Make it globally accessible

export default parkingManager;
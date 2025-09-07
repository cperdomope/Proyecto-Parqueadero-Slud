/**
 * Employee management module
 */

import { 
    generateId, 
    getCurrentDate, 
    getDayOfWeek,
    validateEmployeeData, 
    sanitizeString, 
    debounce,
    sortBy,
    calculatePicoPlacaDay 
} from '../utils/helpers.js';
import { 
    ERROR_MESSAGES, 
    SUCCESS_MESSAGES, 
    ALERT_TYPES,
    UI_ELEMENTS 
} from '../utils/constants.js';
import storageService from '../services/storage.js';
import { showAlert } from './ui.js';

class EmployeeManager {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.currentFilters = {
            search: '',
            vehicleType: ''
        };
        this.init();
    }

    /**
     * Initialize employee manager
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
        const form = document.getElementById(UI_ELEMENTS.FORMS.EMPLEADO);
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Search input
        const searchInput = document.getElementById('buscarEmpleado');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Vehicle type filter
        const vehicleFilter = document.getElementById('filtroTipoVehiculo');
        if (vehicleFilter) {
            vehicleFilter.addEventListener('change', (e) => {
                this.currentFilters.vehicleType = e.target.value;
                this.applyFilters();
            });
        }

        // Area filter
        const areaFilter = document.getElementById('filtroAreaEmpleado');
        if (areaFilter) {
            areaFilter.addEventListener('change', (e) => {
                this.currentFilters.area = e.target.value;
                this.applyFilters();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('filtroEstadoEmpleado');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }
    }

    /**
     * Setup filter system
     */
    setupFilters() {
        this.applyFilters = debounce(() => {
            this.filterEmployees();
            this.renderEmployees();
        }, 100);
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = this.getFormData();
        const validation = validateEmployeeData(formData);
        
        if (!validation.isValid) {
            showAlert(validation.errors.join('<br>'), ALERT_TYPES.DANGER);
            return;
        }

        // Check for duplicates
        if (this.isDuplicateCedula(formData.cedula)) {
            showAlert(ERROR_MESSAGES.DUPLICATE_CEDULA, ALERT_TYPES.DANGER);
            return;
        }

        if (this.isDuplicatePlate(formData.placa)) {
            showAlert(ERROR_MESSAGES.DUPLICATE_PLATE, ALERT_TYPES.DANGER);
            return;
        }

        try {
            await this.addEmployee(formData);
            this.clearForm();
            showAlert(SUCCESS_MESSAGES.EMPLOYEE_ADDED, ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error adding employee:', error);
            showAlert('Error al agregar empleado', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        return {
            // Información personal
            nombre: sanitizeString(document.getElementById('nombreEmpleado')?.value),
            cedula: sanitizeString(document.getElementById('cedulaEmpleado')?.value),
            email: sanitizeString(document.getElementById('emailEmpleado')?.value),
            telefono: sanitizeString(document.getElementById('telefonoEmpleado')?.value),
            telefonoFijo: sanitizeString(document.getElementById('telefonoFijo')?.value),
            fechaNacimiento: document.getElementById('fechaNacimiento')?.value,
            
            // Información laboral
            area: document.getElementById('areaEmpleado')?.value,
            cargo: sanitizeString(document.getElementById('cargoEmpleado')?.value),
            codigoEmpleado: sanitizeString(document.getElementById('codigoEmpleado')?.value),
            fechaIngreso: document.getElementById('fechaIngreso')?.value,
            jefeInmediato: sanitizeString(document.getElementById('jefeInmediato')?.value),
            horarioTrabajo: document.getElementById('horarioTrabajo')?.value,
            
            // Información del vehículo
            placa: sanitizeString(document.getElementById('placaVehiculo')?.value).toUpperCase(),
            tipoVehiculo: document.getElementById('tipoVehiculo')?.value,
            marcaVehiculo: sanitizeString(document.getElementById('marcaVehiculo')?.value),
            modeloVehiculo: sanitizeString(document.getElementById('modeloVehiculo')?.value),
            colorVehiculo: document.getElementById('colorVehiculo')?.value,
            anoVehiculo: document.getElementById('anoVehiculo')?.value,
            
            // Pico y placa
            picoPlaca: document.getElementById('picoPlacaEmpleado')?.value,
            exencionPicoPlaca: document.getElementById('exencionPicoPlaca')?.value,
            
            // Información adicional
            contactoEmergencia: sanitizeString(document.getElementById('contactoEmergencia')?.value),
            direccionResidencia: sanitizeString(document.getElementById('direccionResidencia')?.value),
            tipoContrato: document.getElementById('tipoContrato')?.value,
            estadoEmpleado: document.getElementById('estadoEmpleado')?.value || 'activo',
            estadoHoy: document.getElementById('estadoHoyEmpleado')?.value || 'presente',
            observaciones: sanitizeString(document.getElementById('observacionesEmpleado')?.value)
        };
    }

    /**
     * Add new employee
     * @param {Object} employeeData - Employee data
     */
    async addEmployee(employeeData) {
        // Auto-calculate pico y placa day based on plate number
        const autoPicoPlaca = calculatePicoPlacaDay(employeeData.placa);
        
        const employee = {
            id: generateId(),
            ...employeeData,
            picoPlaca: employeeData.picoPlaca || autoPicoPlaca, // Use manual selection or auto-calculated
            fechaRegistro: getCurrentDate()
        };

        this.employees.push(employee);
        await this.saveData();
        this.applyFilters();
        
        // Dispatch custom event for other modules
        window.dispatchEvent(new CustomEvent('employeeAdded', { detail: employee }));
    }

    /**
     * Delete employee with confirmation modal
     * @param {number} id - Employee ID
     */
    async deleteEmployee(id) {
        const employee = this.employees.find(emp => emp.id === id);
        if (!employee) return;

        const modalContent = `
            <div style="max-width: 500px; padding: 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🗑️</div>
                <h3 style="color: #dc3545; margin-bottom: 20px;">Confirmar Eliminación</h3>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>⚠️ Esta acción no se puede deshacer</strong>
                    </p>
                </div>
                
                <p style="font-size: 16px; margin-bottom: 10px;">
                    ¿Está seguro de que desea eliminar al empleado:
                </p>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <div style="font-weight: bold; font-size: 18px; color: #007bff;">${employee.nombre}</div>
                    <div style="color: #666; margin-top: 5px;">
                        <strong>Cédula:</strong> ${employee.cedula}<br>
                        <strong>Placa:</strong> ${employee.placa}<br>
                        <strong>Área:</strong> ${employee.area || 'N/A'}
                    </div>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
                    También se eliminarán todas las asignaciones de parqueadero relacionadas con este empleado.
                </p>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="employeeManager.confirmDeleteEmployee(${id})" 
                            style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        🗑️ Sí, Eliminar
                    </button>
                    <button onclick="this.closest('.modal').remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer;">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    /**
     * Confirm and execute employee deletion
     * @param {number} id - Employee ID
     */
    async confirmDeleteEmployee(id) {
        try {
            // Close the modal first
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();

            const employee = this.employees.find(emp => emp.id === id);
            if (!employee) return;

            this.employees = this.employees.filter(emp => emp.id !== id);
            await this.saveData();
            this.applyFilters();
            
            // Notify other modules
            window.dispatchEvent(new CustomEvent('employeeDeleted', { detail: { id } }));
            showAlert(`Empleado ${employee.nombre} eliminado exitosamente`, ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error deleting employee:', error);
            showAlert('Error al eliminar empleado', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Update employee
     * @param {number} id - Employee ID
     * @param {Object} updateData - Data to update
     */
    async updateEmployee(id, updateData) {
        const employeeIndex = this.employees.findIndex(emp => emp.id === id);
        if (employeeIndex === -1) return;

        this.employees[employeeIndex] = { ...this.employees[employeeIndex], ...updateData };
        await this.saveData();
        this.applyFilters();
        
        window.dispatchEvent(new CustomEvent('employeeUpdated', { 
            detail: { id, data: this.employees[employeeIndex] } 
        }));
    }

    /**
     * Check for duplicate cedula
     * @param {string} cedula - Cedula to check
     * @returns {boolean} Is duplicate
     */
    isDuplicateCedula(cedula) {
        return this.employees.some(emp => emp.cedula === cedula);
    }

    /**
     * Check for duplicate plate
     * @param {string} placa - Plate to check
     * @returns {boolean} Is duplicate
     */
    isDuplicatePlate(placa) {
        return this.employees.some(emp => emp.placa === placa.toUpperCase());
    }

    /**
     * Filter employees based on current filters
     */
    filterEmployees() {
        const { search, vehicleType, area, status } = this.currentFilters;
        
        this.filteredEmployees = this.employees.filter(employee => {
            const matchesSearch = !search || 
                employee.nombre.toLowerCase().includes(search.toLowerCase()) ||
                employee.cedula.includes(search) ||
                employee.placa.toLowerCase().includes(search.toLowerCase()) ||
                (employee.area && employee.area.toLowerCase().includes(search.toLowerCase())) ||
                (employee.cargo && employee.cargo.toLowerCase().includes(search.toLowerCase())) ||
                (employee.email && employee.email.toLowerCase().includes(search.toLowerCase()));
            
            const matchesVehicleType = !vehicleType || employee.tipoVehiculo === vehicleType;
            const matchesArea = !area || employee.area === area;
            const matchesStatus = !status || (employee.estadoEmpleado || 'activo') === status;
            
            return matchesSearch && matchesVehicleType && matchesArea && matchesStatus;
        });

        // Sort by name
        this.filteredEmployees = sortBy(this.filteredEmployees, 'nombre');
    }

    /**
     * Render employees table
     */
    renderEmployees() {
        const tbody = document.getElementById('tablaEmpleados');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredEmployees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                        ${this.employees.length === 0 ? 'No hay empleados registrados' : 'No se encontraron empleados con los filtros aplicados'}
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredEmployees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = this.getEmployeeRowHTML(employee);
            tbody.appendChild(row);
        });

        // Update statistics after rendering
        this.updateStatisticsDisplay();
    }

    /**
     * Get HTML for employee table row
     * @param {Object} employee - Employee data
     * @returns {string} HTML string
     */
    getEmployeeRowHTML(employee) {
        // Get assigned parking info
        const assignmentInfo = this.getEmployeeAssignmentInfo(employee.id);
        
        // Calculate pico y placa automatically if not set
        const picoPlacaDisplay = employee.picoPlaca || calculatePicoPlacaDay(employee.placa) || 'Sin restricción';
        
        // Format estado with icon
        const estadoIcons = {
            'activo': '✅',
            'vacaciones': '🏖️',
            'incapacidad': '🏥',
            'licencia': '📋',
            'suspendido': '⚠️',
            'inactivo': '❌'
        };
        const estadoIcon = estadoIcons[employee.estadoEmpleado] || '✅';
        const estadoText = `${estadoIcon} ${(employee.estadoEmpleado || 'activo')}`;
        
        // Estado actual/hoy
        const estadoHoyIcons = {
            'presente': '✅',
            'ausente': '❌', 
            'vacaciones': '🏖️',
            'incapacidad': '🏥',
            'licencia': '📋',
            'tarde': '⏰',
            'remoto': '🏠'
        };
        const estadoHoy = employee.estadoHoy || 'presente';
        const estadoHoyText = `${estadoHoyIcons[estadoHoy] || '✅'} ${estadoHoy}`;
        
        // Format dates
        const fechaIngreso = employee.fechaIngreso ? 
            new Date(employee.fechaIngreso).toLocaleDateString('es-CO') : 'N/A';
        
        // Exención pico y placa
        const exencionIcons = {
            'no': '❌',
            'discapacidad': '♿',
            'medico': '🏥',
            'emergencia': '🚨',
            'diplomatico': '🏛️',
            'otro': '⚠️'
        };
        const exencion = employee.exencionPicoPlaca || 'no';
        const exencionText = exencionIcons[exencion] || '❌';
        
        return `
            <td style="font-weight: 500;">${employee.nombre}</td>
            <td>${employee.cedula}</td>
            <td>${employee.area || 'N/A'}</td>
            <td>${employee.cargo || 'N/A'}</td>
            <td style="font-weight: bold; color: #28a745;">${employee.codigoEmpleado || 'N/A'}</td>
            <td style="font-weight: bold; color: #007bff;">${employee.placa}</td>
            <td>${this.getVehicleTypeIcon(employee.tipoVehiculo)} ${employee.tipoVehiculo}</td>
            <td style="font-size: 0.9em;">${employee.colorVehiculo || 'N/A'}</td>
            <td style="font-size: 0.9em;">${picoPlacaDisplay}</td>
            <td style="text-align: center;">${exencionText}</td>
            <td style="font-size: 0.9em;">${estadoText}</td>
            <td style="font-size: 0.9em;">${estadoHoyText}</td>
            <td>${employee.telefono || 'N/A'}</td>
            <td style="font-size: 0.8em;">${employee.email || 'N/A'}</td>
            <td style="font-size: 0.9em;">${employee.jefeInmediato || 'N/A'}</td>
            <td style="font-size: 0.8em; color: #dc3545;">${employee.contactoEmergencia || 'N/A'}</td>
            <td style="font-weight: 500; color: #667eea;">${assignmentInfo}</td>
            <td style="font-size: 0.9em;">${fechaIngreso}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-sm" onclick="employeeManager.viewEmployee(${employee.id})" 
                            title="Ver detalles" style="background: #007bff; color: white; padding: 4px 8px; font-size: 0.8em;">
                        👁️
                    </button>
                    <button class="btn btn-sm" onclick="employeeManager.editEmployee(${employee.id})" 
                            title="Editar" style="background: #28a745; color: white; padding: 4px 8px; font-size: 0.8em;">
                        ✏️
                    </button>
                    <button class="btn btn-sm" onclick="employeeManager.deleteEmployee(${employee.id})" 
                            title="Eliminar" style="background: #dc3545; color: white; padding: 4px 8px; font-size: 0.8em;">
                        🗑️
                    </button>
                </div>
            </td>
        `;
    }

    /**
     * Get vehicle type icon
     * @param {string} type - Vehicle type
     * @returns {string} Icon
     */
    getVehicleTypeIcon(type) {
        const icons = {
            'carro': '🚗',
            'moto': '🏍️', 
            'bicicleta': '🚲'
        };
        return icons[type] || '🚗';
    }

    /**
     * Get assignment information for employee
     * @param {number} employeeId - Employee ID
     * @returns {string} Assignment info
     */
    getEmployeeAssignmentInfo(employeeId) {
        // This will be populated by the assignment module
        const assignmentEvent = new CustomEvent('getEmployeeAssignment', { 
            detail: { employeeId } 
        });
        window.dispatchEvent(assignmentEvent);
        
        // Default return - will be updated by assignment module
        return '<span class="text-muted">No asignado</span>';
    }

    /**
     * Clear form
     */
    clearForm() {
        const form = document.getElementById(UI_ELEMENTS.FORMS.EMPLEADO);
        if (form) {
            form.reset();
            // Focus on first input
            const firstInput = form.querySelector('input');
            if (firstInput) firstInput.focus();
        }
    }

    /**
     * Load employees data
     * @param {Array} employees - Employees array
     */
    loadEmployees(employees) {
        this.employees = employees || [];
        this.applyFilters();
    }

    /**
     * Get all employees
     * @returns {Array} Employees array
     */
    getEmployees() {
        return this.employees;
    }

    /**
     * Get employee by ID
     * @param {number} id - Employee ID
     * @returns {Object|null} Employee or null
     */
    getEmployeeById(id) {
        return this.employees.find(emp => emp.id === id) || null;
    }

    /**
     * Get employees without assignments
     * @returns {Array} Unassigned employees
     */
    getUnassignedEmployees() {
        // This will be updated by the assignment module
        return this.employees.filter(emp => !emp._hasAssignment);
    }

    /**
     * Save data to storage
     */
    async saveData() {
        try {
            const data = await storageService.loadData();
            data.empleados = this.employees;
            await storageService.saveData(data);
        } catch (error) {
            console.error('Error saving employee data:', error);
            throw error;
        }
    }

    /**
     * Export employees to CSV
     * @returns {string} CSV data
     */
    exportToCSV() {
        if (this.employees.length === 0) return '';

        const headers = ['Nombre', 'Cédula', 'Área', 'Teléfono', 'Placa', 'Tipo Vehículo', 'Pico y Placa', 'Fecha Registro'];
        const csvData = [headers];

        this.employees.forEach(emp => {
            csvData.push([
                emp.nombre,
                emp.cedula,
                emp.area || '',
                emp.telefono || '',
                emp.placa,
                emp.tipoVehiculo,
                emp.picoPlaca || '',
                emp.fechaRegistro
            ]);
        });

        return csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    /**
     * Get statistics
     * @returns {Object} Employee statistics
     */
    getStatistics() {
        const total = this.employees.length;
        const byVehicleType = this.employees.reduce((acc, emp) => {
            acc[emp.tipoVehiculo] = (acc[emp.tipoVehiculo] || 0) + 1;
            return acc;
        }, {});
        
        const byStatus = this.employees.reduce((acc, emp) => {
            const status = emp.estadoEmpleado || 'activo';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        const withPicoPlaca = this.employees.filter(emp => emp.picoPlaca).length;
        const withParking = 0; // This should be updated by assignment module
        
        // Calculate employees with pico y placa today
        const today = getDayOfWeek(getCurrentDate());
        const picoPlacaToday = this.employees.filter(emp => {
            const empPicoPlaca = emp.picoPlaca || calculatePicoPlacaDay(emp.placa);
            return empPicoPlaca === today;
        }).length;

        return {
            total,
            byVehicleType,
            byStatus,
            withPicoPlaca,
            withoutPicoPlaca: total - withPicoPlaca,
            withParking,
            picoPlacaToday
        };
    }

    /**
     * View employee details
     * @param {number} id - Employee ID
     */
    viewEmployee(id) {
        const employee = this.getEmployeeById(id);
        if (!employee) return;

        const picoPlacaDisplay = employee.picoPlaca || calculatePicoPlacaDay(employee.placa) || 'Sin restricción';
        
        const modalContent = `
            <div style="max-width: 600px; padding: 20px;">
                <h3 style="margin-bottom: 20px; color: #007bff;">👤 Detalles del Empleado</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><strong>Nombre:</strong> ${employee.nombre}</div>
                    <div><strong>Cédula:</strong> ${employee.cedula}</div>
                    <div><strong>Email:</strong> ${employee.email || 'N/A'}</div>
                    <div><strong>Teléfono:</strong> ${employee.telefono || 'N/A'}</div>
                    <div><strong>Área:</strong> ${employee.area || 'N/A'}</div>
                    <div><strong>Cargo:</strong> ${employee.cargo || 'N/A'}</div>
                    <div><strong>Estado:</strong> ${employee.estadoEmpleado || 'activo'}</div>
                    <div><strong>Estado Hoy:</strong> ${employee.estadoHoy || 'presente'}</div>
                    <div><strong>Fecha Ingreso:</strong> ${employee.fechaIngreso || 'N/A'}</div>
                    <div><strong>Jefe Inmediato:</strong> ${employee.jefeInmediato || 'N/A'}</div>
                </div>
                
                <h4 style="color: #667eea; margin: 20px 0 10px 0;">🚗 Información del Vehículo</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><strong>Placa:</strong> ${employee.placa}</div>
                    <div><strong>Tipo:</strong> ${this.getVehicleTypeIcon(employee.tipoVehiculo)} ${employee.tipoVehiculo}</div>
                    <div><strong>Marca:</strong> ${employee.marcaVehiculo || 'N/A'}</div>
                    <div><strong>Modelo:</strong> ${employee.modeloVehiculo || 'N/A'}</div>
                    <div><strong>Color:</strong> ${employee.colorVehiculo || 'N/A'}</div>
                    <div><strong>Año:</strong> ${employee.anoVehiculo || 'N/A'}</div>
                </div>
                
                <h4 style="color: #ffc107; margin: 20px 0 10px 0;">🚦 Pico y Placa</h4>
                <div style="margin-bottom: 20px;">
                    <strong>Días de restricción:</strong> ${picoPlacaDisplay}<br>
                    <strong>Exención:</strong> ${employee.exencionPicoPlaca === 'no' ? 'No tiene exención' : (employee.exencionPicoPlaca || 'No especificada')}
                </div>
                
                ${employee.observaciones ? `
                <h4 style="color: #28a745; margin: 20px 0 10px 0;">📋 Observaciones</h4>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                    ${employee.observaciones}
                </div>
                ` : ''}
                
                <div style="text-align: center; padding-top: 20px;">
                    <button onclick="this.closest('.modal').remove()" 
                            style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    /**
     * Edit employee
     * @param {number} id - Employee ID
     */
    editEmployee(id) {
        const employee = this.getEmployeeById(id);
        if (!employee) return;

        const modalContent = `
            <div style="max-width: 700px; padding: 20px;">
                <h3 style="margin-bottom: 20px; color: #007bff;">✏️ Editar Empleado</h3>
                
                <form id="editEmployeeForm" style="display: grid; gap: 15px;">
                    <!-- Información Personal -->
                    <fieldset style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                        <legend style="font-weight: bold; color: #667eea; padding: 0 10px;">👤 Información Personal</legend>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nombre Completo: <span style="color: red;">*</span></label>
                                <input type="text" id="editNombre" value="${employee.nombre}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cédula: <span style="color: red;">*</span></label>
                                <input type="text" id="editCedula" value="${employee.cedula}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email:</label>
                                <input type="email" id="editEmail" value="${employee.email || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Teléfono:</label>
                                <input type="tel" id="editTelefono" value="${employee.telefono || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>
                    </fieldset>

                    <!-- Información Laboral -->
                    <fieldset style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                        <legend style="font-weight: bold; color: #667eea; padding: 0 10px;">🏢 Información Laboral</legend>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Área/Departamento:</label>
                                <select id="editArea" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="">Seleccionar área</option>
                                    <option value="Administración" ${employee.area === 'Administración' ? 'selected' : ''}>Administración</option>
                                    <option value="Contabilidad" ${employee.area === 'Contabilidad' ? 'selected' : ''}>Contabilidad</option>
                                    <option value="Recursos Humanos" ${employee.area === 'Recursos Humanos' ? 'selected' : ''}>Recursos Humanos</option>
                                    <option value="Sistemas/TI" ${employee.area === 'Sistemas/TI' ? 'selected' : ''}>Sistemas/TI</option>
                                    <option value="Ventas" ${employee.area === 'Ventas' ? 'selected' : ''}>Ventas</option>
                                    <option value="Marketing" ${employee.area === 'Marketing' ? 'selected' : ''}>Marketing</option>
                                    <option value="Operaciones" ${employee.area === 'Operaciones' ? 'selected' : ''}>Operaciones</option>
                                    <option value="Logística" ${employee.area === 'Logística' ? 'selected' : ''}>Logística</option>
                                    <option value="Servicio al Cliente" ${employee.area === 'Servicio al Cliente' ? 'selected' : ''}>Servicio al Cliente</option>
                                    <option value="Gerencia" ${employee.area === 'Gerencia' ? 'selected' : ''}>Gerencia</option>
                                    <option value="Otro" ${employee.area === 'Otro' ? 'selected' : ''}>Otro</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cargo:</label>
                                <input type="text" id="editCargo" value="${employee.cargo || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Fecha de Ingreso:</label>
                                <input type="date" id="editFechaIngreso" value="${employee.fechaIngreso || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Estado:</label>
                                <select id="editEstado" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="activo" ${(employee.estadoEmpleado || 'activo') === 'activo' ? 'selected' : ''}>✅ Activo</option>
                                    <option value="vacaciones" ${employee.estadoEmpleado === 'vacaciones' ? 'selected' : ''}>🏖️ En Vacaciones</option>
                                    <option value="incapacidad" ${employee.estadoEmpleado === 'incapacidad' ? 'selected' : ''}>🏥 Incapacidad</option>
                                    <option value="licencia" ${employee.estadoEmpleado === 'licencia' ? 'selected' : ''}>📋 Licencia</option>
                                    <option value="suspendido" ${employee.estadoEmpleado === 'suspendido' ? 'selected' : ''}>⚠️ Suspendido</option>
                                    <option value="inactivo" ${employee.estadoEmpleado === 'inactivo' ? 'selected' : ''}>❌ Inactivo</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Estado Hoy:</label>
                                <select id="editEstadoHoy" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="presente" ${(employee.estadoHoy || 'presente') === 'presente' ? 'selected' : ''}>✅ Presente</option>
                                    <option value="ausente" ${employee.estadoHoy === 'ausente' ? 'selected' : ''}>❌ Ausente</option>
                                    <option value="vacaciones" ${employee.estadoHoy === 'vacaciones' ? 'selected' : ''}>🏖️ Vacaciones</option>
                                    <option value="incapacidad" ${employee.estadoHoy === 'incapacidad' ? 'selected' : ''}>🏥 Incapacidad</option>
                                    <option value="licencia" ${employee.estadoHoy === 'licencia' ? 'selected' : ''}>📋 Licencia</option>
                                    <option value="tarde" ${employee.estadoHoy === 'tarde' ? 'selected' : ''}>⏰ Llegó tarde</option>
                                    <option value="remoto" ${employee.estadoHoy === 'remoto' ? 'selected' : ''}>🏠 Trabajo remoto</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Información del Vehículo -->
                    <fieldset style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                        <legend style="font-weight: bold; color: #667eea; padding: 0 10px;">🚗 Información del Vehículo</legend>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Placa: <span style="color: red;">*</span></label>
                                <input type="text" id="editPlaca" value="${employee.placa}" required 
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; text-transform: uppercase;"
                                       pattern="[A-Z]{3}[0-9]{3}">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Tipo de Vehículo:</label>
                                <select id="editTipoVehiculo" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="carro" ${employee.tipoVehiculo === 'carro' ? 'selected' : ''}>🚗 Automóvil/Carro</option>
                                    <option value="moto" ${employee.tipoVehiculo === 'moto' ? 'selected' : ''}>🏍️ Motocicleta</option>
                                    <option value="bicicleta" ${employee.tipoVehiculo === 'bicicleta' ? 'selected' : ''}>🚲 Bicicleta</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Marca:</label>
                                <input type="text" id="editMarca" value="${employee.marcaVehiculo || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Modelo:</label>
                                <input type="text" id="editModelo" value="${employee.modeloVehiculo || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Color:</label>
                                <select id="editColor" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                    <option value="">Seleccionar color</option>
                                    <option value="Blanco" ${employee.colorVehiculo === 'Blanco' ? 'selected' : ''}>Blanco</option>
                                    <option value="Negro" ${employee.colorVehiculo === 'Negro' ? 'selected' : ''}>Negro</option>
                                    <option value="Gris" ${employee.colorVehiculo === 'Gris' ? 'selected' : ''}>Gris</option>
                                    <option value="Azul" ${employee.colorVehiculo === 'Azul' ? 'selected' : ''}>Azul</option>
                                    <option value="Rojo" ${employee.colorVehiculo === 'Rojo' ? 'selected' : ''}>Rojo</option>
                                    <option value="Verde" ${employee.colorVehiculo === 'Verde' ? 'selected' : ''}>Verde</option>
                                    <option value="Amarillo" ${employee.colorVehiculo === 'Amarillo' ? 'selected' : ''}>Amarillo</option>
                                    <option value="Plateado" ${employee.colorVehiculo === 'Plateado' ? 'selected' : ''}>Plateado</option>
                                    <option value="Otro" ${employee.colorVehiculo === 'Otro' ? 'selected' : ''}>Otro</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Información Adicional -->
                    <fieldset style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                        <legend style="font-weight: bold; color: #667eea; padding: 0 10px;">📋 Información Adicional</legend>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Contacto de Emergencia:</label>
                                <input type="text" id="editContactoEmergencia" value="${employee.contactoEmergencia || ''}" 
                                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div>
                                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Observaciones:</label>
                                <textarea id="editObservaciones" rows="3" 
                                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${employee.observaciones || ''}</textarea>
                            </div>
                        </div>
                    </fieldset>

                    <div style="text-align: center; padding-top: 20px; display: flex; gap: 10px; justify-content: center;">
                        <button type="submit" style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            💾 Actualizar Empleado
                        </button>
                        <button type="button" onclick="this.closest('.modal').remove()" 
                                style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer;">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.showModal(modalContent);
        
        // Add form submit handler
        const form = modal.querySelector('#editEmployeeForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUpdateEmployee(id, modal);
        });
    }

    /**
     * Handle update employee
     * @param {number} id - Employee ID
     * @param {HTMLElement} modal - Modal element
     */
    async handleUpdateEmployee(id, modal) {
        try {
            // Get updated data from form
            const updateData = {
                nombre: modal.querySelector('#editNombre').value.trim(),
                cedula: modal.querySelector('#editCedula').value.trim(),
                email: modal.querySelector('#editEmail').value.trim(),
                telefono: modal.querySelector('#editTelefono').value.trim(),
                area: modal.querySelector('#editArea').value,
                cargo: modal.querySelector('#editCargo').value.trim(),
                fechaIngreso: modal.querySelector('#editFechaIngreso').value,
                estadoEmpleado: modal.querySelector('#editEstado').value,
                estadoHoy: modal.querySelector('#editEstadoHoy').value,
                placa: modal.querySelector('#editPlaca').value.trim().toUpperCase(),
                tipoVehiculo: modal.querySelector('#editTipoVehiculo').value,
                marcaVehiculo: modal.querySelector('#editMarca').value.trim(),
                modeloVehiculo: modal.querySelector('#editModelo').value.trim(),
                colorVehiculo: modal.querySelector('#editColor').value,
                contactoEmergencia: modal.querySelector('#editContactoEmergencia').value.trim(),
                observaciones: modal.querySelector('#editObservaciones').value.trim()
            };

            // Basic validation
            if (!updateData.nombre || !updateData.cedula || !updateData.placa) {
                showAlert('Por favor complete todos los campos requeridos', ALERT_TYPES.DANGER);
                return;
            }

            // Check for duplicate cedula (excluding current employee)
            if (this.employees.some(emp => emp.id !== id && emp.cedula === updateData.cedula)) {
                showAlert(ERROR_MESSAGES.DUPLICATE_CEDULA, ALERT_TYPES.DANGER);
                return;
            }

            // Check for duplicate plate (excluding current employee)
            if (this.employees.some(emp => emp.id !== id && emp.placa === updateData.placa)) {
                showAlert(ERROR_MESSAGES.DUPLICATE_PLATE, ALERT_TYPES.DANGER);
                return;
            }

            // Validate plate format
            const platePattern = /^[A-Z]{3}[0-9]{3}$/;
            if (!platePattern.test(updateData.placa)) {
                showAlert(ERROR_MESSAGES.INVALID_PLATE_FORMAT, ALERT_TYPES.DANGER);
                return;
            }

            // Auto-calculate pico y placa based on plate if not manually set
            updateData.picoPlaca = calculatePicoPlacaDay(updateData.placa);

            // Update employee
            await this.updateEmployee(id, updateData);
            
            // Close modal and show success message
            modal.remove();
            showAlert('Empleado actualizado exitosamente', ALERT_TYPES.SUCCESS);
            
        } catch (error) {
            console.error('Error updating employee:', error);
            showAlert('Error al actualizar empleado', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Show modal dialog
     * @param {string} content - Modal content
     * @returns {HTMLElement} Modal element
     */
    showModal(content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        `;
        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ${content}
            </div>
        `;
        modal.className = 'modal';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Handle Escape key
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        
        // Remove keydown listener when modal is removed
        const originalRemove = modal.remove;
        modal.remove = function() {
            document.removeEventListener('keydown', handleKeydown);
            originalRemove.call(this);
        };
        
        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Show import modal
     */
    showImportModal() {
        const modalContent = `
            <div style="max-width: 600px; padding: 20px;">
                <h3 style="margin-bottom: 20px; color: #007bff;">📥 Importar Empleados</h3>
                
                <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="color: #2e7d32; margin: 0 0 10px 0;">✅ Formatos Completamente Soportados</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li><strong>📊 Excel (.xlsx)</strong> - Soporte completo con formato, fechas y estilos</li>
                        <li><strong>📄 CSV (.csv)</strong> - Compatible con cualquier hoja de cálculo</li>
                    </ul>
                    <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #2e7d32;">
                        <strong>🚀 Nuevo:</strong> Arrastra y suelta archivos Excel directamente!
                    </p>
                </div>

                <div style="background: #fff3e0; border: 1px solid #ff9800; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="color: #e65100; margin: 0 0 10px 0;">📊 Columnas Requeridas (en este orden)</h4>
                    <div style="font-size: 0.9em; line-height: 1.6;">
                        1. <strong>Nombre Completo</strong> - Obligatorio<br>
                        2. <strong>Cédula</strong> - Obligatorio<br>
                        3. <strong>Área/Departamento</strong><br>
                        4. <strong>Cargo</strong><br>
                        5. <strong>Tarjeta Proximidad</strong><br>
                        6. <strong>Placa</strong> - Obligatorio (formato: ABC123)<br>
                        7. <strong>Tipo Vehículo</strong> - carro/moto/bicicleta<br>
                        8. <strong>Color Vehículo</strong><br>
                        9. <strong>Marca Vehículo</strong><br>
                        10. <strong>Modelo Vehículo</strong><br>
                        11. <strong>Estado</strong> - activo/vacaciones/etc.<br>
                        12. <strong>Estado Hoy</strong> - presente/ausente/etc.<br>
                        13. <strong>Teléfono</strong><br>
                        14. <strong>Email</strong><br>
                        15. <strong>Jefe Inmediato</strong><br>
                        16. <strong>Contacto Emergencia</strong><br>
                        17. <strong>Fecha Ingreso</strong> - YYYY-MM-DD<br>
                        18. <strong>Exención Pico y Placa</strong> - no/discapacidad/medico/etc.<br>
                        19. <strong>Observaciones</strong>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <button onclick="employeeManager.downloadTemplate()" 
                            style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 15px; width: 100%;">
                        📊 Descargar Plantilla Excel (.xlsx)
                    </button>
                </div>

                <div style="border: 2px dashed #ccc; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;" 
                     ondragover="event.preventDefault()" 
                     ondrop="employeeManager.handleFileDrop(event)"
                     onclick="document.getElementById('importFileInput').click()">
                    <div style="font-size: 24px; margin-bottom: 10px;">📁</div>
                    <p style="margin: 0; color: #666;">
                        Arrastra tu archivo aquí o <strong>haz clic para seleccionar</strong><br>
                        <small>Formatos: .xlsx, .csv (Máximo 1000 empleados)</small>
                    </p>
                    <input type="file" id="importFileInput" accept=".xlsx,.csv" style="display: none;" onchange="employeeManager.handleFileSelect(event)">
                </div>

                <div id="importPreview" style="display: none;">
                    <h4 style="color: #2e7d32;">✅ Vista Previa de Importación</h4>
                    <div id="importSummary" style="background: #f1f8e9; padding: 10px; border-radius: 5px; margin-bottom: 10px;"></div>
                    <div id="importErrors" style="display: none; background: #ffebee; padding: 10px; border-radius: 5px; margin-bottom: 10px;"></div>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">
                        <table id="importPreviewTable" style="width: 100%; font-size: 0.8em;"></table>
                    </div>
                </div>

                <div style="text-align: center; padding-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button id="confirmImportBtn" onclick="employeeManager.confirmImport()" 
                            style="background: #2e7d32; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; display: none;">
                        ✅ Confirmar Importación
                    </button>
                    <button onclick="this.closest('.modal').remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer;">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    /**
     * Download Excel template
     */
    downloadTemplate() {
        try {
            if (typeof XLSX === 'undefined') {
                // Fallback to CSV if XLSX is not available
                this.downloadCSVTemplate();
                return;
            }

            const headers = [
                'Nombre Completo', 'Cédula', 'Área/Departamento', 'Cargo', 'Tarjeta Proximidad',
                'Placa', 'Tipo Vehículo', 'Color Vehículo', 'Marca Vehículo', 'Modelo Vehículo',
                'Estado', 'Estado Hoy', 'Teléfono', 'Email', 'Jefe Inmediato',
                'Contacto Emergencia', 'Fecha Ingreso', 'Exención Pico y Placa', 'Observaciones'
            ];

            const sampleData = [
                [
                    'Juan Carlos Pérez', '1234567890', 'Sistemas/TI', 'Desarrollador Senior', 'EMP-001',
                    'ABC123', 'carro', 'Azul', 'Toyota', 'Corolla',
                    'activo', 'presente', '3001234567', 'juan.perez@empresa.com', 'María González',
                    'Ana Pérez - 3009876543', '2023-01-15', 'no', 'Empleado ejemplar'
                ],
                [
                    'María Elena García', '9876543210', 'Ventas', 'Ejecutiva Comercial', 'EMP-002',
                    'XYZ789', 'moto', 'Roja', 'Honda', 'CB 160F',
                    'activo', 'presente', '3101234567', 'maria.garcia@empresa.com', 'Carlos Ruiz',
                    'Luis García - 3009876544', '2023-02-01', 'no', ''
                ],
                [
                    'Carlos Alberto Ruiz', '5556667890', 'Administración', 'Coordinador', 'EMP-003',
                    'DEF456', 'bicicleta', 'Verde', 'Giant', 'Escape 3',
                    'activo', 'presente', '3201234567', 'carlos.ruiz@empresa.com', 'Ana Torres',
                    'Rosa Ruiz - 3009876545', '2023-03-01', 'no', 'Transporte sostenible'
                ]
            ];

            // Crear workbook y worksheet
            const workbook = XLSX.utils.book_new();
            const worksheetData = [headers, ...sampleData];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Aplicar estilos básicos a los headers
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4472C4" } }
                };
            }

            // Ajustar ancho de columnas
            const columnWidths = [
                { wch: 25 }, // Nombre
                { wch: 12 }, // Cédula
                { wch: 15 }, // Área
                { wch: 20 }, // Cargo
                { wch: 12 }, // Tarjeta
                { wch: 10 }, // Placa
                { wch: 12 }, // Tipo Vehículo
                { wch: 10 }, // Color
                { wch: 12 }, // Marca
                { wch: 12 }, // Modelo
                { wch: 10 }, // Estado
                { wch: 10 }, // Estado Hoy
                { wch: 12 }, // Teléfono
                { wch: 25 }, // Email
                { wch: 18 }, // Jefe
                { wch: 20 }, // Emergencia
                { wch: 12 }, // Fecha Ingreso
                { wch: 12 }, // Exención
                { wch: 20 }  // Observaciones
            ];
            worksheet['!cols'] = columnWidths;

            // Agregar worksheet al workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');

            // Generar archivo Excel
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `plantilla-empleados-${getCurrentDate()}.xlsx`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showAlert('Plantilla Excel descargada exitosamente', ALERT_TYPES.SUCCESS);

        } catch (error) {
            console.error('Error creating Excel template:', error);
            showAlert('Error creando plantilla Excel, descargando CSV...', ALERT_TYPES.WARNING);
            this.downloadCSVTemplate();
        }
    }

    /**
     * Download CSV template (fallback)
     */
    downloadCSVTemplate() {
        const headers = [
            'Nombre Completo', 'Cédula', 'Área/Departamento', 'Cargo', 'Tarjeta Proximidad',
            'Placa', 'Tipo Vehículo', 'Color Vehículo', 'Marca Vehículo', 'Modelo Vehículo',
            'Estado', 'Estado Hoy', 'Teléfono', 'Email', 'Jefe Inmediato',
            'Contacto Emergencia', 'Fecha Ingreso', 'Exención Pico y Placa', 'Observaciones'
        ];

        const sampleData = [
            [
                'Juan Carlos Pérez', '1234567890', 'Sistemas/TI', 'Desarrollador Senior', 'EMP-001',
                'ABC123', 'carro', 'Azul', 'Toyota', 'Corolla',
                'activo', 'presente', '3001234567', 'juan.perez@empresa.com', 'María González',
                'Ana Pérez - 3009876543', '2023-01-15', 'no', 'Empleado ejemplar'
            ],
            [
                'María Elena García', '9876543210', 'Ventas', 'Ejecutiva Comercial', 'EMP-002',
                'XYZ789', 'moto', 'Roja', 'Honda', 'CB 160F',
                'activo', 'presente', '3101234567', 'maria.garcia@empresa.com', 'Carlos Ruiz',
                'Luis García - 3009876544', '2023-02-01', 'no', ''
            ]
        ];

        const csvContent = [headers, ...sampleData]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `plantilla-empleados-${getCurrentDate()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showAlert('Plantilla CSV descargada exitosamente', ALERT_TYPES.SUCCESS);
    }

    /**
     * Handle file drop
     */
    handleFileDrop(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processImportFile(files[0]);
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processImportFile(file);
        }
    }

    /**
     * Process import file
     */
    async processImportFile(file) {
        try {
            if (!file) return;

            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
                'application/csv'
            ];

            if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
                showAlert('Formato de archivo no válido. Use .xlsx o .csv', ALERT_TYPES.DANGER);
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showAlert('El archivo es demasiado grande. Máximo 5MB', ALERT_TYPES.DANGER);
                return;
            }

            showAlert('Procesando archivo...', ALERT_TYPES.INFO);

            let data;
            if (file.name.endsWith('.csv')) {
                data = await this.parseCSV(file);
            } else if (file.name.endsWith('.xlsx')) {
                data = await this.parseExcel(file);
            } else {
                showAlert('Formato de archivo no soportado', ALERT_TYPES.DANGER);
                return;
            }

            this.previewImportData(data);

        } catch (error) {
            console.error('Error processing file:', error);
            showAlert('Error al procesar el archivo', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Parse CSV file
     */
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n');
                    const headers = this.parseCSVLine(lines[0]);
                    const data = [];

                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = this.parseCSVLine(lines[i]);
                            if (values.length >= 6) { // At least required fields
                                const employee = this.mapCSVToEmployee(values, headers);
                                data.push(employee);
                            }
                        }
                    }

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Parse Excel file
     */
    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (typeof XLSX === 'undefined') {
                        reject(new Error('Librería XLSX no está disponible'));
                        return;
                    }

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Usar la primera hoja del libro
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convertir a JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Procesar los datos
                    const employees = [];
                    const headers = jsonData[0]; // Primera fila como headers
                    
                    for (let i = 1; i < jsonData.length; i++) {
                        if (jsonData[i] && jsonData[i].length >= 6) { // Al menos campos requeridos
                            const employee = this.mapExcelToEmployee(jsonData[i]);
                            if (employee.nombre || employee.cedula || employee.placa) { // Al menos uno debe existir
                                employees.push(employee);
                            }
                        }
                    }
                    
                    resolve(employees);
                } catch (error) {
                    console.error('Error parsing Excel:', error);
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Map Excel data to employee object
     */
    mapExcelToEmployee(values) {
        return {
            nombre: this.sanitizeExcelValue(values[0]) || '',
            cedula: this.sanitizeExcelValue(values[1]) || '',
            area: this.sanitizeExcelValue(values[2]) || '',
            cargo: this.sanitizeExcelValue(values[3]) || '',
            codigoEmpleado: this.sanitizeExcelValue(values[4]) || '',
            placa: this.sanitizeExcelValue(values[5])?.toString().toUpperCase() || '',
            tipoVehiculo: this.sanitizeExcelValue(values[6])?.toLowerCase() || 'carro',
            colorVehiculo: this.sanitizeExcelValue(values[7]) || '',
            marcaVehiculo: this.sanitizeExcelValue(values[8]) || '',
            modeloVehiculo: this.sanitizeExcelValue(values[9]) || '',
            estadoEmpleado: this.sanitizeExcelValue(values[10])?.toLowerCase() || 'activo',
            estadoHoy: this.sanitizeExcelValue(values[11])?.toLowerCase() || 'presente',
            telefono: this.sanitizeExcelValue(values[12]) || '',
            email: this.sanitizeExcelValue(values[13]) || '',
            jefeInmediato: this.sanitizeExcelValue(values[14]) || '',
            contactoEmergencia: this.sanitizeExcelValue(values[15]) || '',
            fechaIngreso: this.formatExcelDate(values[16]) || '',
            exencionPicoPlaca: this.sanitizeExcelValue(values[17])?.toLowerCase() || 'no',
            observaciones: this.sanitizeExcelValue(values[18]) || ''
        };
    }

    /**
     * Sanitize Excel cell value
     */
    sanitizeExcelValue(value) {
        if (value === null || value === undefined) return '';
        return value.toString().trim();
    }

    /**
     * Format Excel date value
     */
    formatExcelDate(value) {
        if (!value) return '';
        
        try {
            // Si es un número (fecha de Excel)
            if (typeof value === 'number') {
                const date = XLSX.SSF.parse_date_code(value);
                return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
            
            // Si es una cadena
            if (typeof value === 'string') {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                return value;
            }
            
            return value.toString();
        } catch (error) {
            console.warn('Error formatting Excel date:', error);
            return value?.toString() || '';
        }
    }

    /**
     * Parse CSV line handling quoted values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values.map(v => v.replace(/^"|"$/g, ''));
    }

    /**
     * Map CSV data to employee object
     */
    mapCSVToEmployee(values, headers) {
        return {
            nombre: values[0]?.trim() || '',
            cedula: values[1]?.trim() || '',
            area: values[2]?.trim() || '',
            cargo: values[3]?.trim() || '',
            codigoEmpleado: values[4]?.trim() || '',
            placa: values[5]?.trim().toUpperCase() || '',
            tipoVehiculo: values[6]?.trim().toLowerCase() || 'carro',
            colorVehiculo: values[7]?.trim() || '',
            marcaVehiculo: values[8]?.trim() || '',
            modeloVehiculo: values[9]?.trim() || '',
            estadoEmpleado: values[10]?.trim().toLowerCase() || 'activo',
            estadoHoy: values[11]?.trim().toLowerCase() || 'presente',
            telefono: values[12]?.trim() || '',
            email: values[13]?.trim() || '',
            jefeInmediato: values[14]?.trim() || '',
            contactoEmergencia: values[15]?.trim() || '',
            fechaIngreso: values[16]?.trim() || '',
            exencionPicoPlaca: values[17]?.trim().toLowerCase() || 'no',
            observaciones: values[18]?.trim() || ''
        };
    }

    /**
     * Preview import data
     */
    previewImportData(employees) {
        const errors = [];
        const validEmployees = [];
        const duplicates = [];

        employees.forEach((employee, index) => {
            const rowErrors = [];
            const rowNumber = index + 2; // +2 because index starts at 0 and we skip header

            // Required field validation
            if (!employee.nombre) rowErrors.push(`Fila ${rowNumber}: Nombre requerido`);
            if (!employee.cedula) rowErrors.push(`Fila ${rowNumber}: Cédula requerida`);
            if (!employee.placa) rowErrors.push(`Fila ${rowNumber}: Placa requerida`);

            // Plate format validation
            if (employee.placa && !/^[A-Z]{3}[0-9]{3}$/.test(employee.placa)) {
                rowErrors.push(`Fila ${rowNumber}: Formato de placa inválido (debe ser ABC123)`);
            }

            // Vehicle type validation
            if (employee.tipoVehiculo && !['carro', 'moto', 'bicicleta'].includes(employee.tipoVehiculo)) {
                rowErrors.push(`Fila ${rowNumber}: Tipo de vehículo inválido`);
            }

            // Check for duplicates with existing employees
            const existingByCedula = this.employees.find(emp => emp.cedula === employee.cedula);
            const existingByPlate = this.employees.find(emp => emp.placa === employee.placa);

            if (existingByCedula) duplicates.push(`Fila ${rowNumber}: Cédula ${employee.cedula} ya existe`);
            if (existingByPlate) duplicates.push(`Fila ${rowNumber}: Placa ${employee.placa} ya existe`);

            if (rowErrors.length === 0) {
                validEmployees.push(employee);
            } else {
                errors.push(...rowErrors);
            }
        });

        this.displayImportPreview(validEmployees, errors, duplicates);
        this.pendingImport = validEmployees;
    }

    /**
     * Display import preview
     */
    displayImportPreview(employees, errors, duplicates) {
        const previewDiv = document.getElementById('importPreview');
        const summaryDiv = document.getElementById('importSummary');
        const errorsDiv = document.getElementById('importErrors');
        const confirmBtn = document.getElementById('confirmImportBtn');

        previewDiv.style.display = 'block';

        // Summary
        summaryDiv.innerHTML = `
            <strong>📊 Resumen:</strong><br>
            • Total registros: ${employees.length + errors.length + duplicates.length}<br>
            • ✅ Válidos: ${employees.length}<br>
            • ❌ Errores: ${errors.length}<br>
            • ⚠️ Duplicados: ${duplicates.length}
        `;

        // Errors
        if (errors.length > 0 || duplicates.length > 0) {
            errorsDiv.style.display = 'block';
            errorsDiv.innerHTML = `
                <strong>⚠️ Problemas encontrados:</strong><br>
                ${[...errors, ...duplicates].map(error => `• ${error}`).join('<br>')}
            `;
        }

        // Preview table
        const table = document.getElementById('importPreviewTable');
        if (employees.length > 0) {
            const headers = ['Nombre', 'Cédula', 'Área', 'Placa', 'Tipo', 'Estado'];
            table.innerHTML = `
                <thead>
                    <tr style="background: #f5f5f5;">
                        ${headers.map(h => `<th style="padding: 5px; border: 1px solid #ddd;">${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${employees.slice(0, 10).map(emp => `
                        <tr>
                            <td style="padding: 5px; border: 1px solid #ddd;">${emp.nombre}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${emp.cedula}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${emp.area}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${emp.placa}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${emp.tipoVehiculo}</td>
                            <td style="padding: 5px; border: 1px solid #ddd;">${emp.estadoEmpleado}</td>
                        </tr>
                    `).join('')}
                    ${employees.length > 10 ? `<tr><td colspan="6" style="text-align: center; padding: 5px; font-style: italic;">... y ${employees.length - 10} más</td></tr>` : ''}
                </tbody>
            `;
        }

        // Show/hide confirm button
        confirmBtn.style.display = employees.length > 0 ? 'inline-block' : 'none';
    }

    /**
     * Confirm import
     */
    async confirmImport() {
        if (!this.pendingImport || this.pendingImport.length === 0) {
            showAlert('No hay datos válidos para importar', ALERT_TYPES.WARNING);
            return;
        }

        try {
            showAlert('Importando empleados...', ALERT_TYPES.INFO);

            let successCount = 0;
            for (const employeeData of this.pendingImport) {
                // Add auto-calculated fields
                employeeData.id = generateId();
                employeeData.fechaRegistro = getCurrentDate();
                employeeData.picoPlaca = employeeData.picoPlaca || calculatePicoPlacaDay(employeeData.placa);

                this.employees.push(employeeData);
                successCount++;
            }

            await this.saveData();
            this.applyFilters();

            // Close modal
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();

            // Dispatch events for each imported employee
            this.pendingImport.forEach(employee => {
                window.dispatchEvent(new CustomEvent('employeeAdded', { detail: employee }));
            });

            showAlert(`✅ ${successCount} empleados importados exitosamente`, ALERT_TYPES.SUCCESS);
            this.pendingImport = null;

        } catch (error) {
            console.error('Error importing employees:', error);
            showAlert('Error al importar empleados', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Export to CSV with all fields
     */
    exportToCSV() {
        if (this.employees.length === 0) {
            showAlert('No hay empleados para exportar', ALERT_TYPES.WARNING);
            return;
        }

        const headers = [
            'Nombre Completo', 'Cédula', 'Email', 'Teléfono', 'Teléfono Fijo', 
            'Área/Departamento', 'Cargo', 'Código Empleado', 'Fecha Ingreso', 'Jefe Inmediato', 'Horario',
            'Placa Vehículo', 'Tipo Vehículo', 'Marca', 'Modelo', 'Color', 'Año',
            'Pico y Placa', 'Exención P&P', 'Estado Empleado', 'Tipo Contrato',
            'Contacto Emergencia', 'Dirección', 'Observaciones', 'Fecha Registro'
        ];
        const csvData = [headers];

        this.employees.forEach(emp => {
            const picoPlacaDisplay = emp.picoPlaca || calculatePicoPlacaDay(emp.placa) || 'Sin restricción';
            
            csvData.push([
                emp.nombre, emp.cedula, emp.email || '', emp.telefono || '', emp.telefonoFijo || '',
                emp.area || '', emp.cargo || '', emp.codigoEmpleado || '', emp.fechaIngreso || '', emp.jefeInmediato || '', emp.horarioTrabajo || '',
                emp.placa, emp.tipoVehiculo, emp.marcaVehiculo || '', emp.modeloVehiculo || '', emp.colorVehiculo || '', emp.anoVehiculo || '',
                picoPlacaDisplay, emp.exencionPicoPlaca || 'no', emp.estadoEmpleado || 'activo', emp.tipoContrato || '',
                emp.contactoEmergencia || '', emp.direccionResidencia || '', emp.observaciones || '', emp.fechaRegistro
            ]);
        });

        const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `empleados-${getCurrentDate()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert(`Exportados ${this.employees.length} empleados a CSV`, ALERT_TYPES.SUCCESS);
    }

    /**
     * Update statistics display
     */
    updateStatisticsDisplay() {
        const stats = this.getStatistics();
        const now = new Date().toLocaleString('es-CO');

        // Update counters
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('totalEmpleados', stats.total);
        updateElement('empleadosActivos', stats.byStatus.activo || 0);
        updateElement('empleadosConParqueadero', stats.withParking);
        updateElement('empleadosPicoPlacaHoy', stats.picoPlacaToday);
        updateElement('ultimaActualizacion', now);
    }
}

// Create global instance
const employeeManager = new EmployeeManager();
window.employeeManager = employeeManager; // Make it globally accessible

export default employeeManager;
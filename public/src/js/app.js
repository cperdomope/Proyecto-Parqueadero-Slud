/**
 * Main application entry point
 * Coordinates all modules and handles initialization
 */

import { APP_CONFIG, UI_ELEMENTS, ALERT_TYPES } from './utils/constants.js';
import { getCurrentDate, calculateDailyAvailability } from './utils/helpers.js';
import storageService from './services/storage.js';
import apiService from './services/api.js';
import employeeManager from './modules/employees.js';
import parkingManager from './modules/parking.js';
import assignmentManager from './modules/assignments.js';
import { showAlert, setupFormValidation } from './modules/ui.js';

class ParkingApp {
    constructor() {
        this.currentTab = UI_ELEMENTS.TABS.DASHBOARD;
        this.isInitialized = false;
        this.assignments = [];
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log(`🅿️ Parking Management System v${APP_CONFIG.VERSION} starting...`);
            
            // Setup basic UI
            this.setupUI();
            
            // Load data
            await this.loadAppData();
            
            // Initialize modules
            this.initializeModules();
            
            // Setup inter-module communication
            this.setupModuleCommunication();
            
            // Update dashboard
            this.updateDashboard();
            
            // Check API connectivity
            this.checkAPIConnectivity();
            
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
            // Show welcome message
            showAlert('Sistema iniciado correctamente', ALERT_TYPES.SUCCESS, 3000);
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            showAlert('Error al inicializar el sistema', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Setup basic UI functionality
     */
    setupUI() {
        this.setupNavigation();
        this.setupFormValidation();
        this.setupDateInputs();
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup navigation between tabs
     */
    setupNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });
    }

    /**
     * Show specific tab
     * @param {string} tabName - Tab to show
     */
    showTab(tabName) {
        console.log('showTab called with:', tabName);
        // Hide all tabs
        const allTabs = document.querySelectorAll('.tab-content');
        const allNavTabs = document.querySelectorAll('.nav-tab');
        
        allTabs.forEach(tab => tab.classList.remove('active'));
        allNavTabs.forEach(nav => nav.classList.remove('active'));
        
        // Show selected tab
        const targetTab = document.getElementById(tabName);
        const targetNav = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (targetTab && targetNav) {
            targetTab.classList.add('active');
            targetNav.classList.add('active');
            this.currentTab = tabName;
            
            // Update data when switching to dashboard
            if (tabName === UI_ELEMENTS.TABS.DASHBOARD) {
                this.updateDashboard();
            }
            
            // Handle availability tab
            if (tabName === UI_ELEMENTS.TABS.DISPONIBILIDAD) {
                this.setupAvailabilityTab();
            }
        }
    }

    /**
     * Setup form validation for all forms
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            setupFormValidation(form);
        });
    }

    /**
     * Setup date inputs with current date
     */
    setupDateInputs() {
        const today = getCurrentDate();
        
        // Set default dates
        const fechaInicio = document.getElementById('fechaInicio');
        const fechaConsulta = document.getElementById('fechaConsulta');
        
        if (fechaInicio) fechaInicio.value = today;
        if (fechaConsulta) {
            fechaConsulta.value = today;
            fechaConsulta.addEventListener('change', () => this.updateAvailability());
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + number keys for tab navigation
            if (e.altKey && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                const tabs = Object.values(UI_ELEMENTS.TABS);
                if (tabs[tabIndex]) {
                    this.showTab(tabs[tabIndex]);
                }
            }
            
            // Ctrl + S for save (export data)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.exportData();
            }
        });
    }

    /**
     * Load application data
     */
    async loadAppData() {
        try {
            const data = await storageService.loadData();
            
            // Load data into modules
            employeeManager.loadEmployees(data.empleados || []);
            parkingManager.loadParkingSpaces(data.parqueaderos || []);
            assignmentManager.loadData(); // This will load all data including assignments
            
            console.log('📊 Data loaded:', {
                employees: data.empleados?.length || 0,
                parkingSpaces: data.parqueaderos?.length || 0,
                assignments: data.asignaciones?.length || 0
            });
            
        } catch (error) {
            console.error('Error loading app data:', error);
            showAlert('Error al cargar los datos', ALERT_TYPES.WARNING);
        }
    }

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Modules are already initialized through imports
        // Additional setup if needed
        this.setupAssignmentHandlers();
    }

    /**
     * Setup assignment handlers
     */
    setupAssignmentHandlers() {
        // Assignment form
        const assignmentForm = document.getElementById(UI_ELEMENTS.FORMS.ASIGNACION);
        if (assignmentForm) {
            assignmentForm.addEventListener('submit', (e) => this.handleAssignmentSubmit(e));
        }

        // Auto-assignment button
        const autoAssignBtn = document.getElementById('asignacionAutomatica');
        if (autoAssignBtn) {
            autoAssignBtn.addEventListener('click', () => this.handleAutoAssignment());
        }
    }

    /**
     * Setup inter-module communication
     */
    setupModuleCommunication() {
        // Listen for employee events
        window.addEventListener('employeeAdded', (e) => {
            this.updateSelectorsAndDashboard();
        });

        window.addEventListener('employeeDeleted', (e) => {
            // Remove assignments for deleted employee
            this.assignments = this.assignments.filter(
                assignment => assignment.empleadoId !== e.detail.id
            );
            this.saveAssignments();
            this.updateSelectorsAndDashboard();
        });

        // Listen for parking events
        window.addEventListener('parkingSpaceAdded', (e) => {
            this.updateSelectorsAndDashboard();
        });

        window.addEventListener('parkingSpaceDeleted', (e) => {
            // Remove assignments for deleted parking space
            this.assignments = this.assignments.filter(
                assignment => assignment.parqueaderoId !== e.detail.id
            );
            this.saveAssignments();
            this.updateSelectorsAndDashboard();
        });

        // Handle assignment info requests
        window.addEventListener('getEmployeeAssignment', (e) => {
            this.updateEmployeeAssignmentDisplay(e.detail.employeeId);
        });
    }

    /**
     * Handle assignment form submission
     * @param {Event} event - Form submit event
     */
    async handleAssignmentSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const assignmentData = {
            empleadoId: parseInt(formData.get('empleadoAsignacion')),
            parqueaderoId: parseInt(formData.get('parqueaderoAsignacion')),
            fechaInicio: formData.get('fechaInicio'),
            fechaFin: formData.get('fechaFin') || null
        };

        // Validation
        if (!assignmentData.empleadoId || !assignmentData.parqueaderoId || !assignmentData.fechaInicio) {
            showAlert('Complete todos los campos requeridos', ALERT_TYPES.DANGER);
            return;
        }

        // Check if employee already has assignment
        if (this.hasActiveAssignment(assignmentData.empleadoId)) {
            showAlert('El empleado ya tiene un parqueadero asignado', ALERT_TYPES.DANGER);
            return;
        }

        // Check if parking space is available
        if (this.isParkingSpaceAssigned(assignmentData.parqueaderoId)) {
            showAlert('El parqueadero ya está asignado', ALERT_TYPES.DANGER);
            return;
        }

        try {
            await this.createAssignment(assignmentData);
            event.target.reset();
            showAlert('Parqueadero asignado exitosamente', ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error creating assignment:', error);
            showAlert('Error al asignar parqueadero', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Handle auto-assignment
     */
    async handleAutoAssignment() {
        const unassignedEmployees = employeeManager.getEmployees().filter(
            emp => !this.hasActiveAssignment(emp.id)
        );

        if (unassignedEmployees.length === 0) {
            showAlert('Todos los empleados ya tienen asignaciones', ALERT_TYPES.INFO);
            return;
        }

        let assignedCount = 0;

        for (const employee of unassignedEmployees) {
            const availableSpaces = parkingManager.getAvailableSpaces(employee.tipoVehiculo);
            const availableSpace = availableSpaces.find(space => 
                !this.isParkingSpaceAssigned(space.id)
            );

            if (availableSpace) {
                await this.createAssignment({
                    empleadoId: employee.id,
                    parqueaderoId: availableSpace.id,
                    fechaInicio: getCurrentDate(),
                    fechaFin: null
                });
                assignedCount++;
            }
        }

        showAlert(`Se asignaron ${assignedCount} parqueaderos automáticamente`, ALERT_TYPES.SUCCESS);
    }

    /**
     * Create new assignment
     * @param {Object} assignmentData - Assignment data
     */
    async createAssignment(assignmentData) {
        const assignment = {
            id: Date.now(),
            ...assignmentData,
            activa: true,
            fechaCreacion: getCurrentDate()
        };

        this.assignments.push(assignment);
        
        // Update parking space status
        await parkingManager.updateParkingSpace(assignment.parqueaderoId, {
            estado: 'ocupado',
            empleadoAsignado: assignment.empleadoId
        });

        await this.saveAssignments();
        this.updateSelectorsAndDashboard();
        this.renderAssignments();
    }

    /**
     * Check if employee has active assignment
     * @param {number} employeeId - Employee ID
     * @returns {boolean} Has active assignment
     */
    hasActiveAssignment(employeeId) {
        return this.assignments.some(assignment => 
            assignment.empleadoId === employeeId && assignment.activa
        );
    }

    /**
     * Check if parking space is assigned
     * @param {number} parkingSpaceId - Parking space ID
     * @returns {boolean} Is assigned
     */
    isParkingSpaceAssigned(parkingSpaceId) {
        return this.assignments.some(assignment => 
            assignment.parqueaderoId === parkingSpaceId && assignment.activa
        );
    }

    /**
     * Update selectors and dashboard
     */
    updateSelectorsAndDashboard() {
        this.updateAssignmentSelectors();
        this.updateDashboard();
        this.renderAssignments();
    }

    /**
     * Update assignment form selectors
     */
    updateAssignmentSelectors() {
        // Update employee selector
        const employeeSelect = document.getElementById('empleadoAsignacion');
        if (employeeSelect) {
            employeeSelect.innerHTML = '<option value="">Seleccionar empleado</option>';
            
            const unassignedEmployees = employeeManager.getEmployees().filter(
                emp => !this.hasActiveAssignment(emp.id)
            );

            unassignedEmployees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.nombre} - ${employee.placa} (${employee.tipoVehiculo})`;
                employeeSelect.appendChild(option);
            });
        }

        // Update parking selector
        const parkingSelect = document.getElementById('parqueaderoAsignacion');
        if (parkingSelect) {
            parkingSelect.innerHTML = '<option value="">Seleccionar parqueadero</option>';
            
            const availableSpaces = parkingManager.getAvailableSpaces().filter(
                space => !this.isParkingSpaceAssigned(space.id)
            );

            availableSpaces.forEach(space => {
                const option = document.createElement('option');
                option.value = space.id;
                option.textContent = `${space.numero} - Sótano ${space.sotano} (${space.tipo})`;
                parkingSelect.appendChild(option);
            });
        }
    }

    /**
     * Render assignments table
     */
    renderAssignments() {
        const tbody = document.getElementById('tablaAsignaciones');
        if (!tbody) return;

        tbody.innerHTML = '';

        const activeAssignments = this.assignments.filter(assignment => assignment.activa);

        if (activeAssignments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                        No hay asignaciones activas
                    </td>
                </tr>
            `;
            return;
        }

        activeAssignments.forEach(assignment => {
            const employee = employeeManager.getEmployeeById(assignment.empleadoId);
            const parkingSpace = parkingManager.getParkingSpaceById(assignment.parqueaderoId);
            
            if (employee && parkingSpace) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.nombre}</td>
                    <td>${parkingSpace.numero}</td>
                    <td>Sótano ${parkingSpace.sotano}</td>
                    <td>${parkingSpace.tipo}</td>
                    <td>${assignment.fechaInicio}</td>
                    <td>${assignment.fechaFin || 'Indefinido'}</td>
                    <td><span class="status-ocupado">Ocupado</span></td>
                    <td>
                        <button class="btn btn-danger" onclick="app.endAssignment(${assignment.id})" 
                                title="Terminar asignación">
                            🏁 Terminar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            }
        });
    }

    /**
     * End assignment
     * @param {number} assignmentId - Assignment ID
     */
    async endAssignment(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const confirmed = confirm('¿Está seguro de terminar esta asignación?');
        if (!confirmed) return;

        try {
            // Update assignment
            assignment.activa = false;
            assignment.fechaFin = getCurrentDate();

            // Update parking space
            await parkingManager.updateParkingSpace(assignment.parqueaderoId, {
                estado: 'disponible',
                empleadoAsignado: null
            });

            await this.saveAssignments();
            this.updateSelectorsAndDashboard();
            showAlert('Asignación terminada exitosamente', ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error ending assignment:', error);
            showAlert('Error al terminar asignación', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboard() {
        const stats = parkingManager.getStatistics();
        
        // Update counters
        document.getElementById('totalParqueaderos').textContent = stats.total;
        document.getElementById('disponibles').textContent = stats.available;
        document.getElementById('ocupados').textContent = stats.occupied;
        document.getElementById('picoPlaca').textContent = '0'; // TODO: Calculate pico y placa
        
        // Update today's availability
        this.updateTodayAvailability();
    }

    /**
     * Update today's availability table
     */
    updateTodayAvailability() {
        const tbody = document.getElementById('disponibilidadHoy');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const availableSpaces = parkingManager.getAvailableSpaces();
        
        if (availableSpaces.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                        No hay parqueaderos disponibles hoy
                    </td>
                </tr>
            `;
            return;
        }

        availableSpaces.forEach(space => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${space.numero}</td>
                <td>Sótano ${space.sotano}</td>
                <td>${space.tipo}</td>
                <td><span class="status-disponible">Disponible</span></td>
                <td>No asignado</td>
                <td>Sin asignación</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Setup availability tab
     */
    setupAvailabilityTab() {
        // Add event listeners for filters
        const filters = ['filtroTipoDisponibilidad', 'filtroSotanoDisponibilidad'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.updateAvailability());
            }
        });

        this.updateAvailability();
    }

    /**
     * Update availability display
     */
    updateAvailability() {
        // This is a simplified version - full implementation would include pico y placa logic
        const availableSpaces = parkingManager.getAvailableSpaces();
        const occupiedSpaces = parkingManager.getOccupiedSpaces();
        
        document.getElementById('disponiblesFecha').textContent = availableSpaces.length;
        document.getElementById('ocupadosFecha').textContent = occupiedSpaces.length;
        document.getElementById('picoPlacaFecha').textContent = '0';
        
        // Update table
        const tbody = document.getElementById('tablaDisponibilidad');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const allSpaces = parkingManager.getParkingSpaces();
        
        allSpaces.forEach(space => {
            const assignment = this.assignments.find(a => 
                a.parqueaderoId === space.id && a.activa
            );
            
            const employee = assignment ? 
                employeeManager.getEmployeeById(assignment.empleadoId) : null;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${space.numero}</td>
                <td>Sótano ${space.sotano}</td>
                <td>${space.tipo}</td>
                <td><span class="status-${space.estado}">${space.estado}</span></td>
                <td>${employee ? employee.nombre : 'No asignado'}</td>
                <td>${assignment ? 'Empleado trabajando' : 'Sin asignación'}</td>
                <td>
                    ${space.estado === 'disponible' ? 
                        '<button class="btn btn-primary">📝 Asignar</button>' : 
                        '-'
                    }
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Save assignments to storage
     */
    async saveAssignments() {
        try {
            const data = await storageService.loadData();
            data.asignaciones = this.assignments;
            await storageService.saveData(data);
        } catch (error) {
            console.error('Error saving assignments:', error);
            throw error;
        }
    }

    /**
     * Export application data
     */
    async exportData() {
        try {
            const data = await storageService.loadData();
            storageService.exportData(data);
            showAlert('Datos exportados exitosamente', ALERT_TYPES.SUCCESS);
        } catch (error) {
            console.error('Error exporting data:', error);
            showAlert('Error al exportar datos', ALERT_TYPES.DANGER);
        }
    }

    /**
     * Check API connectivity
     */
    async checkAPIConnectivity() {
        try {
            const isAvailable = await apiService.isAPIAvailable();
            if (isAvailable) {
                console.log('🌐 API connection available');
                storageService.setAPIMode(true);
            } else {
                console.log('📱 Working in offline mode');
                storageService.setAPIMode(false);
            }
        } catch (error) {
            console.log('📱 API not available, working offline');
            storageService.setAPIMode(false);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ParkingApp();
});

// Export for module use
export default ParkingApp;
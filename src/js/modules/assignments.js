import storageService from '../services/storage.js';
import { showAlert } from './ui.js';
import { 
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    ALERT_TYPES,
    PARKING_STATUS 
} from '../utils/constants.js';
import { 
    generateId, 
    getCurrentDate,
    getDayOfWeek,
    calculatePicoPlacaDay,
    calculateDailyAvailability,
    isTodayPicoPlaca 
} from '../utils/helpers.js';

export class AssignmentManager {
    constructor() {
        this.assignments = [];
        this.employees = [];
        this.parkingSpaces = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupDateSelector();
    }

    bindEvents() {
        const form = document.getElementById('asignacionForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const autoAssignBtn = document.getElementById('asignacionAutomatica');
        if (autoAssignBtn) {
            autoAssignBtn.addEventListener('click', () => this.performAutoAssignment());
        }

        const dateSelector = document.getElementById('fechaConsulta');
        if (dateSelector) {
            dateSelector.addEventListener('change', (e) => this.updateAvailabilityView(e.target.value));
        }

        // Listen for employee and parking updates
        window.addEventListener('employeeAdded', (e) => this.onEmployeeAdded(e.detail));
        window.addEventListener('employeeDeleted', (e) => this.onEmployeeDeleted(e.detail));
        window.addEventListener('parkingSpaceAdded', (e) => this.onParkingSpaceAdded(e.detail));
    }

    setupDateSelector() {
        const dateSelector = document.getElementById('fechaConsulta');
        if (dateSelector) {
            dateSelector.value = getCurrentDate();
            this.updateAvailabilityView(getCurrentDate());
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = this.getFormData();
            
            if (!this.validateAssignmentData(formData)) {
                showAlert('Por favor complete todos los campos requeridos', ALERT_TYPES.DANGER);
                return;
            }

            const validation = this.validateAssignment(formData);
            if (!validation.isValid) {
                showAlert(validation.message, ALERT_TYPES.DANGER);
                return;
            }

            await this.createAssignment(formData);
            this.clearForm();
            showAlert(SUCCESS_MESSAGES.PARKING_ASSIGNED, ALERT_TYPES.SUCCESS);
            
        } catch (error) {
            console.error('Error creating assignment:', error);
            showAlert('Error al crear asignación', ALERT_TYPES.DANGER);
        }
    }

    getFormData() {
        return {
            empleadoId: parseInt(document.getElementById('empleadoAsignacion')?.value),
            parqueaderoId: parseInt(document.getElementById('parqueaderoAsignacion')?.value),
            fechaInicio: document.getElementById('fechaInicio')?.value || getCurrentDate(),
            fechaFin: document.getElementById('fechaFin')?.value || null
        };
    }

    validateAssignmentData(data) {
        return data.empleadoId && data.parqueaderoId && data.fechaInicio;
    }

    validateAssignment(formData) {
        const { empleadoId, parqueaderoId } = formData;
        
        const employee = this.employees.find(emp => emp.id === empleadoId);
        if (!employee) {
            return { isValid: false, message: ERROR_MESSAGES.EMPLOYEE_NOT_FOUND };
        }

        const parkingSpace = this.parkingSpaces.find(space => space.id === parqueaderoId);
        if (!parkingSpace) {
            return { isValid: false, message: ERROR_MESSAGES.PARKING_NOT_FOUND };
        }

        // Check if employee already has an active assignment
        const existingAssignment = this.assignments.find(assignment => 
            assignment.empleadoId === empleadoId && assignment.activa
        );
        if (existingAssignment) {
            return { isValid: false, message: ERROR_MESSAGES.EMPLOYEE_ALREADY_ASSIGNED };
        }

        // Check if parking space is already assigned
        const parkingAssignment = this.assignments.find(assignment => 
            assignment.parqueaderoId === parqueaderoId && assignment.activa
        );
        if (parkingAssignment) {
            return { isValid: false, message: ERROR_MESSAGES.PARKING_ALREADY_ASSIGNED };
        }

        // Check vehicle type compatibility
        if (employee.tipoVehiculo !== parkingSpace.tipo) {
            return { isValid: false, message: ERROR_MESSAGES.VEHICLE_TYPE_MISMATCH };
        }

        return { isValid: true };
    }

    async createAssignment(formData) {
        const assignment = {
            id: generateId(),
            ...formData,
            activa: true,
            fechaCreacion: getCurrentDate()
        };

        // Update parking space status
        const parkingSpace = this.parkingSpaces.find(space => space.id === formData.parqueaderoId);
        if (parkingSpace) {
            parkingSpace.empleadoAsignado = formData.empleadoId;
            parkingSpace.estado = PARKING_STATUS.OCUPADO;
        }

        this.assignments.push(assignment);
        await this.saveData();
        this.renderAssignments();
        this.updateAvailabilityView(getCurrentDate());
        
        window.dispatchEvent(new CustomEvent('assignmentCreated', { detail: assignment }));
    }

    async endAssignment(assignmentId) {
        const assignment = this.assignments.find(a => a.id === assignmentId);
        if (!assignment) return;

        const confirmed = confirm('¿Terminar esta asignación? El parqueadero quedará disponible.');
        if (!confirmed) return;

        try {
            assignment.activa = false;
            assignment.fechaFin = getCurrentDate();

            // Update parking space
            const parkingSpace = this.parkingSpaces.find(space => space.id === assignment.parqueaderoId);
            if (parkingSpace) {
                parkingSpace.empleadoAsignado = null;
                parkingSpace.estado = PARKING_STATUS.DISPONIBLE;
            }

            await this.saveData();
            this.renderAssignments();
            this.updateAvailabilityView(getCurrentDate());
            
            showAlert(SUCCESS_MESSAGES.ASSIGNMENT_ENDED, ALERT_TYPES.SUCCESS);
            
        } catch (error) {
            console.error('Error ending assignment:', error);
            showAlert('Error al terminar asignación', ALERT_TYPES.DANGER);
        }
    }

    async performAutoAssignment() {
        const unassignedEmployees = this.employees.filter(emp => {
            return !this.assignments.some(a => a.empleadoId === emp.id && a.activa);
        });

        if (unassignedEmployees.length === 0) {
            showAlert('No hay empleados sin asignar', ALERT_TYPES.INFO);
            return;
        }

        const availableSpaces = this.parkingSpaces.filter(space => {
            return space.estado === PARKING_STATUS.DISPONIBLE && 
                   !this.assignments.some(a => a.parqueaderoId === space.id && a.activa);
        });

        if (availableSpaces.length === 0) {
            showAlert('No hay parqueaderos disponibles', ALERT_TYPES.INFO);
            return;
        }

        const confirmed = confirm(
            `Asignar automáticamente ${Math.min(unassignedEmployees.length, availableSpaces.length)} empleados?`
        );
        if (!confirmed) return;

        try {
            let assignmentCount = 0;

            for (const employee of unassignedEmployees) {
                const compatibleSpaces = availableSpaces.filter(space => 
                    space.tipo === employee.tipoVehiculo && !space.empleadoAsignado
                );

                if (compatibleSpaces.length > 0) {
                    const space = compatibleSpaces[0]; // Take first available compatible space
                    
                    await this.createAssignment({
                        empleadoId: employee.id,
                        parqueaderoId: space.id,
                        fechaInicio: getCurrentDate(),
                        fechaFin: null
                    });

                    assignmentCount++;
                }
            }

            showAlert(`${SUCCESS_MESSAGES.AUTO_ASSIGNMENTS_COMPLETED}: ${assignmentCount} asignaciones`, ALERT_TYPES.SUCCESS);
            
        } catch (error) {
            console.error('Error in auto assignment:', error);
            showAlert('Error en asignación automática', ALERT_TYPES.DANGER);
        }
    }

    updateAvailabilityView(date) {
        if (!date) date = getCurrentDate();
        
        const availability = calculateDailyAvailability(this.parkingSpaces, this.employees, date);
        
        this.updateDashboardCounters(availability.summary);
        this.renderAvailabilityTable(availability, date);
        this.renderTodayAvailability(availability);
    }

    updateDashboardCounters(summary) {
        const elements = {
            totalParqueaderos: summary.totalAvailable + summary.occupied,
            disponibles: summary.normallyAvailable,
            ocupados: summary.occupied,
            picoPlaca: summary.picoPlacaAvailable
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update availability date-specific counters
        const dateElements = {
            disponiblesFecha: summary.totalAvailable,
            ocupadosFecha: summary.occupied,
            picoPlacaFecha: summary.picoPlacaAvailable
        };

        Object.entries(dateElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    renderAvailabilityTable(availability, date) {
        const tbody = document.getElementById('tablaDisponibilidad');
        if (!tbody) return;

        tbody.innerHTML = '';

        const allSpaces = [
            ...availability.available.map(s => ({...s, status: 'disponible'})),
            ...availability.picoPlaca.map(s => ({...s, status: 'pico-placa'})),
            ...availability.occupied.map(s => ({...s, status: 'ocupado'}))
        ];

        if (allSpaces.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        No hay espacios para mostrar
                    </td>
                </tr>
            `;
            return;
        }

        allSpaces.forEach(space => {
            const row = document.createElement('tr');
            
            const employeeName = space.empleado ? space.empleado.nombre : 'Sin asignar';
            const statusClass = `status-${space.status}`;
            const actionButton = space.status === 'pico-placa' ? 
                `<button class="btn btn-secondary" onclick="assignmentManager.reassignPicoPlacaSpace(${space.id})" title="Reasignar temporalmente">↻ Reasignar</button>` :
                space.status === 'disponible' ? 
                `<button class="btn btn-primary" onclick="assignmentManager.quickAssign(${space.id})" title="Asignación rápida">➕ Asignar</button>` :
                '';

            row.innerHTML = `
                <td>${space.numero}</td>
                <td>Sótano ${space.sotano}</td>
                <td>${space.tipo}</td>
                <td><span class="${statusClass}">${space.status}</span></td>
                <td>${employeeName}</td>
                <td>${space.motivo}</td>
                <td>${actionButton}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderTodayAvailability(availability) {
        const tbody = document.getElementById('disponibilidadHoy');
        if (!tbody) return;

        tbody.innerHTML = '';

        const todaySpaces = [...availability.available, ...availability.picoPlaca];
        
        if (todaySpaces.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        No hay parqueaderos disponibles hoy
                    </td>
                </tr>
            `;
            return;
        }

        todaySpaces.forEach(space => {
            const row = document.createElement('tr');
            const employeeName = space.empleado ? space.empleado.nombre : 'Sin asignar';
            const statusClass = space.empleado ? 'status-pico-placa' : 'status-disponible';
            
            row.innerHTML = `
                <td>${space.numero}</td>
                <td>Sótano ${space.sotano}</td>
                <td>${space.tipo}</td>
                <td><span class="${statusClass}">Disponible</span></td>
                <td>${employeeName}</td>
                <td>${space.motivo}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderAssignments() {
        const tbody = document.getElementById('tablaAsignaciones');
        if (!tbody) return;

        tbody.innerHTML = '';

        const activeAssignments = this.assignments.filter(a => a.activa);
        
        if (activeAssignments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">
                        No hay asignaciones activas
                    </td>
                </tr>
            `;
            return;
        }

        activeAssignments.forEach(assignment => {
            const row = document.createElement('tr');
            
            const employee = this.employees.find(emp => emp.id === assignment.empleadoId);
            const parkingSpace = this.parkingSpaces.find(space => space.id === assignment.parqueaderoId);
            
            const employeeName = employee ? employee.nombre : 'Empleado no encontrado';
            const parkingNumber = parkingSpace ? parkingSpace.numero : 'Parqueadero no encontrado';
            const basement = parkingSpace ? parkingSpace.sotano : '-';
            const type = parkingSpace ? parkingSpace.tipo : '-';
            
            const todayStatus = employee && isTodayPicoPlaca(employee.placa) ? 
                '<span class="status-pico-placa">Pico y Placa</span>' : 
                '<span class="status-disponible">Disponible</span>';

            row.innerHTML = `
                <td>${employeeName}</td>
                <td>${parkingNumber}</td>
                <td>Sótano ${basement}</td>
                <td>${type}</td>
                <td>${assignment.fechaInicio}</td>
                <td>${assignment.fechaFin || 'Indefinida'}</td>
                <td>${todayStatus}</td>
                <td>
                    <button class="btn btn-danger" onclick="assignmentManager.endAssignment(${assignment.id})" 
                            title="Terminar asignación">
                        🔚 Terminar
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    async quickAssign(parkingSpaceId) {
        const availableEmployees = this.employees.filter(emp => {
            return !this.assignments.some(a => a.empleadoId === emp.id && a.activa);
        });

        const parkingSpace = this.parkingSpaces.find(space => space.id === parkingSpaceId);
        const compatibleEmployees = availableEmployees.filter(emp => 
            emp.tipoVehiculo === parkingSpace.tipo
        );

        if (compatibleEmployees.length === 0) {
            showAlert('No hay empleados compatibles disponibles', ALERT_TYPES.WARNING);
            return;
        }

        // For simplicity, assign to first compatible employee
        // In a real implementation, you might show a selection dialog
        const employee = compatibleEmployees[0];
        
        try {
            await this.createAssignment({
                empleadoId: employee.id,
                parqueaderoId: parkingSpaceId,
                fechaInicio: getCurrentDate(),
                fechaFin: null
            });

            showAlert(`Parqueadero ${parkingSpace.numero} asignado a ${employee.nombre}`, ALERT_TYPES.SUCCESS);
            
        } catch (error) {
            console.error('Error in quick assignment:', error);
            showAlert('Error en asignación rápida', ALERT_TYPES.DANGER);
        }
    }

    async reassignPicoPlacaSpace(parkingSpaceId) {
        const space = this.parkingSpaces.find(s => s.id === parkingSpaceId);
        if (!space) return;

        const availableEmployees = this.employees.filter(emp => {
            // Find employees without assignments and compatible vehicle type
            const hasAssignment = this.assignments.some(a => a.empleadoId === emp.id && a.activa);
            const isCompatible = emp.tipoVehiculo === space.tipo;
            const notPicoPlacaToday = !isTodayPicoPlaca(emp.placa);
            
            return !hasAssignment && isCompatible && notPicoPlacaToday;
        });

        if (availableEmployees.length === 0) {
            showAlert('No hay empleados disponibles para reasignación temporal', ALERT_TYPES.WARNING);
            return;
        }

        // Create temporary assignment for today
        const tempEmployee = availableEmployees[0]; // Could show selection dialog
        
        try {
            await this.createAssignment({
                empleadoId: tempEmployee.id,
                parqueaderoId: parkingSpaceId,
                fechaInicio: getCurrentDate(),
                fechaFin: getCurrentDate() // Same day assignment
            });

            showAlert(
                `Parqueadero ${space.numero} reasignado temporalmente a ${tempEmployee.nombre}`, 
                ALERT_TYPES.SUCCESS
            );
            
        } catch (error) {
            console.error('Error in temporary reassignment:', error);
            showAlert('Error en reasignación temporal', ALERT_TYPES.DANGER);
        }
    }

    clearForm() {
        const form = document.getElementById('asignacionForm');
        if (form) {
            form.reset();
            document.getElementById('fechaInicio').value = getCurrentDate();
        }
    }

    onEmployeeAdded(employee) {
        this.employees.push(employee);
        this.updateEmployeeDropdown();
    }

    onEmployeeDeleted(data) {
        this.employees = this.employees.filter(emp => emp.id !== data.id);
        this.updateEmployeeDropdown();
        
        // End any active assignments for this employee
        const employeeAssignments = this.assignments.filter(a => 
            a.empleadoId === data.id && a.activa
        );
        
        employeeAssignments.forEach(assignment => {
            this.endAssignment(assignment.id);
        });
    }

    onParkingSpaceAdded(space) {
        this.parkingSpaces.push(space);
        this.updateParkingDropdown();
    }

    updateEmployeeDropdown() {
        const select = document.getElementById('empleadoAsignacion');
        if (!select) return;

        const availableEmployees = this.employees.filter(emp => {
            return !this.assignments.some(a => a.empleadoId === emp.id && a.activa);
        });

        select.innerHTML = '<option value="">Seleccionar empleado</option>';
        
        availableEmployees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.nombre} - ${employee.placa} (${employee.tipoVehiculo})`;
            select.appendChild(option);
        });
    }

    updateParkingDropdown() {
        const select = document.getElementById('parqueaderoAsignacion');
        if (!select) return;

        const availableSpaces = this.parkingSpaces.filter(space => {
            return space.estado === PARKING_STATUS.DISPONIBLE && 
                   !this.assignments.some(a => a.parqueaderoId === space.id && a.activa);
        });

        select.innerHTML = '<option value="">Seleccionar parqueadero</option>';
        
        availableSpaces.forEach(space => {
            const option = document.createElement('option');
            option.value = space.id;
            option.textContent = `${space.numero} - Sótano ${space.sotano} (${space.tipo})`;
            select.appendChild(option);
        });
    }

    async loadData() {
        try {
            const data = await storageService.loadData();
            this.assignments = data.asignaciones || [];
            this.employees = data.empleados || [];
            this.parkingSpaces = data.parqueaderos || [];
            
            this.renderAssignments();
            this.updateEmployeeDropdown();
            this.updateParkingDropdown();
            this.updateAvailabilityView(getCurrentDate());
            
            console.log(`Loaded ${this.assignments.length} assignments`);
        } catch (error) {
            console.error('Error loading assignment data:', error);
        }
    }

    async saveData() {
        try {
            const data = await storageService.loadData();
            data.asignaciones = this.assignments;
            data.empleados = this.employees;
            data.parqueaderos = this.parkingSpaces;
            await storageService.saveData(data);
        } catch (error) {
            console.error('Error saving assignment data:', error);
            throw error;
        }
    }

    getStatistics() {
        const activeAssignments = this.assignments.filter(a => a.activa);
        const today = getCurrentDate();
        const todayAvailability = calculateDailyAvailability(this.parkingSpaces, this.employees, today);

        return {
            totalAssignments: activeAssignments.length,
            availableToday: todayAvailability.summary.totalAvailable,
            picoPlacaToday: todayAvailability.summary.picoPlacaAvailable,
            occupancyRate: this.parkingSpaces.length > 0 ? 
                Math.round((activeAssignments.length / this.parkingSpaces.length) * 100) : 0
        };
    }
}

const assignmentManager = new AssignmentManager();
window.assignmentManager = assignmentManager;

export default assignmentManager;
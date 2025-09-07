/**
 * API service for future cloud integration
 * Currently uses mock responses, will be updated for real backend
 */

import { APP_CONFIG } from '../utils/constants.js';

class APIService {
    constructor() {
        this.baseURL = APP_CONFIG.API_BASE_URL;
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
    }

    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Network connection restored');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Network connection lost');
        });
    }

    /**
     * Generic fetch wrapper with error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async fetchWithErrorHandling(endpoint, options = {}) {
        if (!this.isOnline) {
            throw new Error('No network connection available');
        }

        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Employee API methods
    async getEmployees() {
        try {
            return await this.fetchWithErrorHandling('/employees');
        } catch (error) {
            // Mock response for development
            console.warn('Using mock employee data');
            return [];
        }
    }

    async createEmployee(employeeData) {
        try {
            return await this.fetchWithErrorHandling('/employees', {
                method: 'POST',
                body: JSON.stringify(employeeData)
            });
        } catch (error) {
            // Mock response
            console.warn('Mock employee creation');
            return { success: true, id: Date.now() };
        }
    }

    async updateEmployee(id, employeeData) {
        try {
            return await this.fetchWithErrorHandling(`/employees/${id}`, {
                method: 'PUT',
                body: JSON.stringify(employeeData)
            });
        } catch (error) {
            console.warn('Mock employee update');
            return { success: true };
        }
    }

    async deleteEmployee(id) {
        try {
            return await this.fetchWithErrorHandling(`/employees/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn('Mock employee deletion');
            return { success: true };
        }
    }

    // Parking API methods
    async getParkingSpaces() {
        try {
            return await this.fetchWithErrorHandling('/parking-spaces');
        } catch (error) {
            console.warn('Using mock parking data');
            return [];
        }
    }

    async createParkingSpace(parkingData) {
        try {
            return await this.fetchWithErrorHandling('/parking-spaces', {
                method: 'POST',
                body: JSON.stringify(parkingData)
            });
        } catch (error) {
            console.warn('Mock parking space creation');
            return { success: true, id: Date.now() };
        }
    }

    async updateParkingSpace(id, parkingData) {
        try {
            return await this.fetchWithErrorHandling(`/parking-spaces/${id}`, {
                method: 'PUT',
                body: JSON.stringify(parkingData)
            });
        } catch (error) {
            console.warn('Mock parking space update');
            return { success: true };
        }
    }

    async deleteParkingSpace(id) {
        try {
            return await this.fetchWithErrorHandling(`/parking-spaces/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn('Mock parking space deletion');
            return { success: true };
        }
    }

    // Assignment API methods
    async getAssignments() {
        try {
            return await this.fetchWithErrorHandling('/assignments');
        } catch (error) {
            console.warn('Using mock assignment data');
            return [];
        }
    }

    async createAssignment(assignmentData) {
        try {
            return await this.fetchWithErrorHandling('/assignments', {
                method: 'POST',
                body: JSON.stringify(assignmentData)
            });
        } catch (error) {
            console.warn('Mock assignment creation');
            return { success: true, id: Date.now() };
        }
    }

    async updateAssignment(id, assignmentData) {
        try {
            return await this.fetchWithErrorHandling(`/assignments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(assignmentData)
            });
        } catch (error) {
            console.warn('Mock assignment update');
            return { success: true };
        }
    }

    async deleteAssignment(id) {
        try {
            return await this.fetchWithErrorHandling(`/assignments/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn('Mock assignment deletion');
            return { success: true };
        }
    }

    // Analytics API methods
    async getDashboardStats() {
        try {
            return await this.fetchWithErrorHandling('/analytics/dashboard');
        } catch (error) {
            console.warn('Using mock dashboard stats');
            return {
                totalSpaces: 0,
                availableSpaces: 0,
                occupiedSpaces: 0,
                picoPlacaSpaces: 0
            };
        }
    }

    async getAvailabilityByDate(date, filters = {}) {
        try {
            const queryParams = new URLSearchParams({
                date,
                ...filters
            });
            return await this.fetchWithErrorHandling(`/analytics/availability?${queryParams}`);
        } catch (error) {
            console.warn('Using mock availability data');
            return {
                available: [],
                occupied: [],
                picoPlaca: []
            };
        }
    }

    // Bulk operations
    async bulkCreateParkingSpaces(spacesData) {
        try {
            return await this.fetchWithErrorHandling('/parking-spaces/bulk', {
                method: 'POST',
                body: JSON.stringify({ spaces: spacesData })
            });
        } catch (error) {
            console.warn('Mock bulk parking creation');
            return { success: true, created: spacesData.length };
        }
    }

    async autoAssignParkingSpaces() {
        try {
            return await this.fetchWithErrorHandling('/assignments/auto-assign', {
                method: 'POST'
            });
        } catch (error) {
            console.warn('Mock auto-assignment');
            return { success: true, assigned: 0 };
        }
    }

    // Utility methods
    async healthCheck() {
        try {
            const response = await this.fetchWithErrorHandling('/health');
            return response.status === 'ok';
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if API is available
     * @returns {Promise<boolean>} API availability
     */
    async isAPIAvailable() {
        try {
            return await this.healthCheck();
        } catch (error) {
            return false;
        }
    }

    /**
     * Sync local data with server
     * @param {Object} localData - Local data to sync
     * @returns {Promise<Object>} Sync result
     */
    async syncData(localData) {
        try {
            return await this.fetchWithErrorHandling('/sync', {
                method: 'POST',
                body: JSON.stringify(localData)
            });
        } catch (error) {
            console.warn('Data sync failed, using local data');
            return { success: false, useLocal: true };
        }
    }

    /**
     * Upload backup file
     * @param {File} file - Backup file to upload
     * @returns {Promise<Object>} Upload result
     */
    async uploadBackup(file) {
        try {
            const formData = new FormData();
            formData.append('backup', file);

            return await fetch(`${this.baseURL}/backup/upload`, {
                method: 'POST',
                body: formData
            }).then(response => response.json());
        } catch (error) {
            console.error('Backup upload failed:', error);
            throw error;
        }
    }

    /**
     * Download backup file
     * @returns {Promise<Blob>} Backup file
     */
    async downloadBackup() {
        try {
            const response = await fetch(`${this.baseURL}/backup/download`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('Backup download failed:', error);
            throw error;
        }
    }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;
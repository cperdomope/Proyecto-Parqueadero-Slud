/**
 * Data storage service
 * Handles local storage and prepares for future API integration
 */

import { APP_CONFIG } from '../utils/constants.js';

class StorageService {
    constructor() {
        this.storageKey = APP_CONFIG.STORAGE_KEY;
        this.useAPI = false; // Set to true when backend is available
    }

    /**
     * Save data to storage
     * @param {Object} data - Data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveData(data) {
        try {
            if (this.useAPI) {
                return await this.saveToAPI(data);
            } else {
                return this.saveToLocalStorage(data);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    /**
     * Load data from storage
     * @returns {Promise<Object>} Loaded data
     */
    async loadData() {
        try {
            if (this.useAPI) {
                return await this.loadFromAPI();
            } else {
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            return this.getDefaultData();
        }
    }

    /**
     * Save to localStorage
     * @param {Object} data - Data to save
     * @returns {boolean} Success status
     */
    saveToLocalStorage(data) {
        try {
            const serializedData = JSON.stringify({
                ...data,
                version: APP_CONFIG.VERSION,
                lastUpdated: new Date().toISOString()
            });
            localStorage.setItem(this.storageKey, serializedData);
            console.log('Data saved to localStorage successfully');
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Load from localStorage
     * @returns {Object} Loaded data
     */
    loadFromLocalStorage() {
        try {
            const serializedData = localStorage.getItem(this.storageKey);
            if (!serializedData) {
                console.log('No data found in localStorage, using default data');
                return this.getDefaultData();
            }

            const data = JSON.parse(serializedData);
            console.log('Data loaded from localStorage successfully');
            return data;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return this.getDefaultData();
        }
    }

    /**
     * Save to API (future implementation)
     * @param {Object} data - Data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveToAPI(data) {
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Data saved to API successfully');
            return true;
        } catch (error) {
            console.error('Error saving to API:', error);
            // Fallback to localStorage if API fails
            return this.saveToLocalStorage(data);
        }
    }

    /**
     * Load from API (future implementation)
     * @returns {Promise<Object>} Loaded data
     */
    async loadFromAPI() {
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}/data`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Data loaded from API successfully');
            return data;
        } catch (error) {
            console.error('Error loading from API:', error);
            // Fallback to localStorage if API fails
            return this.loadFromLocalStorage();
        }
    }

    /**
     * Get default empty data structure
     * @returns {Object} Default data
     */
    getDefaultData() {
        return {
            empleados: [],
            parqueaderos: [],
            asignaciones: [],
            version: APP_CONFIG.VERSION,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Clear all data
     * @returns {Promise<boolean>} Success status
     */
    async clearData() {
        try {
            if (this.useAPI) {
                // API implementation for clearing data
                const response = await fetch(`${APP_CONFIG.API_BASE_URL}/data`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            
            localStorage.removeItem(this.storageKey);
            console.log('Data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Export data as JSON file
     * @param {Object} data - Data to export
     * @returns {boolean} Success status
     */
    exportData(data) {
        try {
            const exportData = {
                ...data,
                exportedAt: new Date().toISOString(),
                version: APP_CONFIG.VERSION
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `parqueadero-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('Data exported successfully');
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    /**
     * Import data from JSON file
     * @param {File} file - File to import
     * @returns {Promise<Object|null>} Imported data or null if failed
     */
    async importData(file) {
        try {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Validate data structure
                        if (!this.validateImportData(data)) {
                            reject(new Error('Invalid data format'));
                            return;
                        }
                        
                        console.log('Data imported successfully');
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Error reading file'));
                reader.readAsText(file);
            });
        } catch (error) {
            console.error('Error importing data:', error);
            return null;
        }
    }

    /**
     * Validate imported data structure
     * @param {Object} data - Data to validate
     * @returns {boolean} Is valid
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['empleados', 'parqueaderos', 'asignaciones'];
        return requiredFields.every(field => Array.isArray(data[field]));
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage stats
     */
    getStorageStats() {
        try {
            const data = this.loadFromLocalStorage();
            return {
                employees: data.empleados?.length || 0,
                parkingSpaces: data.parqueaderos?.length || 0,
                assignments: data.asignaciones?.length || 0,
                storageSize: new Blob([JSON.stringify(data)]).size,
                lastUpdated: data.lastUpdated,
                version: data.version
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }

    /**
     * Enable/disable API usage
     * @param {boolean} useAPI - Whether to use API
     */
    setAPIMode(useAPI) {
        this.useAPI = useAPI;
        console.log(`API mode ${useAPI ? 'enabled' : 'disabled'}`);
    }
}

// Create singleton instance
const storageService = new StorageService();
export default storageService;
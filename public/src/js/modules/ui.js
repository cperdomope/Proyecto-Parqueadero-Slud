/**
 * UI utilities and common functions
 */

import { ALERT_TYPES } from '../utils/constants.js';

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showAlert(message, type = ALERT_TYPES.INFO, duration = 5000) {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()" 
                style="float: right; background: none; border: none; font-size: 1.2em; cursor: pointer; padding: 0; margin-left: 10px;">
            ×
        </button>
    `;

    container.appendChild(alert);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, duration);
    }

    return alert;
}

/**
 * Show loading state on element
 * @param {HTMLElement} element - Element to show loading on
 * @param {boolean} loading - Loading state
 */
export function setLoadingState(element, loading = true) {
    if (!element) return;

    if (loading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @returns {boolean} User confirmation
 */
export function showConfirmDialog(message, title = 'Confirmar') {
    return confirm(`${title}\n\n${message}`);
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'COP') {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format number with thousands separator
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

/**
 * Create table with data
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions
 * @param {HTMLElement} container - Container element
 */
export function createTable(data, columns, container) {
    if (!container) return;

    const table = document.createElement('table');
    table.className = 'data-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        if (column.width) th.style.width = column.width;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    
    if (data.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = columns.length;
        emptyCell.textContent = 'No hay datos disponibles';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '20px';
        emptyCell.style.color = '#666';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    } else {
        data.forEach(item => {
            const row = document.createElement('tr');
            
            columns.forEach(column => {
                const td = document.createElement('td');
                
                if (column.render) {
                    td.innerHTML = column.render(item[column.key], item);
                } else {
                    td.textContent = item[column.key] || '';
                }
                
                if (column.align) td.style.textAlign = column.align;
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
    }
    
    table.appendChild(tbody);
    
    // Clear container and add table
    container.innerHTML = '';
    
    // Add wrapper for responsive scrolling
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    wrapper.appendChild(table);
    container.appendChild(wrapper);
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} visible - Visibility state
 */
export function toggleVisibility(element, visible) {
    if (!element) return;
    element.style.display = visible ? '' : 'none';
}

/**
 * Animate element
 * @param {HTMLElement} element - Element to animate
 * @param {string} animation - Animation class name
 * @param {number} duration - Animation duration in ms
 */
export function animateElement(element, animation, duration = 300) {
    if (!element) return;

    element.classList.add(animation);
    
    setTimeout(() => {
        element.classList.remove(animation);
    }, duration);
}

/**
 * Scroll to element
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollToElement(element, options = {}) {
    if (!element) return;

    const defaultOptions = {
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
}

/**
 * Download file from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Validate form
 * @param {HTMLFormElement} form - Form to validate
 * @returns {boolean} Is valid
 */
export function validateForm(form) {
    if (!form) return false;

    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

/**
 * Clear form validation errors
 * @param {HTMLFormElement} form - Form to clear
 */
export function clearFormErrors(form) {
    if (!form) return;

    const inputs = form.querySelectorAll('.error');
    inputs.forEach(input => input.classList.remove('error'));
}

/**
 * Setup form validation
 * @param {HTMLFormElement} form - Form to setup
 */
export function setupFormValidation(form) {
    if (!form) return;

    const inputs = form.querySelectorAll('[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('error') && input.value.trim()) {
                input.classList.remove('error');
            }
        });
    });
}

/**
 * Modal utility class
 */
export class Modal {
    constructor(id) {
        this.modal = document.getElementById(id);
        this.overlay = null;
        this.init();
    }

    init() {
        if (!this.modal) return;

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: none;
            z-index: 1000;
        `;

        document.body.appendChild(this.overlay);

        // Setup close handlers
        this.overlay.addEventListener('click', () => this.close());
        
        const closeButtons = this.modal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    show() {
        if (!this.modal || !this.overlay) return;

        this.overlay.style.display = 'flex';
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus first input if available
        const firstInput = this.modal.querySelector('input, textarea, select');
        if (firstInput) firstInput.focus();
    }

    close() {
        if (!this.modal || !this.overlay) return;

        this.overlay.style.display = 'none';
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    isOpen() {
        return this.overlay && this.overlay.style.display !== 'none';
    }
}

/**
 * Tooltip utility
 * @param {HTMLElement} element - Element to add tooltip to
 * @param {string} text - Tooltip text
 * @param {string} position - Tooltip position (top, bottom, left, right)
 */
export function addTooltip(element, text, position = 'top') {
    if (!element) return;

    element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1001;
            pointer-events: none;
            white-space: nowrap;
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 5;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 5;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 5;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 5;
                break;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;

        element._tooltip = tooltip;
    });

    element.addEventListener('mouseleave', () => {
        if (element._tooltip) {
            element._tooltip.remove();
            element._tooltip = null;
        }
    });
}
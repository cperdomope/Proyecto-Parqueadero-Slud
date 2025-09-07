#!/usr/bin/env node

/**
 * Backup script for parking management system
 * Creates backups of application data and optionally the entire project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BackupManager {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.backupDir = path.join(this.projectRoot, 'backups');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    }

    /**
     * Create all types of backups
     */
    async createFullBackup() {
        console.log('🔄 Starting backup process...\n');

        // Ensure backup directory exists
        this.ensureBackupDirectory();

        // Create different types of backups
        await this.backupApplicationData();
        await this.backupSourceCode();
        await this.backupConfiguration();
        await this.createBackupManifest();

        console.log('✅ Backup process completed successfully!\n');
        console.log(`📁 Backups saved to: ${this.backupDir}`);
    }

    /**
     * Ensure backup directory exists
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`📁 Created backup directory: ${this.backupDir}`);
        }
    }

    /**
     * Backup application data (localStorage simulation)
     */
    async backupApplicationData() {
        console.log('💾 Backing up application data...');

        // Create a mock data structure that would be in localStorage
        const mockAppData = {
            empleados: [
                {
                    id: 1,
                    nombre: "Juan Pérez",
                    cedula: "12345678",
                    area: "Sistemas",
                    telefono: "3001234567",
                    placa: "ABC123",
                    tipoVehiculo: "carro",
                    picoPlaca: "lunes",
                    fechaRegistro: "2024-01-15"
                }
            ],
            parqueaderos: [
                {
                    id: 1,
                    numero: "S1-C001",
                    sotano: "-1",
                    tipo: "carro",
                    estado: "disponible",
                    empleadoAsignado: null,
                    fechaCreacion: "2024-01-10"
                }
            ],
            asignaciones: [
                {
                    id: 1,
                    empleadoId: 1,
                    parqueaderoId: 1,
                    fechaInicio: "2024-01-15",
                    fechaFin: null,
                    activa: true,
                    fechaCreacion: "2024-01-15"
                }
            ],
            version: "1.0.0",
            lastUpdated: new Date().toISOString(),
            backupInfo: {
                createdAt: new Date().toISOString(),
                type: "application-data",
                description: "Application data backup including employees, parking spaces, and assignments"
            }
        };

        const dataBackupPath = path.join(this.backupDir, `app-data-${this.timestamp}.json`);
        fs.writeFileSync(dataBackupPath, JSON.stringify(mockAppData, null, 2));
        
        console.log(`  ✅ Application data backed up to: app-data-${this.timestamp}.json`);
    }

    /**
     * Backup source code
     */
    async backupSourceCode() {
        console.log('📝 Backing up source code...');

        const sourceBackupPath = path.join(this.backupDir, `source-code-${this.timestamp}.json`);
        const sourceFiles = {};

        // Define important source files to backup
        const filesToBackup = [
            'public/index.html',
            'src/js/app.js',
            'src/js/modules/employees.js',
            'src/js/modules/parking.js',
            'src/js/modules/ui.js',
            'src/js/services/storage.js',
            'src/js/services/api.js',
            'src/js/utils/constants.js',
            'src/js/utils/helpers.js',
            'src/css/base.css',
            'src/css/components.css',
            'src/css/layout.css',
            'src/css/dashboard.css'
        ];

        filesToBackup.forEach(filePath => {
            const fullPath = path.join(this.projectRoot, filePath);
            if (fs.existsSync(fullPath)) {
                sourceFiles[filePath] = fs.readFileSync(fullPath, 'utf8');
            }
        });

        const sourceBackup = {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            description: "Source code backup",
            files: sourceFiles,
            stats: {
                totalFiles: Object.keys(sourceFiles).length,
                totalSize: JSON.stringify(sourceFiles).length
            }
        };

        fs.writeFileSync(sourceBackupPath, JSON.stringify(sourceBackup, null, 2));
        console.log(`  ✅ Source code backed up to: source-code-${this.timestamp}.json`);
    }

    /**
     * Backup configuration files
     */
    async backupConfiguration() {
        console.log('⚙️ Backing up configuration...');

        const configBackupPath = path.join(this.backupDir, `config-${this.timestamp}.json`);
        const configFiles = {};

        // Configuration files to backup
        const configFilesToBackup = [
            'package.json',
            'README.md',
            'CLAUDE.md'
        ];

        configFilesToBackup.forEach(filePath => {
            const fullPath = path.join(this.projectRoot, filePath);
            if (fs.existsSync(fullPath)) {
                if (filePath.endsWith('.json')) {
                    configFiles[filePath] = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                } else {
                    configFiles[filePath] = fs.readFileSync(fullPath, 'utf8');
                }
            }
        });

        const configBackup = {
            timestamp: new Date().toISOString(),
            description: "Configuration files backup",
            files: configFiles
        };

        fs.writeFileSync(configBackupPath, JSON.stringify(configBackup, null, 2));
        console.log(`  ✅ Configuration backed up to: config-${this.timestamp}.json`);
    }

    /**
     * Create backup manifest
     */
    async createBackupManifest() {
        console.log('📋 Creating backup manifest...');

        const manifestPath = path.join(this.backupDir, `manifest-${this.timestamp}.json`);
        
        // Get file stats
        const backupFiles = fs.readdirSync(this.backupDir)
            .filter(file => file.includes(this.timestamp))
            .map(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime.toISOString(),
                    type: this.getBackupType(file)
                };
            });

        const manifest = {
            backupDate: new Date().toISOString(),
            version: "1.0.0",
            description: "Parking Management System Backup",
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            },
            files: backupFiles,
            summary: {
                totalFiles: backupFiles.length,
                totalSize: backupFiles.reduce((sum, file) => sum + file.size, 0)
            },
            restoreInstructions: [
                "1. Extract backup files to project directory",
                "2. For application data: Import JSON files through the application interface",
                "3. For source code: Replace files in src/ directory",
                "4. For configuration: Update package.json and documentation files",
                "5. Run 'npm install' if package.json was restored",
                "6. Test the application functionality"
            ]
        };

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`  ✅ Backup manifest created: manifest-${this.timestamp}.json`);
    }

    /**
     * Determine backup type from filename
     * @param {string} filename - Backup filename
     * @returns {string} Backup type
     */
    getBackupType(filename) {
        if (filename.includes('app-data')) return 'application-data';
        if (filename.includes('source-code')) return 'source-code';
        if (filename.includes('config')) return 'configuration';
        if (filename.includes('manifest')) return 'manifest';
        return 'unknown';
    }

    /**
     * Clean old backups (keep last 10)
     */
    async cleanOldBackups() {
        console.log('🧹 Cleaning old backups...');

        try {
            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    created: fs.statSync(path.join(this.backupDir, file)).birthtime
                }))
                .sort((a, b) => b.created - a.created);

            // Keep only the 10 most recent manifest files (and their associated backups)
            const manifestFiles = backupFiles.filter(file => file.name.includes('manifest'));
            
            if (manifestFiles.length > 10) {
                const filesToDelete = manifestFiles.slice(10);
                
                filesToDelete.forEach(manifest => {
                    const timestamp = manifest.name.match(/manifest-(\d{4}-\d{2}-\d{2})/)?.[1];
                    if (timestamp) {
                        // Delete all files with this timestamp
                        const relatedFiles = backupFiles.filter(file => 
                            file.name.includes(timestamp)
                        );
                        
                        relatedFiles.forEach(file => {
                            fs.unlinkSync(file.path);
                            console.log(`  🗑️ Deleted old backup: ${file.name}`);
                        });
                    }
                });

                console.log(`  ✅ Cleaned ${filesToDelete.length} old backup sets`);
            } else {
                console.log('  ✅ No old backups to clean');
            }
        } catch (error) {
            console.log(`  ⚠️ Warning: Could not clean old backups: ${error.message}`);
        }
    }

    /**
     * List all available backups
     */
    listBackups() {
        console.log('📋 Available backups:\n');

        if (!fs.existsSync(this.backupDir)) {
            console.log('  No backups found. Directory does not exist.');
            return;
        }

        const manifestFiles = fs.readdirSync(this.backupDir)
            .filter(file => file.startsWith('manifest-') && file.endsWith('.json'))
            .sort()
            .reverse();

        if (manifestFiles.length === 0) {
            console.log('  No backup manifests found.');
            return;
        }

        manifestFiles.forEach((manifestFile, index) => {
            const manifestPath = path.join(this.backupDir, manifestFile);
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                const date = new Date(manifest.backupDate).toLocaleString();
                const size = this.formatBytes(manifest.summary.totalSize);
                
                console.log(`${index + 1}. ${date}`);
                console.log(`   📁 Files: ${manifest.summary.totalFiles}`);
                console.log(`   💾 Size: ${size}`);
                console.log(`   📋 Manifest: ${manifestFile}\n`);
            } catch (error) {
                console.log(`   ❌ Error reading manifest: ${manifestFile}`);
            }
        });
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// CLI interface
if (require.main === module) {
    const backupManager = new BackupManager();
    const args = process.argv.slice(2);

    if (args.includes('--list') || args.includes('-l')) {
        backupManager.listBackups();
    } else if (args.includes('--clean') || args.includes('-c')) {
        backupManager.cleanOldBackups();
    } else {
        // Create full backup
        backupManager.createFullBackup()
            .then(() => backupManager.cleanOldBackups())
            .catch(error => {
                console.error('❌ Backup failed:', error.message);
                process.exit(1);
            });
    }
}

module.exports = BackupManager;
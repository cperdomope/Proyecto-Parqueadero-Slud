#!/usr/bin/env node

/**
 * Validation script for the parking management system
 * Validates code structure, dependencies, and configuration
 */

const fs = require('fs');
const path = require('path');

class ProjectValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.projectRoot = path.resolve(__dirname, '..');
    }

    /**
     * Run all validations
     */
    validate() {
        console.log('🔍 Validating Parking Management System...\n');

        this.validateProjectStructure();
        this.validatePackageJson();
        this.validateHtmlFiles();
        this.validateCssFiles();
        this.validateJsFiles();
        this.validateAssets();

        this.printResults();
    }

    /**
     * Validate project structure
     */
    validateProjectStructure() {
        console.log('📂 Validating project structure...');

        const requiredDirs = [
            'public',
            'src',
            'src/css',
            'src/js',
            'src/js/modules',
            'src/js/services',
            'src/js/utils',
            'src/assets',
            'scripts'
        ];

        const requiredFiles = [
            'public/index.html',
            'src/js/app.js',
            'src/css/base.css',
            'package.json',
            'README.md',
            'CLAUDE.md'
        ];

        // Check directories
        requiredDirs.forEach(dir => {
            const fullPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Missing required directory: ${dir}`);
            }
        });

        // Check files
        requiredFiles.forEach(file => {
            const fullPath = path.join(this.projectRoot, file);
            if (!fs.existsSync(fullPath)) {
                this.errors.push(`Missing required file: ${file}`);
            }
        });

        console.log('  ✅ Project structure validation complete\n');
    }

    /**
     * Validate package.json
     */
    validatePackageJson() {
        console.log('📋 Validating package.json...');

        const packagePath = path.join(this.projectRoot, 'package.json');
        
        if (!fs.existsSync(packagePath)) {
            this.errors.push('package.json not found');
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

            // Check required fields
            const requiredFields = ['name', 'version', 'description', 'scripts'];
            requiredFields.forEach(field => {
                if (!packageJson[field]) {
                    this.errors.push(`package.json missing required field: ${field}`);
                }
            });

            // Check scripts
            const requiredScripts = ['dev', 'start'];
            requiredScripts.forEach(script => {
                if (!packageJson.scripts || !packageJson.scripts[script]) {
                    this.warnings.push(`package.json missing recommended script: ${script}`);
                }
            });

            // Validate version format
            if (packageJson.version && !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
                this.warnings.push('package.json version should follow semantic versioning (x.y.z)');
            }

        } catch (error) {
            this.errors.push(`Invalid JSON in package.json: ${error.message}`);
        }

        console.log('  ✅ package.json validation complete\n');
    }

    /**
     * Validate HTML files
     */
    validateHtmlFiles() {
        console.log('🌐 Validating HTML files...');

        const htmlFiles = this.findFiles('public', '.html');
        
        htmlFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for required meta tags
            if (!content.includes('<meta charset="UTF-8">')) {
                this.warnings.push(`${file}: Missing UTF-8 charset declaration`);
            }
            
            if (!content.includes('<meta name="viewport"')) {
                this.warnings.push(`${file}: Missing viewport meta tag`);
            }

            // Check for CSS links
            const cssLinks = [
                '../src/css/base.css',
                '../src/css/components.css',
                '../src/css/layout.css',
                '../src/css/dashboard.css'
            ];

            cssLinks.forEach(css => {
                if (!content.includes(css)) {
                    this.warnings.push(`${file}: Missing CSS link: ${css}`);
                }
            });

            // Check for main script
            if (!content.includes('../src/js/app.js')) {
                this.errors.push(`${file}: Missing main application script`);
            }
        });

        console.log('  ✅ HTML validation complete\n');
    }

    /**
     * Validate CSS files
     */
    validateCssFiles() {
        console.log('🎨 Validating CSS files...');

        const cssFiles = this.findFiles('src/css', '.css');
        
        cssFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for CSS variables in base.css
            if (file.includes('base.css')) {
                if (!content.includes(':root')) {
                    this.warnings.push(`${file}: Should define CSS custom properties in :root`);
                }
            }

            // Check for basic responsive design
            if (!content.includes('@media')) {
                this.warnings.push(`${file}: Consider adding responsive breakpoints`);
            }

            // Check for potential issues
            if (content.includes('!important')) {
                this.warnings.push(`${file}: Consider avoiding !important declarations`);
            }
        });

        console.log('  ✅ CSS validation complete\n');
    }

    /**
     * Validate JavaScript files
     */
    validateJsFiles() {
        console.log('⚙️ Validating JavaScript files...');

        const jsFiles = this.findFiles('src/js', '.js');
        
        jsFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for ES6 modules
            if (file.includes('modules/') || file.includes('services/') || file.includes('utils/')) {
                if (!content.includes('export')) {
                    this.warnings.push(`${file}: Module should have exports`);
                }
            }

            // Check for JSDoc comments on public functions
            const functionMatches = content.match(/^\s*(?:async\s+)?function\s+\w+|^\s*\w+\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*=>/gm);
            if (functionMatches && functionMatches.length > 0) {
                const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g);
                const jsdocCount = jsdocMatches ? jsdocMatches.length : 0;
                
                if (jsdocCount === 0) {
                    this.warnings.push(`${file}: Consider adding JSDoc comments for functions`);
                }
            }

            // Check for console.log (should be console.error in production)
            if (content.includes('console.log') && !content.includes('console.error')) {
                this.warnings.push(`${file}: Consider using console.error for error logging`);
            }
        });

        console.log('  ✅ JavaScript validation complete\n');
    }

    /**
     * Validate assets
     */
    validateAssets() {
        console.log('🖼️ Validating assets...');

        const assetsDir = path.join(this.projectRoot, 'src/assets');
        
        if (fs.existsSync(assetsDir)) {
            const assetFiles = this.findFiles('src/assets', '*');
            console.log(`  Found ${assetFiles.length} asset files`);
        } else {
            this.warnings.push('Assets directory exists but is empty - consider adding favicon');
        }

        console.log('  ✅ Assets validation complete\n');
    }

    /**
     * Find files with specific extension
     * @param {string} dir - Directory to search
     * @param {string} extension - File extension or * for all
     * @returns {Array} Array of file paths
     */
    findFiles(dir, extension) {
        const fullDir = path.join(this.projectRoot, dir);
        const files = [];

        if (!fs.existsSync(fullDir)) {
            return files;
        }

        const walkDir = (currentPath) => {
            const items = fs.readdirSync(currentPath);
            
            items.forEach(item => {
                const itemPath = path.join(currentPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    walkDir(itemPath);
                } else if (extension === '*' || item.endsWith(extension)) {
                    files.push(itemPath);
                }
            });
        };

        walkDir(fullDir);
        return files;
    }

    /**
     * Print validation results
     */
    printResults() {
        console.log('📊 Validation Results');
        console.log('='.repeat(50));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 All validations passed! Project structure is correct.');
        } else {
            if (this.errors.length > 0) {
                console.log(`\n❌ Errors (${this.errors.length}):`);
                this.errors.forEach(error => console.log(`  • ${error}`));
            }

            if (this.warnings.length > 0) {
                console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
                this.warnings.forEach(warning => console.log(`  • ${warning}`));
            }
        }

        console.log('\n' + '='.repeat(50));
        
        if (this.errors.length > 0) {
            console.log('❌ Validation failed with errors.');
            process.exit(1);
        } else {
            console.log('✅ Validation completed successfully.');
            process.exit(0);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ProjectValidator();
    validator.validate();
}

module.exports = ProjectValidator;
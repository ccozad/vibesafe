import { DetectedTechnologies, detectTechnologies } from '../frameworkDetection';
import { DependencyInfo, DetectedFilesMap, detectPackageManagers, parseDependencies } from '../scanners/dependencies';
import { getFilesToScan } from './fileTraversal';
import path from 'path';
import chalk from 'chalk';

// --- File Traversal (Phase 2.2) ---
export class ScanTarget {
    private directory: string;
    private files : string[];
    private detectedManagers: DetectedFilesMap;
    private dependencies : DependencyInfo[];
    private detectedTech : DetectedTechnologies;

    constructor(directory: string) {
        this.directory = directory;
        this.files = getFilesToScan(directory);
        this.detectedTech = {
            hasFrontend: false,
            hasBackend: false,
            isNextJs: false,
            hasAuth: false,
            hasMiddleware: false,
            hasHttpClient: false,
            hasCors: false,
            hasFileUpload: false,
        };
        this.dependencies = [];
        this.detectedManagers = {};
        this.detectTechnology();
    }

    public getFiles(): string[] {
        return this.files;
    }

    public getFilesMatching(pattern: RegExp): string[] {
        return this.files.filter(f => pattern.test(f));
    }

    public getFilesWithExtesions(extensions: string[]): string[] {
        const targetExtensions = new Set(extensions);
        return this.files.filter(f => targetExtensions.has(path.extname(f).toLowerCase()));
    }

    public hasDependencies(): boolean {
        return this.dependencies.length > 0;
    }

    public getDependencies(): DependencyInfo[] {
        return this.dependencies;
    }

    public getDetectedTech(): DetectedTechnologies {
        return this.detectedTech;
    }

    private detectTechnology() {
        this.detectedManagers = detectPackageManagers(this.files, this.directory);
        this.dependencies = parseDependencies(this.detectedManagers);

        if (this.dependencies.length > 0) {
            console.log(`Parsed ${this.dependencies.length} dependencies.`);
            // --- Detect Technologies (Phase 0 Integration) ---
            const dependencyNames = this.dependencies.map(dep => dep.name);
            this.detectedTech = detectTechnologies(dependencyNames);
            // console.log('Detected Technologies:', detectedTech); // Remove raw log
    
            // --- Log Detected Technologies --- 
            if (this.detectedTech.isNextJs) {
                console.log(chalk.blue('Detected Technology: Next.js (Full-stack framework)'));
            } else {
                // Fallback to generic category logging if not Next.js or if more specific logging is needed later
                const detectedCategories = Object.entries(this.detectedTech)
                    .filter(([, value]) => value) // Filter out isNextJs if already logged, or keep for completeness
                    .map(([key]) => key);
    
                if (detectedCategories.length > 0) {
                    console.log(chalk.blue('Detected Technology Categories:'));
                    detectedCategories.forEach(categoryKey => {
                        if (categoryKey === 'isNextJs') return; // Avoid double logging if we decide to keep it in categories
                        const categoryName = categoryKey
                            .replace('has', '') // Remove 'has' prefix
                            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
                            .trim(); 
                        console.log(chalk.blue(`  - ${categoryName}`));
                    });
                } else {
                    // Optionally log if nothing specific was detected
                    // console.log(chalk.dim('No specific framework/library categories detected based on dependencies.'));
                }
            }
        }
    }
}
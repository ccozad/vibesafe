import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { scanForExposedEndpoints } from "../scanners/endpoints";

export class EndPointVibeCheck implements VibeCheck {
    getName(): string {
        return "endpoint problems";
    }

    getCategory(): string {
        return "Endpoint";
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                // --- Endpoint Scan (Phase 6.3) ---
                // Define file extensions relevant for endpoint checks (JS/TS files)
                const ENDPOINT_SCAN_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
                const filesForEndpointScan = target.getFilesWithExtesions(ENDPOINT_SCAN_EXTENSIONS);
                console.log(`Scanning ${filesForEndpointScan.length} files for potentially exposed endpoints...`);
                const allFindings: any[] = [];
                filesForEndpointScan.forEach(filePath => {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const findings = scanForExposedEndpoints(options.getRootDirectory(), filePath, content, target.getDetectedTech());
                        const relativeFindings = findings.map(f => ({ ...f, file: path.relative(options.getRootDirectory(), f.file) }));
                        allFindings.push(...relativeFindings);
                    } catch (error: any) {
                        // Avoid crashing if a single file fails (e.g., read permission)
                        console.warn(chalk.yellow(`Could not scan ${path.relative(options.getRootDirectory(), filePath)} for endpoints: ${error.message}`));
                    }
                });

                resolve( new VibeCheckResult("Endpoint", allFindings) );
            } catch (error) {
                console.error('Error during upload scan:', error);
                reject(error);
            }
        });
    }
    
}
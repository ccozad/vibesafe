import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { scanForLoggingIssues } from "../scanners/logging";

export class LoggingVibeCheck implements VibeCheck {
    getName(): string {
        return "logging problems";
    }

    getCategory(): string {
        return "Logging";
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                // --- Logging Scan (Phase 6.5) ---
                const ENDPOINT_SCAN_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
                const filesForEndpointScan = target.getFilesWithExtesions(ENDPOINT_SCAN_EXTENSIONS);
                console.log(`Scanning ${filesForEndpointScan.length} files for potential logging issues...`);
                const allFindings: any[] = [];
                filesForEndpointScan.forEach(filePath => {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const findings = scanForLoggingIssues(filePath, content, target.getDetectedTech().hasBackend);
                        const relativeFindings = findings.map(f => ({ ...f, file: path.relative(options.getRootDirectory(), f.file) }));
                        allFindings.push(...relativeFindings);
                    } catch (error: any) {
                        console.warn(chalk.yellow(`Could not scan ${path.relative(options.getRootDirectory(), filePath)} for logging issues: ${error.message}`));
                    }
                });

                resolve( new VibeCheckResult("Logging", allFindings) );
            } catch (error) {
                console.error('Error during logging scan:', error);
                reject(error);
            }
        });
    }
    
}
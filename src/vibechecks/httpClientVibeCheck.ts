import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { scanForHttpClientIssues } from "../scanners/httpClient";
import { VibeCheckCategory } from "./vibeCheckCategory";

export class HttpClientVibeCheck implements VibeCheck {
    getName(): string {
        return "HTTP client problems";
    }

    getCategory(): string {
        return VibeCheckCategory.HttpClients;
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                // --- HTTP Client Scan (Phase 6.4.2) ---
                const ENDPOINT_SCAN_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
                const filesForEndpointScan = target.getFilesWithExtesions(ENDPOINT_SCAN_EXTENSIONS);
                console.log(`Scanning ${filesForEndpointScan.length} files for potential HTTP client issues...`);
                const allFindings: any[] = [];
                filesForEndpointScan.forEach(filePath => {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const findings = scanForHttpClientIssues(filePath, content, target.getDetectedTech().hasBackend);
                        const relativeFindings = findings.map(f => ({ ...f, file: path.relative(options.getRootDirectory(), f.file) }));
                        allFindings.push(...relativeFindings);
                    } catch (error: any) {
                        // Avoid crashing if a single file fails
                        console.warn(chalk.yellow(`Could not scan ${path.relative(options.getRootDirectory(), filePath)} for HTTP client issues: ${error.message}`));
                    }
                });

                resolve( new VibeCheckResult(VibeCheckCategory.HttpClients, allFindings) );
            } catch (error) {
                console.error('Error during HTTP client scan:', error);
                reject(error);
            }
        });
    }
    
}
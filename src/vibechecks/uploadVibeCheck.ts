import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";
import { scanForUnvalidatedUploads } from '../scanners/uploads';

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

export class UploadVibeCheck implements VibeCheck {
    getName(): string {
        return "upload problems";
    }

    getCategory(): string {
        return "Upload";
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                 // --- Upload Scan (Phase 6.2) ---
                // Define file extensions relevant for upload checks
                const UPLOAD_SCAN_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.html'];
                const filesForUploadScan = target.getFilesWithExtesions(UPLOAD_SCAN_EXTENSIONS);
                console.log(`Scanning ${filesForUploadScan.length} files for potential upload issues...`);
                const allFindings: any[] = [];
                filesForUploadScan.forEach(filePath => {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const findings = scanForUnvalidatedUploads(filePath, content, target.getDetectedTech().hasBackend);
                        const relativeFindings = findings.map(f => ({ ...f, file: path.relative(options.getRootDirectory(), f.file) }));
                        allFindings.push(...relativeFindings);
                    } catch (error: any) {
                        // Avoid crashing if a single file fails (e.g., read permission)
                        console.warn(chalk.yellow(`Could not scan ${path.relative(options.getRootDirectory(), filePath)} for uploads: ${error.message}`));
                    }
                });

                resolve( new VibeCheckResult("Upload", allFindings) );
            } catch (error) {
                console.error('Error during upload scan:', error);
                reject(error);
            }
        });
    }
    
}
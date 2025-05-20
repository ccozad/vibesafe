import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";
import { scanFileForSecrets } from '../scanners/secrets';
import path from 'path';
import { VibeCheckCategory } from "./vibeCheckCategory";

export class SecretVibeCheck implements VibeCheck {
    getName(): string {
        return "secrets in the code";
    }

    getCategory(): string {
        return VibeCheckCategory.Secrets;
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                // --- Secrets Scan (Phase 2.1 / 2.3) ---
                console.log(`Scanning ${target.getFiles().length} files for secrets...`);
                const allFindings: any[] = [];
                target.getFiles().forEach(filePath => {
                    const findings = scanFileForSecrets(filePath);
                    const relativeFindings = findings.map(f => ({ ...f, file: path.relative(options.getRootDirectory(), f.file) }));
                    allFindings.push(...relativeFindings);
                });
                resolve( new VibeCheckResult(VibeCheckCategory.Secrets, allFindings) );
            } catch (error) {
                console.error('Error during secret scan:', error);
                reject(error);
            }
        });
    }
    
}
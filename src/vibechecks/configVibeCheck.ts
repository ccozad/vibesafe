import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";
import { scanConfigFile} from '../scanners/configuration';
import path from 'path';
import { VibeCheckCategory } from "./vibeCheckCategory";

export class ConfigVibeCheck implements VibeCheck {
    getName(): string {
        return "configuration problems";
    }

    getCategory(): string {
        return VibeCheckCategory.Configuration;
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                // --- Configuration Scan (Phase 6.1) ---
                const configFiles = target.getFilesMatching(/\.config\.(json|ya?ml)$/i);
                const allFindings: any[] = [];
                console.log(`Scanning ${configFiles.length} potential config files...`);
                configFiles.forEach(filePath => {
                    const findings = scanConfigFile(filePath);
                    const relativeFindings = findings.map(f => ({ ...f, file: path.relative(options.getRootDirectory(), f.file) }));
                    allFindings.push(...relativeFindings);
                });
                resolve( new VibeCheckResult(VibeCheckCategory.Configuration, allFindings) );
            } catch (error) {
                console.error('Error during config scan:', error);
                reject(error);
            }
        });
    }
    
}
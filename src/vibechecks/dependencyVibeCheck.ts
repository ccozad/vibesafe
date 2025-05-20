import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";

import { lookupCves } from "../scanners/dependencies";
import { VibeCheckCategory } from "./vibeCheckCategory";

export class DependencyVibeCheck implements VibeCheck {
    getName(): string {
        return "dependency vulnerabilities";
    }

    getCategory(): string {
        return VibeCheckCategory.Dependencies;
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return target.hasDependencies()
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise(async (resolve, reject) => {
            try {
                // --- Dependency CVE Lookup (Phase 3.3 & 3.4) ---
                const allFindings: any[] = [];

                const allDependencyFindings = await lookupCves(target.getDependencies());
                const vulnCount = allDependencyFindings.reduce((count, dep) => count + dep.vulnerabilities.length, 0);
                const highOrCriticalVulnCount = allDependencyFindings.filter(dep => dep.maxSeverity === 'High' || dep.maxSeverity === 'Critical').length;
                console.log(`CVE lookup complete. Found ${vulnCount} vulnerabilities (${highOrCriticalVulnCount} High/Critical) across dependencies.`);

                resolve( new VibeCheckResult(VibeCheckCategory.Dependencies, allFindings) );
            } catch (error) {
                console.error('Error during dependency scan:', error);
                reject(error);
            }
        });
    }
    
}
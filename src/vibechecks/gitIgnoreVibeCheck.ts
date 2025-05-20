import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";
import { checkGitignoreStatus } from "../utils/fileTraversal";
import { VibeCheckCategory } from "./vibeCheckCategory";

export class GitIgnoreVibeCheck implements VibeCheck {
    getName(): string {
        return "Git ignore issues";
    }

    getCategory(): string {
        return VibeCheckCategory.GitIgnore;
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                // --- Secrets Scan (Phase 2.1 / 2.3) ---
                console.log(`Scanning ${target.getFiles().length} files for secrets...`);
                const gitignoreWarnings = checkGitignoreStatus(options.getRootDirectory());
                resolve( new VibeCheckResult(VibeCheckCategory.GitIgnore, gitignoreWarnings) );
            } catch (error) {
                console.error('Error during GIT ignore scan:', error);
                reject(error);
            }
        });
    }
    
}
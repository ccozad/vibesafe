import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheck } from "./vibeCheck";
import { VibeCheckResult } from "./vibeCheckResult";

import chalk from 'chalk';
import { checkRateLimitHeuristic } from "../scanners/rateLimiting";

export class RateLimitVibeCheck implements VibeCheck {
    getName(): string {
        return "missing rate limits";
    }

    getCategory(): string {
        return "Rate Limit";
    }
    
    isRequired(options: ScanOptions, target: ScanTarget): boolean {
        return true; // Always run this check
    }
    
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult> {
        return new Promise((resolve, reject) => {
            try {
                
                // --- Rate Limit Heuristic Check (Phase 6.4 - Revised) ---
                const ENDPOINT_SCAN_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
                const filesForEndpointScan = target.getFilesWithExtesions(ENDPOINT_SCAN_EXTENSIONS);
                console.log('Checking for presence of known rate limiting packages and API routes...');
                const allFindings: any[] = [];
                // Pass all parsed dependencies, files, and detected tech context
                const relativeFindings = checkRateLimitHeuristic(target.getDependencies(), filesForEndpointScan, target.getDetectedTech());
                allFindings.push(...relativeFindings);

                if (relativeFindings.length > 0) {
                    console.log(chalk.yellow('Found API routes but no known rate-limiting package in dependencies. Added project-level advisory.'));
                } else {
                    console.log('Rate limiting check passed (either known package found or no routes detected).');
                }

                resolve( new VibeCheckResult("Rate Limit", allFindings) );
            } catch (error) {
                console.error('Error during rate limit scan:', error);
                reject(error);
            }
        });
    }
    
}
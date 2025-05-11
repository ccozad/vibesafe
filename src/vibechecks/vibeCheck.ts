import { ScanOptions } from "../utils/scanOptions";
import { ScanTarget } from "../utils/scanTarget";
import { VibeCheckResult } from "./vibeCheckResult";

export interface VibeCheck {
    getName(): string;
    getCategory(): string;
    isRequired(options: ScanOptions, target: ScanTarget): boolean;
    run(options: ScanOptions, target: ScanTarget): Promise<VibeCheckResult>;
}
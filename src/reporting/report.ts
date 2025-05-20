import { ReportResults } from "./reportResults";

export interface Report {
    generate(results: any): Promise<ReportResults>;
}
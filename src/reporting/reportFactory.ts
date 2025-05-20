import { ScanOptions } from "../utils/scanOptions";
import { ConsoleReport } from "./consoleReport";
import { ConsoleSummaryReport } from "./consoleSummaryReport";
import { Report } from "./report";

export class ReportFactory {
    public static createFromOptions(options: ScanOptions): Report {
        return ReportFactory.create('console');
    }

    public static create(format: string): Report {
        switch (format) {
            case 'console':
                return new ConsoleReport();
            case 'console-summary':
                return new ConsoleSummaryReport();
            default:
                throw new Error(`Unsupported report format: ${format}`);
        }
    }
}
import path from 'path';

export class ScanOptions {
    public directory: string;
    public highOnly: boolean;
    public output: string | null;
    public report: string | null;
    private rootDirectory: string;
    private reportPath: string | null;

    constructor(directory: string, options: any) {
        this.directory = directory;
        this.rootDirectory = path.resolve(directory);
        console.log(`Scanning directory: ${this.rootDirectory}`);
        
        this.highOnly = options.highOnly || false;
        if (options.highOnly) {
            console.log('(--high-only flag detected)');
        }

        this.output = options.output || null;
        if (options.output) {
            console.log(`JSON output will be written to: ${options.output}`);
        }

        this.report = options.report || null;
        this.reportPath = null; // Initialize reportPath to null
        if (options.report) { // Check if -r or --report was used
            if (typeof options.report === 'string') {
                // User provided a specific filename
                this.reportPath = path.resolve(options.report);
                console.log(`Markdown report will be written to: ${this.reportPath}`);
            } else {
                // User used the flag without a filename, use default
                this.reportPath = path.join(this.rootDirectory, 'VIBESAFE-REPORT.md');
                console.log(`Markdown report will be written to default location: ${this.reportPath}`);
            }
        }
    }

    public getRootDirectory(): string {
        return this.rootDirectory;
    }

    public getReportPath(): string | null {
        return this.reportPath;
    }
}
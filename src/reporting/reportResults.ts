export class ReportResults {
    public format: string;
    public success: boolean;
    public filePath: string;
    public error: string | null;

    constructor(format: string, success: boolean, filePath: string, error: string | null = null) {
        this.format = format;
        this.success = success;
        this.filePath = filePath;
        this.error = error;
    }
}
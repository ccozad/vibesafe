export class VibeCheckResult {
    public category: string;
    public findings: any[];

    constructor(category: string, findings: any[]) {
        this.category = category;
        this.findings = findings;
    }
}


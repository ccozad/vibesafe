import chalk from 'chalk';
import { Report } from './report';
import { ReportResults } from './reportResults';
import { VibeCheckCategory } from '../vibechecks/vibeCheckCategory';

// Helper for sorting console output - Add Info level
function severityToSortOrder(severity: string): number {
    switch (severity) {
        case 'Critical': return 0;
        case 'High': return 1;
        case 'Medium': return 2;
        case 'Low': return 3;
        case 'None': return 4;
        case 'Info': return 5;
        default: return 6;
    }
}

// Helper for coloring severities
function colorSeverity(severity: string): string {
    switch (severity) {
        case 'Critical': return chalk.red.bold(severity);
        case 'High': return chalk.red(severity);
        case 'Medium': return chalk.yellow(severity);
        case 'Low': return chalk.blue(severity);
        case 'None': return chalk.gray(severity);
        default: return severity;
    }
}

export class ConsoleReport implements Report {
    public suppressConsole: boolean;

    constructor(supressConsole: boolean = false) {
        this.suppressConsole = supressConsole;
    }

    generate(results: any): Promise<ReportResults> {
        return new Promise((resolve, reject) => {
            const reportSecretFindings = results[VibeCheckCategory.Secrets] || [];
            const reportDependencyFindings = results[VibeCheckCategory.Dependencies] || [];
            const reportConfigFindings = results[VibeCheckCategory.Configuration] || [];
            const reportUploadFindings = results[VibeCheckCategory.Uploads] || [];
            const reportEndpointFindings = results[VibeCheckCategory.Endpoints] || [];
            const reportLoggingFindings = results[VibeCheckCategory.Logging] || [];
            const reportHttpClientFindings = results[VibeCheckCategory.HttpClients] || [];
            const reportRateLimitFindings = results[VibeCheckCategory.RateLimitAdvisory] || [];
            const infoSecretFindings = results[VibeCheckCategory.Secrets] || [];
            const gitignoreWarnings = results[VibeCheckCategory.GitIgnore] || [];

            if (!this.suppressConsole) {
                // Gitignore Warnings
                if (gitignoreWarnings.length > 0) {
                    console.log(chalk.yellow.bold('\n⚠️ Configuration Warnings:'));
                    gitignoreWarnings.forEach((warning: any) => {
                        console.log(`  ❓ ${warning.message}`);
                    });
                }
                // Info Secrets (.env)
                if (infoSecretFindings.length > 0) {
                    console.log(chalk.cyan.bold('\nInfo:'));
                    // Get unique .env files found
                    const envFiles = [...new Set(infoSecretFindings.map((f:any) => f.file))];
                    envFiles.forEach(file => {
                        console.log(`  - Found potential secrets in ${chalk.cyan(file)}. Ensure this file is in .gitignore and not committed to version control.`);
                    });
                }
        
                // Combine all reportable (filtered) findings
                const allReportFindings = [
                    ...reportSecretFindings,
                    ...reportDependencyFindings,
                    ...reportConfigFindings,
                    ...reportUploadFindings,
                    ...reportEndpointFindings,
                    ...reportRateLimitFindings,
                    ...reportLoggingFindings, 
                    ...reportHttpClientFindings
                ];
        
                if (allReportFindings.length > 0) {
                    const severityOrder = severityToSortOrder; 
                    const sortedFindings = allReportFindings.sort((a: any, b: any) => {
                        const severityDiff = severityOrder(a.severity) - severityOrder(b.severity);
                        if (severityDiff !== 0) return severityDiff;
                        // Ensure 'file' property exists for sorting
                        const fileA = a.file || (a.packageName ? `${a.packageName}@${a.version}` : 'N/A');
                        const fileB = b.file || (b.packageName ? `${b.packageName}@${b.version}` : 'N/A');
                        return fileA.localeCompare(fileB);
                    });
        
                    const groupedFindings: { [key: string]: any[] } = {};
                    sortedFindings.forEach((f: any) => { 
                        let typeKey = 'Other Issues Found'; // Default key
        
                        // ---- Grouping Logic - Revised for Specificity ----
                        const findingType = f.type || ''; // Get the type, default to empty string
        
                        if (findingType.startsWith('Potential Unsanitized Error') || findingType === 'Potential PII Logging') {
                            typeKey = 'Potential Logging Issues Found';
                        } else if ('name' in f && 'version' in f && 'packageManager' in f) { // Dependencies still check properties
                            typeKey = 'Dependencies with Issues Found';
                        } else if (findingType === 'Potential Missing Timeout') { // HTTP Client uses type
                            typeKey = 'Potential HTTP Client Issues Found';
                        } else if (findingType === 'Potentially Exposed Debug/Admin Endpoint') { // Endpoints use type
                            typeKey = 'Potentially Exposed Endpoints Found';
                        } else if (findingType === 'Missing Upload Size Limit' || findingType === 'Missing Upload File Filter' || findingType === 'Generic File Upload Pattern') { // Uploads use type
                            typeKey = 'Potential Upload Issues Found';
                        } else if (findingType === 'Permissive CORS' || findingType === 'Insecure Setting') { // Config uses type
                            typeKey = 'Configuration Issues Found';
                        } else if (findingType === 'Project-Level Rate Limit Advisory') { // Explicit Rate Limit type
                            // Keep it under 'Other Issues Found' for now as per sectionOrder, but could be its own section
                            typeKey = 'Other Issues Found'; 
                        } else if ('pattern' in f && f.severity !== 'Info' || findingType.includes('API Key') || findingType.includes('Entropy')) { 
                            // Secrets: Check for pattern OR specific types if they exist
                            // Note: SecretFinding structure might need standardization with a `type` field
                            typeKey = 'Potential Secrets Found';
                        }
                        // If none of the above match, it defaults to 'Other Issues Found'
        
                        if (!groupedFindings[typeKey]) groupedFindings[typeKey] = [];
                        // Still avoid adding .env info secrets to the main grouped findings 
                        if (!(typeKey === 'Potential Secrets Found' && f.severity === 'Info')) {
                                groupedFindings[typeKey].push(f);
                        }
                    });
        
                    // Define the desired order of sections (keep Other as last)
                    const sectionOrder = [
                        'Potential Secrets Found',
                        'Dependencies with Issues Found',
                        'Configuration Issues Found',
                        'Potential Upload Issues Found',
                        'Potentially Exposed Endpoints Found',
                        'Potential Logging Issues Found',
                        'Potential HTTP Client Issues Found',
                        'Other Issues Found'
                    ];
        
                    // Print findings grouped by type
                    sectionOrder.forEach(sectionTitle => {
                        if (groupedFindings[sectionTitle] && groupedFindings[sectionTitle].length > 0) {
                            console.log(chalk.bold(`\n${sectionTitle}:`));
                            groupedFindings[sectionTitle].forEach(finding => {
                                // ---- Revised Print Logic (Matching Grouping Order) ----
                                if (finding.type === 'Potential Unsanitized Error Logging' || finding.type === 'Potential PII Logging') {
                                    // Add file/line for PII, keep simpler format for generic error logging
                                    if (finding.type === 'Potential PII Logging') {
                                        console.log(`  - [${colorSeverity(finding.severity)}] ${finding.message} in ${chalk.cyan(finding.file)}:${chalk.yellow(String(finding.line))}`); 
                                    } else { // Potential Unsanitized Error Logging
                                        // Now also include file/line for unsanitized error logging
                                        console.log(`  - [${colorSeverity(finding.severity)}] ${finding.message} in ${chalk.cyan(finding.file)}:${chalk.yellow(String(finding.line))}`); 
                                    }
                                    console.log(chalk.dim(`    > ${finding.details}`)); 
                                } else if ('name' in finding && 'version' in finding && 'packageManager' in finding) { 
                                    const issues = finding.vulnerabilities?.length > 0 
                                        ? `${finding.vulnerabilities.length} vulnerabilities (${finding.vulnerabilities.map((v: any) => v.id).slice(0, 3).join(', ')}...)`
                                        : finding.error || 'No known vulnerabilities or error checking OSV';
                                        const depSeverity = finding.maxSeverity || (finding.error ? 'Medium' : 'None'); 
                                    console.log(`  - [${colorSeverity(depSeverity)}] ${chalk.magenta(finding.name)}@${chalk.gray(finding.version)}: ${issues}`);
                                } else if ('pattern' in finding) { // Secrets 
                                        console.log(`  - [${colorSeverity(finding.severity)}] ${finding.type} in ${chalk.cyan(finding.file)}:${chalk.yellow(String(finding.line))}`);
                                    } else if (finding.type === 'Potential Missing Timeout' && 'library' in finding) { 
                                    console.log(`  - [${colorSeverity(finding.severity)}] ${finding.type} (${finding.library}) in ${chalk.cyan(finding.file)}:${chalk.yellow(String(finding.line))}`);
                                    console.log(chalk.dim(`    > ${finding.message}`));
                                        if (finding.details) {
                                            console.log(chalk.dim(`      ${finding.details}`));
                                        }
                                } else if (finding.type === 'Potentially Exposed Debug/Admin Endpoint' || 'path' in finding) { 
                                    console.log(`  - [${colorSeverity(finding.severity)}] ${finding.message} in ${chalk.cyan(finding.file)}:${chalk.yellow(String(finding.line))}`);
                                    console.log(chalk.dim(`    > Path: ${chalk.magenta(finding.path)} - ${finding.details}`));
                                } else if (finding.type === 'Missing Upload Size Limit' || finding.type === 'Missing Upload File Filter' || finding.type === 'Generic File Upload Pattern' || 'patternType' in finding) { 
                                    console.log(`  - [${colorSeverity(finding.severity)}] ${finding.message} in ${chalk.cyan(finding.file)}:${chalk.yellow(String(finding.line))}`);
                                    console.log(chalk.dim(`    > ${finding.details}`));
                                } else if (finding.type === 'Permissive CORS' || finding.type === 'Insecure Setting' || 'key' in finding) { 
                                    console.log(`  - [${colorSeverity(finding.severity)}] ${finding.description || finding.type}: ${chalk.cyan(finding.file)} - Key: ${chalk.magenta(finding.key)}, Value: ${chalk.yellow(JSON.stringify(finding.value))}`);
                                    console.log(chalk.dim(`    > ${finding.message}`));
                                } else { // Fallback for Other Issues Found
                                    // Special handling for our Project-Level Rate Limit Advisory
                                    if (finding.type === 'Project-Level Rate Limit Advisory') {
                                        console.log(`  - [${colorSeverity(finding.severity)}] ${finding.message}`);
                                        console.log(chalk.dim(`    > Suggestion: ${finding.details}`)); 
                                    } else {
                                        // Generic fallback formatting for truly other/unknown issues
                                        const severity = finding.severity || 'Unknown';
                                        const message = finding.message || 'No message available';
                                        const file = finding.file || 'N/A';
                                        const line = finding.line ? `:${chalk.yellow(String(finding.line))}` : '';
                                        const type = finding.type ? `(${finding.type}) ` : '';
                                        console.log(`  - [${colorSeverity(severity)}] ${type}Issue detected in ${chalk.cyan(file)}${line}`);
                                        console.log(chalk.dim(`    > ${message}`));
                                        // Optionally add details if present
                                        if (finding.details) {
                                            console.log(chalk.dim(`    > Details: ${finding.details}`));
                                        }
                                    }
                                }
                            });
                        }
                    });
                } else {
                    // All Clear! Print positive message.
                    console.log(chalk.green.bold('\n✅ No significant issues found! Keep up the good vibes! 😎'));
                }
        
            } else {
                // Combine ALL findings (before filtering) to check if *any* exist
                const anyFindingsExist = 
                    reportSecretFindings.length > 0 || 
                    reportDependencyFindings.length > 0 || 
                    reportConfigFindings.length > 0 || 
                    reportUploadFindings.length > 0 || 
                    reportEndpointFindings.length > 0 || 
                    reportRateLimitFindings.length > 0 || 
                    reportLoggingFindings.length > 0 || 
                    reportHttpClientFindings.length > 0;
        
                // Message indicating suppression only if findings exist
                if (anyFindingsExist) {
                        console.log(chalk.dim('\n(Console output suppressed due to report/output file generation.)'));
                }
            }
            
            const format = 'console';
            const success = true;
            const filePath = '';
            const error = null;

            const reportResults = new ReportResults(format, success, filePath, error);
            resolve(reportResults);
        })
    }

}
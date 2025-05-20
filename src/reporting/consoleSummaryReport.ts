import chalk from 'chalk';
import { Report } from './report';
import { ReportResults } from './reportResults';
import { VibeCheckCategory } from '../vibechecks/vibeCheckCategory';

export class ConsoleSummaryReport implements Report {
    public suppressConsole: boolean;

    constructor(suppressConsole: boolean = false) {
        this.suppressConsole = suppressConsole;
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

            //console.log(results);
            console.log(chalk.bold('\n--- Scan Summary ---'));
            const summaryPoints = [
                { emoji: '🔑', label: 'Secrets', count: reportSecretFindings.length },
                { emoji: '📦', label: 'Dependencies', count: reportDependencyFindings.length },
                { emoji: '⚙️', label: 'Configuration', count: reportConfigFindings.length },
                { emoji: '⬆️', label: 'Uploads', count: reportUploadFindings.length },
                { emoji: '🔌', label: 'Endpoints', count: reportEndpointFindings.length },
                { emoji: '📝', label: 'Logging', count: reportLoggingFindings.length }, 
                { emoji: '🌐', label: 'HTTP Clients', count: reportHttpClientFindings.length },
                { emoji: '⏳', label: 'Rate Limit Advisory', count: reportRateLimitFindings.length }, // Will be 0 or 1
                { emoji: '💡', label: 'Info (.env)', count: infoSecretFindings.length },
                { emoji: '⚠️', label: 'Config Warnings', count: gitignoreWarnings.length },
            ];
                // Calculate padding for alignment
            let maxLabelWidth = 0;
            summaryPoints.forEach(point => {
                if (point.count > 0) {
                    const labelWidth = point.label.length; // Emoji width can vary, focus on label
                    if (labelWidth > maxLabelWidth) {
                        maxLabelWidth = labelWidth;
                    }
                }
            });
            const firstColWidth = maxLabelWidth + 4; // emoji + space + label + space buffer

            summaryPoints.forEach(point => {
                if (point.count > 0) {
                    const labelPart = `${point.emoji} ${point.label}`;
                    console.log(`  ${labelPart.padEnd(firstColWidth)} ${chalk.yellow(point.count)}`);
                } else {
                    // Optionally hide sections with 0 findings, or show them dimmed
                    // console.log(chalk.dim(`  ${point.emoji} ${point.label}: 0`));
                }
            });

            const totalReported = summaryPoints.reduce((sum, point) => sum + point.count, 0);
            if (totalReported > 0) {
                console.log(chalk.cyan('\nPlease scroll up to review the detailed findings.'));
            } else if (!this.suppressConsole) {
                // If no findings were reported and console wasn't suppressed, reiterate the all-clear message
                console.log(chalk.green.bold('✅ No issues found in the scan.'));
            }

            const format = 'console-summary';
            const success = true;
            const filePath = '';
            const error = null;
                    
            const reportResults = new ReportResults(format, success, filePath, error);        
            resolve(reportResults);
        })
    }
}
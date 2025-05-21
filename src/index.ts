#!/usr/bin/env node

// Load environment variables from .env file
import 'dotenv/config';

import { Command } from 'commander';
import { ReportFactory } from './reporting/reportFactory';
import { ReportResults } from './reporting/reportResults';

import { SecretFinding } from './scanners/secrets';
import { DependencyFinding, FindingSeverity } from './scanners/dependencies';
import { GitignoreWarning } from './utils/fileTraversal';
import { generateMarkdownReport } from './reporting/markdown';

import fs from 'fs';
import chalk from 'chalk';
import { ScanOptions } from './utils/scanOptions'
import { ScanTarget } from './utils/scanTarget';
import { ConfigFinding } from './scanners/configuration';
import { UploadFinding } from './scanners/uploads';
import { EndpointFinding } from './scanners/endpoints';
import { RateLimitFinding } from './scanners/rateLimiting';
import { LoggingFinding } from './scanners/logging';
import { HttpClientFinding } from './scanners/httpClient';
import { createAllVibeChecks } from './vibechecks/createAllVibeChecks';

// --- VibeSafe Installer Imports ---
import { fetchPackageMetadata, fetchPackageDownloads } from './installer/npmRegistryClient';
import { checkPackageAge, HeuristicWarning, checkDownloadVolume, checkReadmePresence, checkLicensePresence, checkRepositoryPresence } from './installer/heuristicChecks';
import readline from 'readline'; // Added for user input
import { spawn } from 'child_process'; // Added for spawning npm
import { VibeCheckResult } from './vibechecks/vibeCheckResult';
// We will add more imports from './installer/*' here as we build out features

// Define a combined finding type if needed later

function saveResults(storage: any, result: VibeCheckResult) {
    // Save the result to the storage
    if (!storage[result.category]) {
        storage[result.category] = [];
    }
    storage[result.category].push(...result.findings);
}

function printReportResults(results: ReportResults) {
    // Print a message to the console if the report did not succeed
    if (!results.success) {
        console.error(chalk.red(`\nFailed to generate report: ${results.error}`));
    } else {
        // If the report has a path, print the path
        if (results.filePath) {
            console.log(chalk.green(`\nReport generated successfully at ${results.filePath}`));
        }
    }
}

const program = new Command();

program
  .name('vibesafe')
  .description('A CLI tool to scan your codebase for security vibes.')
  .version('0.0.1');

program.command('scan')
  .description('Scan a directory for potential security issues.')
  .argument('[directory]', 'Directory to scan', '.')
  .option('-o, --output <file>', 'Specify JSON output file path (e.g., report.json)')
  .option('-r, --report [file]', 'Specify Markdown report file path (defaults to VIBESAFE-REPORT.md)')
  .option('--high-only', 'Only report high severity issues')
  .action(async (directory, options) => {
    const storage: any = {}; // Temporary storage for findings
    const scanOptions = new ScanOptions(directory, options);
    const scanTarget = new ScanTarget(scanOptions.getRootDirectory());
 
    const allVibeChecks = createAllVibeChecks();

    for(let i = 0; i < allVibeChecks.length; i++) {
        const vibeCheck = allVibeChecks[i];
        if (vibeCheck.isRequired(scanOptions, scanTarget)) {
            const result = await vibeCheck.run(scanOptions, scanTarget);
            saveResults(storage, result);
        }
    }

    // Use this when the move is complete
    //const report = ReportFactory.createFromOptions(scanOptions);
    const report = ReportFactory.create('console');
    const summary = ReportFactory.create('console-summary');
    await report.generate(storage);
    await summary.generate(storage);

    // Notes
    // We have a number of different type specific findings
    // Findings are filtered based on severity
    // Findings are collected into a large object
    // Reports are generated for report types markdown, json and console
    // A summary is printed to the console

    // How I want the code to work:
    // Collect all finding in an object organized by vibCheck category
    // Use composition pattern to create a report
    // Each report type has its own class


    // --- Moved: Check .gitignore Status --- 
    // We will call checkGitignoreStatus later, just declare the variable here
    /*let gitignoreWarnings: GitignoreWarning[] = [];

    // --- Findings Aggregation ---
    let allSecretFindings: SecretFinding[] = [];
    let allDependencyFindings: DependencyFinding[] = [];
    let allConfigFindings: ConfigFinding[] = [];
    let allUploadFindings: UploadFinding[] = [];
    let allEndpointFindings: EndpointFinding[] = [];
    let allRateLimitFindings: RateLimitFinding[] = [];
    let allLoggingFindings: LoggingFinding[] = [];
    let allHttpClientFindings: HttpClientFinding[] = [];*/

    // --- DEBUG: Log counts after collection ---
    // console.log(`[DEBUG] Counts - Secrets: ${allSecretFindings.length}, Dependencies: ${allDependencyFindings.length}, Config: ${allConfigFindings.length}, Uploads: ${allUploadFindings.length}, Endpoints: ${allEndpointFindings.length}, RateLimit: ${allRateLimitFindings.length}, Logging: ${allLoggingFindings.length}, HttpClient: ${allHttpClientFindings.length}`);
    // ----------------------------------------

    // Separate Info findings
    /*const infoSecretFindings = allSecretFindings.filter(f => f.severity === 'Info');
    const standardSecretFindings = allSecretFindings.filter(f => f.severity !== 'Info');

    // --- Filtering & Reporting (Phase 2.3 / 3.4) --- 
    const reportSecretFindings = options.highOnly
      ? standardSecretFindings.filter(f => f.severity === 'High') 
      : standardSecretFindings;
    
    const reportDependencyFindings = options.highOnly
      ? allDependencyFindings.filter(dep => (dep.maxSeverity === 'High' || dep.maxSeverity === 'Critical')) // Exclude errors when highOnly
      : allDependencyFindings.filter(dep => dep.vulnerabilities.length > 0 || dep.error);

    // Filter config findings based on high-only flag if needed (e.g., only High CORS)
    const reportConfigFindings = options.highOnly
      ? allConfigFindings.filter(f => f.severity === 'High' || f.severity === 'Critical')
      : allConfigFindings;

    // Filter upload findings (adjust severity filtering as needed)
    const reportUploadFindings = options.highOnly
      ? allUploadFindings.filter(f => f.severity === 'High' || f.severity === 'Critical' || f.severity === 'Medium') // Example: Include Medium for uploads even with --high-only?
      : allUploadFindings;

    // Filter endpoint findings (e.g., keep Medium+ for high-only)
    const reportEndpointFindings = options.highOnly
        ? allEndpointFindings.filter(f => f.severity === 'High' || f.severity === 'Critical' || f.severity === 'Medium') 
        : allEndpointFindings;

    // Filter rate limit findings (These are 'Low' severity, so they likely won't show with --high-only)
    const reportRateLimitFindings = options.highOnly
        ? [] // Project-level advisory is Low severity, exclude with --high-only
        : allRateLimitFindings;

    // Filter logging findings (update variable names)
    const reportLoggingFindings = options.highOnly
        ? allLoggingFindings.filter(f => f.severity === 'High' || f.severity === 'Critical' || f.severity === 'Medium') // Keep Medium for PII?
        : allLoggingFindings;

    // Filter HTTP client findings (Low severity)
    const reportHttpClientFindings = options.highOnly
        ? allHttpClientFindings.filter(f => f.severity === 'High' || f.severity === 'Critical' || f.severity === 'Medium')
        : allHttpClientFindings;

    // --- NOW Check Gitignore Status --- 
    //gitignoreWarnings = checkGitignoreStatus(scanOptions.getRootDirectory());

    // --- Report Generation (Phase 4) ---
    if (scanOptions.getReportPath()) {
        const reportData = {
            secretFindings: reportSecretFindings,
            dependencyFindings: reportDependencyFindings,
            configFindings: reportConfigFindings,
            uploadFindings: reportUploadFindings,
            endpointFindings: reportEndpointFindings,
            rateLimitFindings: reportRateLimitFindings,
            loggingFindings: reportLoggingFindings,
            httpClientFindings: reportHttpClientFindings,
            gitignoreWarnings: gitignoreWarnings,
            infoSecretFindings: infoSecretFindings
        };
        try {
            const markdownContent = await generateMarkdownReport(reportData);
            fs.writeFileSync(scanOptions.getReportPath() ?? "", markdownContent);
            console.log(chalk.green(`\nMarkdown report generated successfully at ${scanOptions.getReportPath()}`));
        } catch (error: any) {
            console.error(chalk.red(`\nFailed to generate Markdown report: ${error.message}`));
            process.exit(1);
        }
    }

    // --- JSON Output --- 
    if (options.output) {
        const jsonData = {
            secrets: reportSecretFindings,
            dependencies: reportDependencyFindings,
            configuration: reportConfigFindings,
            uploads: reportUploadFindings,
            endpoints: reportEndpointFindings,
            rateLimiting: reportRateLimitFindings,
            logging: reportLoggingFindings,
            httpClients: reportHttpClientFindings,
            info: infoSecretFindings,
            gitignoreWarnings: gitignoreWarnings,
        };
        try {
            fs.writeFileSync(options.output, JSON.stringify(jsonData, null, 2));
            console.log(chalk.green(`\nJSON output written successfully to ${options.output}`));
        } catch (error: any) {
            console.error(chalk.red(`\nFailed to write JSON output: ${error.message}`));
        }
    }
    
    // --- Console Output (Phase 5.1) ---
    const suppressConsole = !!scanOptions.getReportPath() || !!options.output;

    
    
    // --- Exit Code (Phase 1.2 / 5.2) ---
    const hasHighSeverityIssue = 
        reportSecretFindings.some(f => f.severity === 'High' || f.severity === 'Critical') ||
        reportDependencyFindings.some(dep => dep.maxSeverity === 'High' || dep.maxSeverity === 'Critical') ||
        reportConfigFindings.some(f => f.severity === 'High' || f.severity === 'Critical') ||
        reportUploadFindings.some(f => f.severity === 'High' || f.severity === 'Critical') || 
        reportEndpointFindings.some(f => f.severity === 'High' || f.severity === 'Critical') || 
        // Use the correct filtered list name here
        reportLoggingFindings.some(f => f.severity === 'High' || f.severity === 'Critical' || f.severity === 'Medium'); // Consider Medium PII? 
        // Note: RateLimit, HTTPClient currently don't have High/Critical that affect exit code
        

    // --- Final Summary --- 

    if (options.highOnly && hasHighSeverityIssue) {
        console.log(chalk.red.bold('\nScan complete. High severity issues found. Exiting with code 1.'));
        process.exit(1);
    } else {
        console.log('\nScan complete.');
        process.exit(0);
    }*/

  });

program.command('install')
  .alias('i')
  .description('Install a package safely after security checks.')
  .argument('<package>', 'Package to install (e.g., express, lodash@4.17.21)')
  .argument('[npmArgs...]', 'Additional arguments to pass to npm (e.g., --save-dev, --legacy-peer-deps)')
  .option('--yes', 'Automatically answer yes to prompts and run non-interactively')
  .action(async (packageNameArg: string, additionalArgs: string[], options: { yes?: boolean }) => {
    
    const packagesToProcess: string[] = [packageNameArg];
    const npmPassThroughFlags: string[] = [];

    for (const arg of additionalArgs) {
      if (arg.startsWith('-')) {
        npmPassThroughFlags.push(arg);
      } else {
        packagesToProcess.push(arg);
      }
    }

    let overallExitCode = 0;
    let stopAllProcessing = false;

    for (let i = 0; i < packagesToProcess.length; i++) {
      const currentPkgName = packagesToProcess[i];
      console.log(chalk.magenta(`\n[vibesafe] Processing package "${chalk.cyan(currentPkgName)}" (${i + 1} of ${packagesToProcess.length})...`));
      if (npmPassThroughFlags.length > 0) {
        console.log(chalk.dim(`  with npm flags: ${npmPassThroughFlags.join(' ')}`));
      }

      // Flags to manage flow for the current package
      let proceedWithInstallation = false; 
      let installationAbortedManually = false;
      let errorOccurredDuringChecks = false;

      try {
        // Reset for each package, but if it becomes true, we stop all.
        // This logic is largely moved from the original single-package handler
        
        console.log(`[vibesafe] Fetching metadata for \"${chalk.cyan(currentPkgName)}\"...`);
        const metadata = await fetchPackageMetadata(currentPkgName);
        console.log(chalk.green(`[vibesafe] Successfully fetched metadata for \"${chalk.cyan(currentPkgName)}\".`));
        
        if (metadata.time?.created) {
          console.log(`  Created: ${new Date(metadata.time.created).toLocaleDateString()}`);
        }

        // --- Perform Heuristic Checks ---
        const warnings: HeuristicWarning[] = [];

        const ageWarning = checkPackageAge(metadata);
        if (ageWarning) warnings.push(ageWarning);

        const downloadsData = await fetchPackageDownloads(currentPkgName);
        if (downloadsData.error) {
          console.warn(chalk.yellow(`[WARN] Could not fetch download stats for \"${chalk.cyan(currentPkgName)}\": ${downloadsData.error}`));
        } else {
          console.log(`  Downloads (last month): ${downloadsData.downloads !== undefined ? downloadsData.downloads.toLocaleString() : 'N/A'}`);
          const downloadWarning = checkDownloadVolume(currentPkgName, downloadsData);
          if (downloadWarning) warnings.push(downloadWarning);
        }

        const readmeWarning = checkReadmePresence(metadata);
        if (readmeWarning) warnings.push(readmeWarning);

        const licenseWarning = checkLicensePresence(metadata);
        if (licenseWarning) warnings.push(licenseWarning);

        const repoWarning = checkRepositoryPresence(metadata);
        if (repoWarning) warnings.push(repoWarning);

        // --- Process Aggregated Warnings ---
        if (warnings.length === 0) {
          console.log(chalk.green(`[vibesafe] ✔ No heuristic warnings found for \"${chalk.cyan(currentPkgName)}\". Proceeding to installation.`));
          proceedWithInstallation = true;
        } else {
          console.log(chalk.yellow(`[vibesafe] ⚠ Found ${warnings.length} heuristic warning(s) for \"${chalk.cyan(currentPkgName)}\":`));
          warnings.forEach(w => {
            console.warn(chalk.yellow(`  - ${w.message} (Severity: ${w.severity})`));
            if (w.details) {
              let detailsString = typeof w.details === 'string' ? w.details : JSON.stringify(w.details);
              if (w.type === 'PackageAge' && typeof w.details === 'object' && w.details !== null && 'ageInDays' in w.details && 'thresholdDays' in w.details) {
                detailsString = `Published ${Math.floor(w.details.ageInDays)} days ago (threshold: ${w.details.thresholdDays} days)`;
              }
              console.warn(chalk.yellow(`    Details: ${detailsString}`));
            }
          });

          if (options.yes) {
            console.log(chalk.yellow('[vibesafe] --yes flag detected. Proceeding with installation despite warnings.'));
            proceedWithInstallation = true;
          } else if (!process.stdin.isTTY) {
            console.log(chalk.red('[vibesafe] Non-interactive input detected. Aborting installation due to warnings.'));
            console.log(chalk.red('[vibesafe] Use the --yes flag to force installation in non-interactive mode if necessary.'));
            overallExitCode = 1;
            stopAllProcessing = true; // Stop processing further packages
          } else {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const answer = await new Promise<string>(resolve => 
              rl.question(chalk.blueBright(`Are you sure you want to install \"${chalk.cyan(currentPkgName)}\"? [y/N] `), resolve)
            );
            rl.close();
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
              console.log(chalk.green(`[vibesafe] User approved installation for \"${chalk.cyan(currentPkgName)}\".`));
              proceedWithInstallation = true;
            } else {
              console.log(chalk.red(`[vibesafe] User aborted installation for \"${chalk.cyan(currentPkgName)}\".`));
              installationAbortedManually = true;
              overallExitCode = 1;
              stopAllProcessing = true; // Stop processing further packages
            }
          }
        }
      } catch (error: any) {
        console.error(chalk.red(`[vibesafe] Error during security checks for \"${chalk.cyan(currentPkgName)}\": ${error.message}`));
        errorOccurredDuringChecks = true;
        overallExitCode = 1;
        stopAllProcessing = true; // Stop processing further packages
      }

      if (stopAllProcessing) {
        console.log(chalk.red(`[vibesafe] Aborting further package processing due to previous error or user cancellation.`));
        break; // Exit the loop over packages
      }

      if (proceedWithInstallation && !installationAbortedManually && !errorOccurredDuringChecks) {
        console.log(chalk.blue(`[vibesafe] Invoking npm install for \"${chalk.cyan(currentPkgName)}\"` + 
                       `${npmPassThroughFlags.length > 0 ? ` with flags: ${chalk.dim(npmPassThroughFlags.join(' '))}` : chalk.dim(' (no additional flags)')}...`));
        
        const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const installProcess = spawn(npmCommand, ['install', currentPkgName, ...npmPassThroughFlags], { stdio: 'inherit' });

        const npmPromise = new Promise<void>((resolve, reject) => {
          installProcess.on('error', (err) => {
            console.error(chalk.red(`[vibesafe] Failed to start npm process for \"${chalk.cyan(currentPkgName)}\": ${err.message}`));
            overallExitCode = 1;
            stopAllProcessing = true;
            reject(err);
          });

          installProcess.on('close', (code) => {
            if (code === 0) {
              console.log(chalk.green(`[vibesafe] Successfully installed \"${chalk.cyan(currentPkgName)}\".`));
              resolve();
            } else {
              console.error(chalk.red(`[vibesafe] npm install for \"${chalk.cyan(currentPkgName)}\" failed with exit code ${code}.`));
              overallExitCode = 1;
              stopAllProcessing = true; 
              reject(new Error(`npm install failed with code ${code}`));
            }
          });
        });
        
        try {
          await npmPromise;
        } catch (npmError) {
          // Error already logged, overallExitCode and stopAllProcessing are set.
          // Just need to ensure we break the loop if not already handled by stopAllProcessing check.
          if (stopAllProcessing) break;
        }
      } else if (installationAbortedManually || errorOccurredDuringChecks) {
        // Message already logged, overallExitCode and stopAllProcessing are set.
        if (stopAllProcessing) break; 
      }
      // If !proceedWithInstallation due to non-interactive mode with warnings (and no --yes), already handled.

      if (stopAllProcessing && i < packagesToProcess.length -1) { // if we stopped and there were more packages
          console.log(chalk.yellow(`[vibesafe] Remaining packages (${packagesToProcess.length - 1 - i}) were not processed.`));
          break;
      }
    } // end for loop over packages

    if (overallExitCode !== 0) {
      process.exitCode = overallExitCode;
      console.log(chalk.redBright(`[vibesafe] Finished 'install' command with errors or cancellations.`));
    } else if (!stopAllProcessing) {
      console.log(chalk.greenBright(`[vibesafe] Successfully processed all requested packages.`));
    }
    // No explicit process.exit(0) needed, as it's the default if process.exitCode is not set to non-zero.

  });

program.parse(process.argv);

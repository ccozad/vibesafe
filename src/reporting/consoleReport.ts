import { Report } from './report';
import { ReportResults } from './reportResults';

export class ConsoleReport implements Report {
    generate(results: any): Promise<ReportResults> {
        return new Promise((resolve, reject) => {
            const format = 'console';
            const success = true;
            const filePath = '';
            const error = null;

            console.log(results);
            const reportResults = new ReportResults(format, success, filePath, error);
            resolve(reportResults);
        })
    }

}
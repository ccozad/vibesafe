import { getFilesToScan } from './fileTraversal';
import path from 'path';

// --- File Traversal (Phase 2.2) ---
export class ScanTarget {
    private files : string[];

    constructor(directory: string) {
        this.files = getFilesToScan(directory);
    }

    public getFiles(): string[] {
        return this.files;
    }

    public getFilesMatching(pattern: RegExp): string[] {
        return this.files.filter(f => pattern.test(f));
    }

    public getFilesWithExtesions(extensions: string[]): string[] {
        const targetExtensions = new Set(extensions);
        return this.files.filter(f => targetExtensions.has(path.extname(f).toLowerCase()));
    }
}
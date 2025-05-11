import { VibeCheck } from './vibeCheck';
import { SecretVibeCheck } from './secretVibeCheck';
import { ConfigVibeCheck } from './configVibeCheck';
import { UploadVibeCheck } from './uploadVibeCheck';
import { DependencyVibeCheck } from './dependencyVibeCheck';

export function createAllVibeChecks(): VibeCheck[] {
    return [
        new SecretVibeCheck(),
        new DependencyVibeCheck(),
        new ConfigVibeCheck(),
        new UploadVibeCheck(),
        // Add other vibe checks here
    ];
}
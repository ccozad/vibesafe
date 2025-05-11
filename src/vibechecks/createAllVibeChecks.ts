import { VibeCheck } from './vibeCheck';
import { SecretVibeCheck } from './secretVibeCheck';
import { ConfigVibeCheck } from './configVibeCheck';
import { UploadVibeCheck } from './uploadVibeCheck';

export function createAllVibeChecks(): VibeCheck[] {
    return [
        new SecretVibeCheck(),
        new ConfigVibeCheck(),
        new UploadVibeCheck(),
        // Add other vibe checks here
    ];
}
import { VibeCheck } from './vibeCheck';
import { SecretVibeCheck } from './secretVibeCheck';
import { ConfigVibeCheck } from './configVibeCheck';

export function createAllVibeChecks(): VibeCheck[] {
    return [
        new SecretVibeCheck(),
        new ConfigVibeCheck(),
        // Add other vibe checks here
    ];
}
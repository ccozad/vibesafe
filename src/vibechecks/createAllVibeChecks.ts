import { VibeCheck } from './vibeCheck';
import { SecretVibeCheck } from './secretVibeCheck';
import { ConfigVibeCheck } from './configVibeCheck';
import { UploadVibeCheck } from './uploadVibeCheck';
import { DependencyVibeCheck } from './dependencyVibeCheck';
import { EndPointVibeCheck } from './endPointVibeCheck';
import { RateLimitVibeCheck } from './rateLimitVibeCheck';
import { LoggingVibeCheck } from './loggingVibeCheck';
import { HttpClientVibeCheck } from './httpClientVibeCheck';

export function createAllVibeChecks(): VibeCheck[] {
    return [
        new SecretVibeCheck(),
        new DependencyVibeCheck(),
        new ConfigVibeCheck(),
        new UploadVibeCheck(),
        new EndPointVibeCheck(),
        new RateLimitVibeCheck(),
        new LoggingVibeCheck(),
        new HttpClientVibeCheck(),
        // Add other vibe checks here
    ];
}
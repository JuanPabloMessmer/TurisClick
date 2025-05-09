import { ThrottlerGuard } from '@nestjs/throttler';
import { OnModuleInit } from '@nestjs/common';

export class NoInitThrottlerGuard extends ThrottlerGuard implements OnModuleInit {
    async onModuleInit(): Promise<void> {
    }
}

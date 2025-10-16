import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const logger = new Logger('Config');

// Validate required environment variables
const requiredEnvVars: string[] = [
    // Add critical env vars here if needed
];

const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
    logger.warn(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
}

// Export environment variables with types
export const env = {
    // Node Environment
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Server Configuration
    PORT: parseInt(process.env.PORT || '3001', 10),

    // Authentication
    JWT_SECRET: process.env.JWT_SECRET || 'demo-secret-key-for-development',

    // Database Configuration
    DEMO_MODE: process.env.DEMO_MODE === 'true',
    MONGODB_URI_LOCAL: process.env.MONGODB_URI_LOCAL,
    MONGODB_URI: process.env.MONGODB_URI,

    // Computed values
    get IS_PRODUCTION(): boolean {
        return this.NODE_ENV === 'production';
    },

    get IS_DEVELOPMENT(): boolean {
        return this.NODE_ENV === 'development';
    },

    get IS_TEST(): boolean {
        return this.NODE_ENV === 'test';
    },

    get MONGO_URI(): string | undefined {
        return this.DEMO_MODE ? this.MONGODB_URI_LOCAL : this.MONGODB_URI;
    },

    get HAS_MONGO_URI(): boolean {
        return !!this.MONGO_URI;
    },
};

// Log environment status (without showing actual secrets)
export const logEnvStatus = (): void => {
    logger.log('Environment variables loaded', {
        NODE_ENV: env.NODE_ENV,
        PORT: env.PORT,
        DEMO_MODE: env.DEMO_MODE ? 'true ✅' : 'false',
        JWT_SECRET: env.JWT_SECRET ? 'Set ✅' : 'Not set ❌',
        MONGODB_URI_LOCAL: env.MONGODB_URI_LOCAL ? 'Set ✅' : 'Not set ❌',
        MONGODB_URI: env.MONGODB_URI ? 'Set ✅' : 'Not set ❌',
    });
};


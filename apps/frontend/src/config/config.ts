// Frontend configuration file for environment variables
// In Vite, environment variables are accessed via import.meta.env

// Validate required environment variables
const requiredEnvVars: string[] = [
    // Add critical env vars here if needed
];

const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !(import.meta.env as Record<string, unknown>)[envVar]
);

if (missingEnvVars.length > 0) {
    console.warn(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
}

// Export environment variables with types
export const env = {
    // Node Environment (automatically set by Vite)
    MODE: import.meta.env.MODE || 'development',

    // API Configuration
    API_BASE_URL:
        (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001',

    // Mock Mode (for testing)
    MOCK_MODE: (import.meta.env.VITE_MOCK_MODE as string) === 'true',

    // Computed values
    get IS_PRODUCTION(): boolean {
        return this.MODE === 'production';
    },

    get IS_DEVELOPMENT(): boolean {
        return this.MODE === 'development';
    },

    get IS_TEST(): boolean {
        return this.MODE === 'test';
    },
};

// Log environment status
export const logEnvStatus = (): void => {
    console.log('Environment variables loaded', {
        MODE: env.MODE,
        API_BASE_URL: env.API_BASE_URL,
        MOCK_MODE: env.MOCK_MODE ? 'true ✅' : 'false',
    });
};


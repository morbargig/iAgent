import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { env } from '../../config/env';

export interface DatabaseStatus {
    connected: boolean;
    mode: 'demo' | 'production' | 'memory';
    uri?: string;
    database?: string;
    error?: string;
    timestamp: Date;
}

@Injectable()
export class MongoDBConnectionService implements OnModuleInit {
    private static instance: MongoDBConnectionService;
    private readonly logger = new Logger(MongoDBConnectionService.name);
    private connectionStatus: DatabaseStatus = {
        connected: false,
        mode: 'memory',
        timestamp: new Date(),
    };
    private connection: mongoose.Connection | null = null;

    constructor() {
        if (MongoDBConnectionService.instance) {
            return MongoDBConnectionService.instance;
        }

        MongoDBConnectionService.instance = this;
    }

    /**
     * Get the singleton instance
     */
    static getInstance(): MongoDBConnectionService {
        if (!MongoDBConnectionService.instance) {
            MongoDBConnectionService.instance = new MongoDBConnectionService();
        }
        return MongoDBConnectionService.instance;
    }

    /**
     * Initialize connection on module init
     */
    async onModuleInit() {
        await this.connect();
    }

    /**
     * Connect to MongoDB based on environment configuration
     */
    async connect(): Promise<DatabaseStatus> {
        const isDemoMode = env.DEMO_MODE;
        const mongoUri = env.MONGO_URI;

        // Check if URI is provided
        if (!mongoUri) {
            const missingVar = isDemoMode ? 'MONGODB_URI_LOCAL' : 'MONGODB_URI';

            this.logger.warn(
                `⚠️  ${missingVar} not configured. Running in MEMORY MODE.`
            );
            this.logger.warn(
                `📝 Data will be stored in memory and will not persist.`
            );

            this.connectionStatus = {
                connected: false,
                mode: 'memory',
                error: `${missingVar} environment variable is not set`,
                timestamp: new Date(),
            };

            return this.connectionStatus;
        }

        try {
            this.logger.log(
                `🔌 Attempting to connect to MongoDB (${isDemoMode ? 'DEMO' : 'PRODUCTION'} mode)...`
            );

            // Create connection
            this.connection = mongoose.createConnection(mongoUri, {
                serverSelectionTimeoutMS: 5000, // 5 second timeout
                socketTimeoutMS: 45000,
            });

            // Wait for connection to open
            await new Promise<void>((resolve, reject) => {
                if (!this.connection) {
                    reject(new Error('Connection is null'));
                    return;
                }

                this.connection.once('open', () => resolve());
                this.connection.once('error', (err) => reject(err));
            });

            const dbName = this.connection.db?.databaseName || 'unknown';
            const sanitizedUri = this.sanitizeUri(mongoUri);

            this.logger.log(`✅ MongoDB connected successfully!`);
            this.logger.log(`📊 Database: ${dbName}`);
            this.logger.log(`🌐 Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);

            this.connectionStatus = {
                connected: true,
                mode: isDemoMode ? 'demo' : 'production',
                uri: sanitizedUri,
                database: dbName,
                timestamp: new Date(),
            };

            // Set up connection event listeners
            this.setupEventListeners();

            return this.connectionStatus;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(`❌ MongoDB connection failed: ${errorMessage}`);
            this.logger.warn(`⚠️  Falling back to MEMORY MODE`);
            this.logger.warn(`📝 Data will be stored in memory and will not persist.`);

            this.connectionStatus = {
                connected: false,
                mode: 'memory',
                error: errorMessage,
                timestamp: new Date(),
            };

            return this.connectionStatus;
        }
    }

    /**
     * Set up event listeners for connection monitoring
     */
    private setupEventListeners() {
        if (!this.connection) return;

        this.connection.on('connected', () => {
            this.logger.log('📡 MongoDB connection established');
            this.updateConnectionStatus(true);
        });

        this.connection.on('disconnected', () => {
            this.logger.warn('🔌 MongoDB connection lost');
            this.updateConnectionStatus(false, 'Connection lost');
        });

        this.connection.on('reconnected', () => {
            this.logger.log('🔄 MongoDB reconnected');
            this.updateConnectionStatus(true);
        });

        this.connection.on('error', (error) => {
            this.logger.error(`💥 MongoDB connection error: ${error.message}`);
            this.updateConnectionStatus(false, error.message);
        });
    }

    /**
     * Update connection status
     */
    private updateConnectionStatus(connected: boolean, error?: string) {
        this.connectionStatus = {
            ...this.connectionStatus,
            connected,
            error,
            timestamp: new Date(),
        };
    }

    /**
     * Get current connection status
     */
    getStatus(): DatabaseStatus {
        return { ...this.connectionStatus };
    }

    /**
     * Get the mongoose connection instance
     */
    getConnection(): mongoose.Connection | null {
        return this.connection;
    }

    /**
     * Check if currently connected
     */
    isConnected(): boolean {
        return this.connectionStatus.connected &&
            this.connection?.readyState === 1; // 1 = connected
    }

    /**
     * Check if running in memory mode
     */
    isMemoryMode(): boolean {
        return this.connectionStatus.mode === 'memory';
    }

    /**
     * Sanitize URI to hide credentials in logs
     */
    private sanitizeUri(uri: string): string {
        try {
            // Hide password in connection string
            return uri.replace(
                /mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/,
                'mongodb://$1:****@'
            );
        } catch {
            return 'mongodb://***:***@***/***';
        }
    }

    /**
     * Manually disconnect from MongoDB
     */
    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            this.logger.log('🔌 MongoDB connection closed');
            this.updateConnectionStatus(false, 'Connection closed manually');
        }
    }

    /**
     * Manually reconnect to MongoDB
     */
    async reconnect(): Promise<DatabaseStatus> {
        this.logger.log('🔄 Attempting to reconnect to MongoDB...');

        if (this.connection) {
            await this.disconnect();
        }

        return await this.connect();
    }
}


import serverConfig from '../../../config/server.json';

interface LoggerInterface {
    info: (message: any, ...optionalParams: any[]) => void;
    warn: (message: any, ...optionalParams: any[]) => void;
    error: (message: any, ...optionalParams: any[]) => void;
    debug: (message: any, ...optionalParams: any[]) => void;
}

class Logger implements LoggerInterface {
    private isLoggingEnabled(): boolean {
        return serverConfig.logging?.enabled ?? false;
    }

    private shouldLog(level: keyof typeof serverConfig.logging.levels): boolean {
        if (!this.isLoggingEnabled()) return false;
        return serverConfig.logging?.levels?.[level] ?? false;
    }

    info(message: any, ...optionalParams: any[]): void {
        if (this.shouldLog('info')) {
            console.log(message, ...optionalParams);
        }
    }

    warn(message: any, ...optionalParams: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(message, ...optionalParams);
        }
    }

    error(message: any, ...optionalParams: any[]): void {
        if (this.shouldLog('error')) {
            console.error(message, ...optionalParams);
        }
    }

    debug(message: any, ...optionalParams: any[]): void {
        if (this.shouldLog('debug')) {
            console.log('[DEBUG]', message, ...optionalParams);
        }
    }
}

export const logger = new Logger();
import { EventEmitter } from 'events';
const serverConfig: typeof import('../../../config/server.json') = require('../../../config/server.json');

export interface LogEntry {
    ts: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
}

const LOG_BUFFER_SIZE = 200;

class LogBus extends EventEmitter {}
export const logBus = new LogBus();
logBus.setMaxListeners(50);

const logBuffer: LogEntry[] = [];

function record(level: LogEntry['level'], message: any, rest: any[]): LogEntry {
    const parts = [message, ...rest].map(p =>
        typeof p === 'object' ? JSON.stringify(p) : String(p)
    );
    const entry: LogEntry = { ts: new Date().toISOString(), level, message: parts.join(' ') };
    logBuffer.push(entry);
    if (logBuffer.length > LOG_BUFFER_SIZE) logBuffer.shift();
    logBus.emit('entry', entry);
    return entry;
}

export function getLogHistory(): LogEntry[] {
    return [...logBuffer];
}

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
        record('info', message, optionalParams);
        if (this.shouldLog('info')) {
            console.log(message, ...optionalParams);
        }
    }

    warn(message: any, ...optionalParams: any[]): void {
        record('warn', message, optionalParams);
        if (this.shouldLog('warn')) {
            console.warn(message, ...optionalParams);
        }
    }

    error(message: any, ...optionalParams: any[]): void {
        record('error', message, optionalParams);
        if (this.shouldLog('error')) {
            console.error(message, ...optionalParams);
        }
    }

    debug(message: any, ...optionalParams: any[]): void {
        record('debug', message, optionalParams);
        if (this.shouldLog('debug')) {
            console.log('[DEBUG]', message, ...optionalParams);
        }
    }
}

export const logger = new Logger();

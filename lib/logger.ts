/**
 * Logger utility for consistent logging across the application
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(context: LogContext): string {
    const { timestamp, level, message, data, error } = context;
    const baseLog = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      return baseLog + '\n' + JSON.stringify(data, null, 2);
    }
    
    if (error) {
      return baseLog + '\n' + error.stack;
    }
    
    return baseLog;
  }

  error(message: string, data?: Record<string, any> | Error) {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      ...(data instanceof Error ? { error: data } : { data }),
    };
    
    console.error(this.formatLog(context));
  }

  warn(message: string, data?: Record<string, any>) {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
    };
    
    if (this.isDevelopment) {
      console.warn(this.formatLog(context));
    }
  }

  info(message: string, data?: Record<string, any>) {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
    };
    
    if (this.isDevelopment) {
      console.log(this.formatLog(context));
    }
  }

  debug(message: string, data?: Record<string, any>) {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data,
    };
    
    if (this.isDevelopment) {
      console.debug(this.formatLog(context));
    }
  }
}

export const logger = new Logger();
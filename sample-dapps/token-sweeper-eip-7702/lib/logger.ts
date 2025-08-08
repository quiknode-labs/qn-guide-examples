/**
 * Centralized logging utility
 * Provides structured logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    this.formatMessage(level, message, data)
    
    if (this.isDevelopment || level === 'error' || level === 'warn') {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn :
                       console.log

      if (data) {
        logMethod(`[${level.toUpperCase()}] ${message}`, data)
      } else {
        logMethod(`[${level.toUpperCase()}] ${message}`)
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data)
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, data?: unknown): void {
    this.debug(`API ${method}: ${url}`, data)
  }

  apiResponse(method: string, url: string, status: number, data?: unknown): void {
    if (status >= 400) {
      this.error(`API ${method} ${url} failed: ${status}`, data)
    } else {
      this.debug(`API ${method} ${url} success: ${status}`, data)
    }
  }

  apiError(method: string, url: string, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error'
    this.error(`API ${method} ${url} error: ${message}`, error)
  }

  // Swap-specific logging
  swapStart(tokenCount: number): void {
    this.info(`Starting swap for ${tokenCount} tokens`)
  }

  swapSuccess(txHash: string, isAtomic: boolean): void {
    this.info(`Swap successful: ${txHash} (atomic: ${isAtomic})`)
  }

  swapError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown swap error'
    this.error(`Swap failed: ${message}`, error)
  }
}

export const logger = new Logger()
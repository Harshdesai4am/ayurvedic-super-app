type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class LoggerService {
  private isDevelopment = __DEV__;

  public debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  public info(message: string, ...args: any[]) {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  public warn(message: string, ...args: any[]) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }

  public error(message: string, error?: any, ...args: any[]) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...args);
    // Ready for integration with Sentry / Crashlytics in production
  }
}

export const Logger = new LoggerService();

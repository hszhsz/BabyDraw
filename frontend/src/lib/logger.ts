// 服务器端日志配置（仅在Node.js环境中使用）
let serverLogger: any = null;

// 检查是否在Node.js环境中
if (typeof window === 'undefined') {
  try {
    const winston = require('winston');
    const DailyRotateFile = require('winston-daily-rotate-file');
    const path = require('path');
    
    // 日志目录
    const LOG_DIR = path.join(process.cwd(), 'logs');
    
    // 日志格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info: any) => {
        const { timestamp, level, message, stack } = info;
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
      })
    );
    
    // 创建日志器
    serverLogger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: logFormat,
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
        }),
        
        // 错误日志文件（每日轮转）
        new DailyRotateFile({
          filename: path.join(LOG_DIR, 'frontend-error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true
        }),
        
        // 所有日志文件（每日轮转）
        new DailyRotateFile({
          filename: path.join(LOG_DIR, 'frontend-combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true
        })
      ]
    });
  } catch (error) {
    console.warn('Winston logger initialization failed:', error);
  }
}

// 服务器端日志方法
export const log = {
  error: (message: string, meta?: any) => {
    if (serverLogger) {
      serverLogger.error(message, meta);
    } else {
      console.error(`[ERROR] ${message}`, meta);
    }
  },
  warn: (message: string, meta?: any) => {
    if (serverLogger) {
      serverLogger.warn(message, meta);
    } else {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  info: (message: string, meta?: any) => {
    if (serverLogger) {
      serverLogger.info(message, meta);
    } else {
      console.info(`[INFO] ${message}`, meta);
    }
  },
  debug: (message: string, meta?: any) => {
    if (serverLogger) {
      serverLogger.debug(message, meta);
    } else if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};

export default serverLogger;

// 客户端日志（仅在浏览器环境中使用）
export const clientLog = {
  error: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.error(`[ERROR] ${message}`, meta);
      // 可以在这里添加发送到服务器的逻辑
    }
  },
  warn: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  info: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.info(`[INFO] ${message}`, meta);
    }
  },
  debug: (message: string, meta?: any) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__;

function formatMessage(
  level: LogLevel,
  tag: string,
  message: string,
  data?: unknown,
): string {
  const timestamp = new Date().toISOString().slice(11, 23);
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${tag}] ${message}${dataStr}`;
}

export const logger = {
  debug: (tag: string, message: string, data?: unknown) => {
    if (isDev) console.debug(formatMessage('debug', tag, message, data));
  },
  info: (tag: string, message: string, data?: unknown) => {
    if (isDev) console.log(formatMessage('info', tag, message, data));
  },
  warn: (tag: string, message: string, data?: unknown) => {
    if (isDev) console.warn(formatMessage('warn', tag, message, data));
  },
  error: (tag: string, message: string, data?: unknown) => {
    console.error(formatMessage('error', tag, message, data));
  },
};

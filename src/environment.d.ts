declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      BASE_URL?: string;
      MONGODB_URL?: string;
      SESSION_SECRET?: string;
      LOG_FILE?: string;
      LOG_PATH?: string;
      LOG_FILENAME?: string;
      LOG_FORMAT?: string;
      LOG_SIZE?: string;
      LOG_INTERVAL?: string;
      EMAIL_HOST?: string;
      EMAIL_PORT?: string;
      EMAIL_USER?: string;
      EMAIL_PASS?: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};

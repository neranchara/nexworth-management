import pkg from '../../package.json';

export const APP_CONFIG = {
  VERSION: pkg.version,
  STAGE: process.env.NODE_ENV === 'production' ? 'STABLE' : 'DEVELOPMENT',
  SYSTEM_NAME: 'NEXWORTH OPERATIONAL STANDARD',
  get FULL_VERSION_STRING() {
    return `${this.SYSTEM_NAME} — V${this.VERSION}-${this.STAGE}`;
  }
};

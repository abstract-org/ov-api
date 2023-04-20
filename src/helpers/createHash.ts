import * as CryptoJS from 'crypto-js';

export const sha256 = (content: string): string =>
  CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex);

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const secret = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: JWTPayload): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  // @ts-ignore - jsonwebtoken type definitions issue with expiresIn
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, secret) as JWTPayload;
};

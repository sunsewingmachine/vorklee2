import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-change-in-production';
const COOKIE_NAME = 'vorklee2_session';

export interface UserSession {
  userId: string;
  orgId: string;
  email: string;
  role: string;
  appCode?: string;
}

export interface SessionToken extends UserSession {
  exp: number;
  iat: number;
}

/**
 * Generate JWT token for user session
 */
export function generateToken(payload: UserSession, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): SessionToken {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionToken;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get user authentication from session cookie
 * This is the REQUIRED method for all apps (per AppSpecV3 guidelines)
 */
export async function getUserAuth(): Promise<UserSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new Error('Unauthorized: No session token found');
  }

  const session = verifyToken(token);

  return {
    userId: session.userId,
    orgId: session.orgId,
    email: session.email,
    role: session.role,
    appCode: session.appCode,
  };
}

/**
 * Verify session token (for middleware and API routes)
 */
export function verifySession(token: string): UserSession {
  const session = verifyToken(token);
  return {
    userId: session.userId,
    orgId: session.orgId,
    email: session.email,
    role: session.role,
    appCode: session.appCode,
  };
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}


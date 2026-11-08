import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from './db';
import { User, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'admitflow-super-secure-production-key-2026';

export interface TokenPayload {
  userId: string;
  instituteId: string;
  branchId?: string;
  role: UserRole;
  email: string;
  name: string;
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    instituteId: user.instituteId,
    branchId: user.branchId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (e) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('Authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check cookie
    const cookieToken = req.cookies.get('admitflow_token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    // Only in non-production development/test environments if demo header is supplied
    if (process.env.NODE_ENV !== 'production') {
      const demoInst = req.headers.get('x-demo-institute');
      if (demoInst) {
        const demoUser = db.getUsers(demoInst)[0];
        if (demoUser) {
          return {
            userId: demoUser.id,
            instituteId: demoUser.instituteId,
            branchId: demoUser.branchId,
            role: demoUser.role,
            email: demoUser.email,
            name: demoUser.name,
          };
        }
      }
    }
    return null;
  }

  return verifyToken(token);
}

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(userRole);
}

export function isSuperAdmin(authUser: TokenPayload | null): boolean {
  return authUser !== null && authUser.role === 'SUPER_ADMIN';
}

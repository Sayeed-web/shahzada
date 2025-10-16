import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export enum UserRole {
  USER = 'USER',
  SARAF = 'SARAF',
  ADMIN = 'ADMIN'
}

export enum Permission {
  // User permissions
  VIEW_PROFILE = 'VIEW_PROFILE',
  EDIT_PROFILE = 'EDIT_PROFILE',
  VIEW_TRANSACTIONS = 'VIEW_TRANSACTIONS',
  CREATE_TRANSACTION = 'CREATE_TRANSACTION',
  
  // Saraf permissions
  MANAGE_RATES = 'MANAGE_RATES',
  VIEW_SARAF_TRANSACTIONS = 'VIEW_SARAF_TRANSACTIONS',
  MANAGE_BRANCHES = 'MANAGE_BRANCHES',
  VIEW_SARAF_REPORTS = 'VIEW_SARAF_REPORTS',
  
  // Admin permissions
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_SARAFS = 'MANAGE_SARAFS',
  VIEW_ADMIN_REPORTS = 'VIEW_ADMIN_REPORTS',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  MANAGE_CONTENT = 'MANAGE_CONTENT'
}

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTION
  ],
  [UserRole.SARAF]: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTION,
    Permission.MANAGE_RATES,
    Permission.VIEW_SARAF_TRANSACTIONS,
    Permission.MANAGE_BRANCHES,
    Permission.VIEW_SARAF_REPORTS
  ],
  [UserRole.ADMIN]: [
    ...Object.values(Permission)
  ]
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const role = userRole as UserRole
  return rolePermissions[role]?.includes(permission) || false
}

export async function checkPermission(req: NextRequest, permission: Permission): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role) return false
    return hasPermission(session.user.role, permission)
  } catch {
    return false
  }
}

export function requirePermission(permission: Permission) {
  return async (req: NextRequest) => {
    const hasAccess = await checkPermission(req, permission)
    if (!hasAccess) {
      throw new Error('Insufficient permissions')
    }
  }
}
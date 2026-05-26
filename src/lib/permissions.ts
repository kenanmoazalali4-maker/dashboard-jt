import { Permission } from '@/types';

/**
 * Check if a staff member has a specific permission
 */
export function hasPermission(
  staffPermissions: string[] | null | undefined,
  requiredPermission: Permission
): boolean {
  if (!staffPermissions || staffPermissions.length === 0) {
    return false;
  }

  // المسؤول العام has all permissions
  if (staffPermissions.includes(Permission.SUPER_ADMIN)) {
    return true;
  }

  return staffPermissions.includes(requiredPermission);
}

/**
 * Check if a staff member has any of the given permissions
 */
export function hasAnyPermission(
  staffPermissions: string[] | null | undefined,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(perm => hasPermission(staffPermissions, perm));
}

/**
 * Get all effective permissions for a staff member
 */
export function getEffectivePermissions(
  staffPermissions: string[] | null | undefined
): Permission[] {
  if (!staffPermissions || staffPermissions.length === 0) {
    return [];
  }

  if (staffPermissions.includes(Permission.SUPER_ADMIN)) {
    return Object.values(Permission);
  }

  return staffPermissions as Permission[];
}

/**
 * Permission labels in Arabic for the UI
 */
export const PermissionLabels: Record<string, string> = {
  [Permission.VIEW_PLAYERS]: 'عرض اللاعبين',
  [Permission.MANAGE_PLAYERS]: 'إدارة اللاعبين',
  [Permission.KILL_PLAYER]: 'قتل لاعب',
  [Permission.KICK_PLAYER]: 'طرد لاعب',
  [Permission.BAN_PLAYER]: 'حظر لاعب',
  [Permission.UNBAN_PLAYER]: 'رفع حظر لاعب',
  [Permission.VIEW_INVENTORY]: 'عرض المخزن',
  [Permission.MANAGE_VEHICLES]: 'إدارة المركبات',
  [Permission.DELETE_VEHICLE]: 'حذف مركبة',
  [Permission.ADD_VEHICLE]: 'إضافة مركبة',
  [Permission.VIEW_BANS]: 'عرض الحظر',
  [Permission.MANAGE_BANS]: 'إدارة الحظر',
  [Permission.MANAGE_APPLICATIONS]: 'إدارة الطلبات',
  [Permission.MANAGE_STAFF]: 'إدارة الطاقم',
  [Permission.VIEW_SETTINGS]: 'عرض الإعدادات',
  [Permission.MANAGE_SETTINGS]: 'إدارة الإعدادات',
  [Permission.VIEW_AUDIT_LOG]: 'عرض سجل العمليات',
  [Permission.MANAGE_QUEUE]: 'إدارة الطابور',
  [Permission.SUPER_ADMIN]: 'المسؤول العام (جميع الصلاحيات)',
};

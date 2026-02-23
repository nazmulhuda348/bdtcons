import { useAppContext } from '../AppContext';
import { UserRole } from '../types';

export type PermissionAction = 'view' | 'edit' | 'delete' | 'create';

export const usePermissions = () => {
  const { currentUser } = useAppContext();

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isManager = currentUser?.role === UserRole.MANAGER;
  const isGuest = currentUser?.role === UserRole.GUEST;

  // ম্যাজিক ফাংশন: চেকবক্সের পারমিশন চেক করার জন্য (Crash Proof)
  const hasPermission = (permissionKey: string) => {
    if (isAdmin) return true; // এডমিনের বাই-ডিফল্ট সব পারমিশন
    if (!currentUser || !Array.isArray(currentUser.permissions)) return false;
    return currentUser.permissions.includes(permissionKey);
  };

  const isOwner = (ownerId?: string | null): boolean => {
    if (!currentUser || !ownerId) return false;
    return currentUser.id === ownerId;
  };

  const canPerform = (action: PermissionAction, ownerId?: string | null): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true;

    switch (action) {
      case 'view': return isOwner(ownerId);
      case 'edit':
      case 'delete': return isOwner(ownerId);
      case 'create': return isAdmin || isManager;
      default: return false;
    }
  };

  const canEdit = (ownerId?: string | null) => canPerform('edit', ownerId);
  const canDelete = (ownerId?: string | null) => canPerform('delete', ownerId);
  const canView = (ownerId?: string | null) => canPerform('view', ownerId);

  return {
    currentUser,
    role: currentUser?.role,
    isAdmin,
    isManager,
    isGuest,
    isOwner,
    canPerform,
    canEdit,
    canDelete,
    canView,
    hasPermission // এক্সপোর্ট করা হলো
  };
};
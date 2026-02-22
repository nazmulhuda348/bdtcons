
import { useAppContext } from '../AppContext';
import { UserRole } from '../types';

export type PermissionAction = 'view' | 'edit' | 'delete' | 'create';

export const usePermissions = () => {
  const { currentUser } = useAppContext();

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isManager = currentUser?.role === UserRole.MANAGER;
  const isGuest = currentUser?.role === UserRole.GUEST;

  /**
   * Checks if the current user is the owner of a specific resource.
   */
  const isOwner = (ownerId?: string | null): boolean => {
    if (!currentUser || !ownerId) return false;
    return currentUser.id === ownerId;
  };

  /**
   * Universal permission checker.
   * Logic: 
   * - ADMINs have total authority.
   * - Others must be the owner of the resource to perform the action.
   */
  const canPerform = (action: PermissionAction, ownerId?: string | null): boolean => {
    if (!currentUser) return false;
    
    // Admins are exempt from Row-Level Security
    if (isAdmin) return true;

    // For non-admins, ownership is the primary key for authorization
    switch (action) {
      case 'view':
        // Guests might have special project-based view rules (handled in components)
        // but generally can view their own work.
        return isOwner(ownerId);
      case 'edit':
      case 'delete':
        return isOwner(ownerId);
      case 'create':
        // Only Admins and Managers can create certain system-wide entities
        return isAdmin || isManager;
      default:
        return false;
    }
  };

  /**
   * Semantic helpers for cleaner UI code
   */
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
    canView
  };
};

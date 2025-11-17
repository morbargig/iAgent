import type { Permissions } from '../features/auth/api';

export const TOOLS_LIST = [
  { id: "tool-t", nameKey: "tools.tool-t" },
  { id: "tool-h", nameKey: "tools.tool-h" },
  { id: "tool-f", nameKey: "tools.tool-f" },
] as const;

export type ToolId = typeof TOOLS_LIST[number]['id'];

const PERMISSION_KEY_MAP: Record<ToolId, keyof Permissions['permissions']> = {
  'tool-t': 'canUseToolT',
  'tool-h': 'canUseToolH',
  'tool-f': 'canUseToolF',
};

export const filterToolsByPermissions = <T extends { id: ToolId }>(
  toolSchemas: T[],
  permissions?: Permissions
): T[] => {
  if (!permissions?.permissions) {
    return toolSchemas;
  }

  return toolSchemas.filter(tool => {
    const permissionKey = PERMISSION_KEY_MAP[tool.id];
    if (!permissionKey) {
      return true;
    }
    return permissions.permissions[permissionKey] !== false;
  });
};

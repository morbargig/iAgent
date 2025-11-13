import type { ToolSchema } from '../components/ToolSettingsDialog';
import type { Permissions } from '../features/auth/api';

export const TOOLS_LIST = [
  { id: "tool-t", nameKey: "tools.tool-t" },
  { id: "tool-h", nameKey: "tools.tool-h" },
  { id: "tool-f", nameKey: "tools.tool-f" },
] as const;

const PERMISSION_KEY_MAP: Record<string, keyof Permissions['permissions']> = {
  'tool-t': 'canUseToolT',
  'tool-h': 'canUseToolH',
  'tool-f': 'canUseToolF',
};

export const filterToolsByPermissions = (
  toolSchemas: ToolSchema[],
  permissions?: Permissions
): ToolSchema[] => {
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


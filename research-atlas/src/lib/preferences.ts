export type Preferences = {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  motion: 'system' | 'off';
  openTasksOnly: boolean;
  interfaceMode?: 'guided' | 'expert';
};

export const defaultPreferences: Preferences = {
  theme: 'light',
  density: 'comfortable',
  motion: 'system',
  openTasksOnly: false,
  interfaceMode: 'guided',
};

const key = 'atlas-workspace-preferences';

export function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return {
      theme: saved.theme === 'dark' || saved.theme === 'system' ? saved.theme : 'light',
      density: saved.density === 'compact' ? 'compact' : 'comfortable',
      motion: saved.motion === 'off' ? 'off' : 'system',
      openTasksOnly: saved.openTasksOnly === true,
      interfaceMode: saved.interfaceMode === 'expert' ? 'expert' : 'guided',
    };
  } catch {
    return defaultPreferences;
  }
}

export function writePreferences(preferences: Preferences): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

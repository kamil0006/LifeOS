import { api } from './client'

export type BackupStatus = { lastBackupAt: string | null }

export const backupApi = {
  status: () => api<BackupStatus>('/backup/status'),
  export: () => api<Record<string, unknown>>('/backup/export'),
  import: (backup: unknown) =>
    api<{ ok: true }>('/backup/import', {
      method: 'POST',
      body: JSON.stringify(backup),
    }),
}

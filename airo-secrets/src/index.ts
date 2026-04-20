export function getSecret(key: string): string | undefined {
  return process.env[key] || import.meta.env?.[key];
}

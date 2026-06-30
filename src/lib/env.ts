export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

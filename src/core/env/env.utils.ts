function getEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Environment variable ${key} not set`);
  }

  return value;
}

export function getEnvValue(key: string, Enum?: { [id: number]: string }) {
  const value = getEnv(key);

  if (!Enum || Enum?.[value]) {
    return value;
  }

  throw new Error(`Env value ${value} not supported`);
}

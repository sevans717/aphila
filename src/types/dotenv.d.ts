declare module 'dotenv' {
  const config: (opts?: { path?: string }) => { parsed?: Record<string, string> };
  export = { config };
}

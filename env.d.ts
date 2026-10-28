/// <reference types="vite/client" />

declare module 'virtual:tournaments-data' {
  export type Tournament = import('./src/entities/tournament').Tournament
  const data: Record<string, Tournament>
  export = data
}

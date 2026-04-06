// AI latency simulation
export const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const LATENCY = {
  haiku:    () => delay(400 + Math.random() * 200),   // 400–600ms
  sonnet:   () => delay(800 + Math.random() * 400),   // 800–1200ms
  research: () => delay(1500),                         // fixed 1500ms
};

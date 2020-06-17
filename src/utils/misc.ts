let verbosity = false;

export function enableVerbosity(): void {
  verbosity = true;
}

export function log(...messages: any[]): void {
  if (verbosity) {
    console.log(messages);
  }
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

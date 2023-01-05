export type PING_HISTORY = { host: string, alive: boolean, timestamp: Date };
export type FETCH_HISTORY = { url: string, alive: boolean, timestamp: Date };
export type PING_ITEM = { host: string, data:{alive: boolean, timestamp: Date}[] };
export type FETCH_ITEM = { url: string, data:{alive: boolean, timestamp: Date}[] };
export type PING_RESULT = { host: string, ip: string, alive: boolean, downTime: number };
export type FETCH_RESULT = { url: string, status: string, alive: boolean, downTime: number };

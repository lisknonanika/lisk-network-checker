export type PING_HISTORY = { host: string, alive: boolean, timestamp: Date, responsetime: number, downtime: number };
export type FETCH_HISTORY = { url: string, alive: boolean, timestamp: Date, responsetime: number, downtime: number };
export type PING_ITEM = { host: string, data: { alive: boolean, timestamp: Date, responseTime: number, downTime: number }[] };
export type FETCH_ITEM = { url: string, data: { alive: boolean, timestamp: Date, responseTime: number, downTime: number }[] };
export type PING_RESULT = { host: string, ip: string, alive: boolean, checkDate: Date, responseTime: number, downTime: number };
export type FETCH_RESULT = { url: string, status: string, alive: boolean, checkDate: Date, responseTime: number, downTime: number };

import ping from 'ping';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';

import { PING as PING_CONFIG, FETCH as FETCH_CONFIG } from './config.json';

export type PING_DATA = { alive: boolean, timestamp: Date };
export type FETCH_DATA = { alive: boolean, timestamp: Date };
export type PING_HISTORY = { host: string, data: PING_DATA };
export type FETCH_HISTORY = { url: string, data: FETCH_DATA };
export type PING_RESULT = { host: string, ip: string, alive: boolean, downTime: number };
export type FETCH_RESULT = { url: string, status: string, alive: boolean, downTime: number };

export const PingHistory: PING_HISTORY[] = [];
export const FetchHistory: FETCH_HISTORY[] = [];

export const RunPing = async (isCron: boolean) => {
    const result: PING_RESULT[] = [];
    for (let host of PING_CONFIG.hosts) {
        let ip: string = "***.***.***.***";
        let alive: boolean = false;

        try {
            const ret = await ping.promise.probe(host, PING_CONFIG.option);
            if (ret.numeric_host !== undefined && ret.numeric_host !== "NA") ip = ret.numeric_host;
            alive = ret.alive;
        } catch (_err) {
            // none
        }
        result.push({ host: host, ip: ip, alive: alive, downTime: getPingDownTime(host, alive) });
        if (isCron) setPingHistory(host, alive);
    }
    return result;
}

export const RunFetch = async (isCron: boolean) => {
    const result: FETCH_RESULT[] = [];
    for (let url of FETCH_CONFIG.url) {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => { controller.abort(); }, FETCH_CONFIG.timeout);

        let status: string = "***";
        let alive: boolean = false;

        try {
            const response = await fetch(url, { signal: controller.signal });
            status = response.status.toString();
            alive = response.ok;
        } catch (_err) {
            // none
        } finally {
            clearTimeout(fetchTimeout);
        }
        result.push({ url: url, status: status, alive: alive, downTime: getFetchDownTime(url, alive) });
        if (isCron) setFetchHistory(url, alive);
    }
    return result;
}

const setPingHistory = (host: string, alive: boolean) => {
    const findData: PING_HISTORY | undefined = PingHistory.reverse().find(data => data.host === host);
    if (findData !== undefined && findData.data.alive === alive) return;
    PingHistory.push({ host: host, data: { alive: alive, timestamp: new Date() } });
}

const setFetchHistory = (url: string, alive: boolean) => {
    const findData: FETCH_HISTORY | undefined = FetchHistory.reverse().find(data => data.url === url);
    if (findData !== undefined && findData.data.alive === alive) return;
    FetchHistory.push({ url: url, data: { alive: alive, timestamp: new Date() } });
}

const getPingDownTime = (host: string, alive: boolean): number => {
    const findData: PING_HISTORY | undefined = PingHistory.reverse().find(data => data.host === host);
    if (findData === undefined || findData.data.alive || alive) return 0;
    return Math.floor((new Date().getTime() - findData.data.timestamp.getTime()) / 60000);
}

const getFetchDownTime = (url: string, alive: boolean): number => {
    const findData: FETCH_HISTORY | undefined = FetchHistory.reverse().find(data => data.url === url);
    if (findData === undefined || findData.data.alive || alive) return 0;
    return Math.floor((new Date().getTime() - findData.data.timestamp.getTime()) / 60000);
}

import ping from 'ping';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import mysql from 'mysql2/promise';
import { getPingDownTime, getFetchDownTime } from './history';
import { PING_RESULT, FETCH_RESULT } from './type';
import { PING as PING_CONFIG, FETCH as FETCH_CONFIG } from './config.json';

export const RunPing = async (connection: mysql.Connection) => {
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
        result.push({ host: host, ip: ip, alive: alive, downTime: await getPingDownTime(connection, host, alive) });
    }
    return result;
}

export const RunFetch = async (connection: mysql.Connection) => {
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
        result.push({ url: url, status: status, alive: alive, downTime: await getFetchDownTime(connection, url, alive) });
    }
    return result;
}

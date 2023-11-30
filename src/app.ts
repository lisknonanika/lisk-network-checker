import ping from 'ping';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import mysql from 'mysql2/promise';
import { getTime, getPingDownTime, getFetchDownTime } from './history';
import { PING_RESULT, FETCH_RESULT } from './type';
import { PING as PING_CONFIG, FETCH as FETCH_CONFIG } from './config.json';

export const RunPing = async (connection: mysql.Connection) => {
    const result: PING_RESULT[] = [];
    for (let host of PING_CONFIG.hosts) {
        let ip: string = "***.***.***.***";
        let alive: boolean = false;
        let checkDate: Date = new Date();
        let responseDate: Date = checkDate;

        try {
            const ret = await ping.promise.probe(host, PING_CONFIG.option);
            responseDate = new Date();
            if (ret.numeric_host !== undefined && ret.numeric_host !== "NA") ip = ret.numeric_host;
            alive = ret.alive;
        } catch (_err) {
            responseDate = new Date();
        }
        result.push({
            host: host,
            ip: ip,
            alive: alive,
            checkDate: checkDate,
            responseTime: alive? getTime(checkDate, responseDate) : (PING_CONFIG.option.timeout  + 0.001) * 1000,
            downTime: await getPingDownTime(connection, host, alive, checkDate)
        });
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
        let checkDate: Date = new Date();
        let responseDate: Date = checkDate;

        try {
            const response = await fetch(url, { signal: controller.signal });
            responseDate = new Date();
            status = response.status.toString();
            alive = (status === "200");
        } catch (_err) {
            responseDate = new Date();
        } finally {
            clearTimeout(fetchTimeout);
        }
        result.push({
            url: url,
            status: status,
            alive: alive,
            checkDate: checkDate,
            responseTime: alive? getTime(checkDate, responseDate) : ((FETCH_CONFIG.timeout / 1000) + 0.001) * 1000,
            downTime: await getFetchDownTime(connection, url, alive, checkDate)
        });
    }
    return result;
}

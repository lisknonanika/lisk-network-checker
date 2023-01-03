import ping from 'ping';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import { PING as PING_CONFIG, FETCH as FETCH_CONFIG } from './config.json';
    
const RunPing = async() => {
    const result:string[] = [];
    for (let host of PING_CONFIG.HOSTS) {
        try {
            const ret = await ping.promise.probe(host, PING_CONFIG.OPTION);
            result.push(JSON.parse(`{"host":"${host}", "ip":"${ret.numeric_host}", "alive":${ret.alive}}`));
        } catch(_err) {
            result.push(JSON.parse(`{"host":"${host}", "ip":"***.***.***.***", "alive":false}`));
        }
    }
    return result;
}

const RunFetch = async() => {
    const result:string[] = [];
    for (let url of FETCH_CONFIG.URL) {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => { controller.abort();}, FETCH_CONFIG.TIMEOUT);
        try {
            const response = await fetch(url, {signal: controller.signal});
            result.push(JSON.parse(`{"url":"${url}", "status":"${response.status}", "alive":${response.ok}}`));
        } catch (_err) {
            result.push(JSON.parse(`{"url":"${url}", "status":"***", "alive":false}`));
        } finally {
            clearTimeout(fetchTimeout);
        }
    }
    return result;
}

(async() => {
    const pingResult = await RunPing();
    console.log(pingResult);
    const fetchResult = await RunFetch();
    console.log(fetchResult);
})();
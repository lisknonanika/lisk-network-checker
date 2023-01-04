import express from 'express';
import cors from 'cors';

import { RunPing, RunFetch, PingHistory, FetchHistory, PING_DATA, FETCH_DATA } from './app';
import { EXP as EXP_CONFIG, PING as PING_CONFIG, FETCH as FETCH_CONFIG } from './config.json';

const port = EXP_CONFIG.port;
const exp = express();
exp.use(cors({ origin: true, credentials: true }));

exp.get('/', async (_req, _res) => {
    const resultPing = await RunPing(false);
    const resultFetch = await RunFetch(false);
    _res.json({ ping: resultPing, fetch: resultFetch });
});

exp.get('/history', async (_req, _res) => {
    const resultPing: any[] = [];
    for (let host of PING_CONFIG.hosts) {
        const historyData: { host: string, data: PING_DATA[] } = { host: host, data: [] };
        const histories = PingHistory.reverse().filter(data => data.host === host);
        for (let history of histories) historyData.data.push(history.data);
        resultPing.push(historyData);
    }

    const resultFetch: any[] = [];
    for (let url of FETCH_CONFIG.url) {
        const historyData: { url: string, data: FETCH_DATA[] } = { url: url, data: [] };
        const histories = FetchHistory.reverse().filter(data => data.url === url);
        for (let history of histories) historyData.data.push(history.data);
        resultFetch.push(historyData);
    }
    _res.json({ ping: resultPing, fetch: resultFetch });
});

exp.listen(port, () => {
    console.log(`api start -> http://localhost:${port}`);
});

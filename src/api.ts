import express from 'express';
import cors from 'cors';
import { RunPing, RunFetch } from './app';
import { getMysqlConnection, getPingHistory, getFetchHistory } from './history';
import { PING_ITEM, FETCH_ITEM } from './type';
import { EXP as EXP_CONFIG, PING as PING_CONFIG, FETCH as FETCH_CONFIG } from './config.json';

const port = EXP_CONFIG.port;
const exp = express();
exp.use(cors({ origin: true, credentials: true }));

exp.get('/', async (_req, _res) => {
    let connection = undefined;
    try {
        connection = await getMysqlConnection();
        const resultPing = await RunPing(connection);
        const resultFetch = await RunFetch(connection);
        _res.json({ ping: resultPing, fetch: resultFetch });
    } catch (err) {
        console.log(err);
    } finally {
        if (connection) await connection.end();
    }
});

exp.get('/history', async (_req, _res) => {
    let connection = undefined;
    try {
        connection = await getMysqlConnection();
        const limit: number = _req.query.limit && Number.isInteger(+_req.query.limit) ? +_req.query.limit : 0;
        const pingData: any = [];
        for (let host of PING_CONFIG.hosts) {
            const pingHistory = await getPingHistory(connection, host, limit);
            if (pingHistory === undefined) continue;
            const pingItem: PING_ITEM = { host: host, data: [] };
            const datas = pingHistory.filter(data => data.host === host);
            for (let data of datas) pingItem.data.push({ alive: data.alive === 0 ? false : true, timestamp: data.timestamp, responseTime: data.responsetime, downTime: data.downtime });
            pingData.push(pingItem);
        }

        const fetchData: any = [];
        for (let url of FETCH_CONFIG.url) {
            const fetchHistory = await getFetchHistory(connection, url, limit);
            if (fetchHistory === undefined) continue;
            const fetchItem: FETCH_ITEM = { url: url, data: [] };
            const datas = fetchHistory.filter(data => data.url === url);
            for (let data of datas) fetchItem.data.push({ alive: data.alive === 0 ? false : true, timestamp: data.timestamp, responseTime: data.responsetime, downTime: data.downtime });
            fetchData.push(fetchItem);
        }
        _res.json({ ping: pingData, fetch: fetchData });
    } catch (err) {
        console.log(err);
    } finally {
        if (connection) await connection.end();
    }
});

exp.listen(port, () => {
    console.log(`api start -> http://localhost:${port}`);
});

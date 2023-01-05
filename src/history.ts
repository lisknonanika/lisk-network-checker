import mysql from 'mysql2/promise';
import { PING_HISTORY, FETCH_HISTORY, PING_RESULT, FETCH_RESULT } from './type';
import { DB } from './config.json';

export const getMysqlConnection = async (): Promise<mysql.Connection> => {
    const connection = await mysql.createConnection(DB.params);
    await connection.connect();
    return connection;
}

export const getPingHistory = async (connection: mysql.Connection, host: string): Promise<mysql.RowDataPacket[] | undefined> => {
    connection = await getMysqlConnection();
    const query: string = "SELECT * FROM `pinghistory` WHERE `host` = ? ORDER BY `host`, `timestamp` DESC LIMIT ?";
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, [host, DB.limit]);
    return rows.length > 0 ? rows : undefined;
}

export const getFetchHistory = async (connection: mysql.Connection, url: string): Promise<mysql.RowDataPacket[] | undefined> => {
    connection = await getMysqlConnection();
    const query: string = "SELECT * FROM `fetchhistory` WHERE `url` = ? ORDER BY `url`, `timestamp` DESC LIMIT ?";
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, [url, DB.limit]);
    return rows.length > 0 ? rows : undefined;
}

export const getLatestPingHistory = async (connection: mysql.Connection, host: string): Promise<mysql.RowDataPacket | undefined> => {
    const query: string = "SELECT * FROM `pinghistory` WHERE `host` = ? ORDER BY `timestamp` DESC LIMIT 1";
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, [host]);
    return rows.length > 0 ? rows[0] : undefined;
}

export const getLatestFetchHistory = async (connection: mysql.Connection, url: string): Promise<mysql.RowDataPacket | undefined> => {
    const query: string = "SELECT * FROM `fetchhistory` WHERE `url` = ? ORDER BY `timestamp` DESC LIMIT 1";
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, [url]);
    return rows.length > 0 ? rows[0] : undefined;
}

export const setPingHistory = async (connection: mysql.Connection, pingResults: PING_RESULT[]) => {
    for (let result of pingResults) {
        try {
            const pingHistory = await getLatestPingHistory(connection, result.host);
            if (pingHistory && (pingHistory.alive === 0 ? false : true) === result.alive) continue;
            const query: string = "INSERT INTO `pinghistory` SET ?";
            const pingData: PING_HISTORY = { host: result.host, alive: result.alive, timestamp: new Date() };
            await connection.query(query, [pingData]);
            await connection.commit();
        } catch (_err) {
            await connection.rollback();
        }
    }
}

export const setFetchHistory = async (connection: mysql.Connection, fetchResult: FETCH_RESULT[]) => {
    for (let result of fetchResult) {
        try {
            const fetchHistory = await getLatestFetchHistory(connection, result.url);
            if (fetchHistory && (fetchHistory.alive === 0 ? false : true) === result.alive) continue;
            const query: string = "INSERT INTO `fetchhistory` SET ?";
            const pingData: FETCH_HISTORY = { url: result.url, alive: result.alive, timestamp: new Date() };
            await connection.query(query, [pingData]);
            await connection.commit();
        } catch (_err) {
            await connection.rollback();
        }
    }
}

export const getPingDownTime = async (connection: mysql.Connection, host: string, alive: boolean): Promise<number> => {
    const findData = await getLatestPingHistory(connection, host);
    if (findData === undefined || findData.alive || alive) return 0;
    return Math.floor((new Date().getTime() - findData.timestamp.getTime()) / 1000);
}

export const getFetchDownTime = async (connection: mysql.Connection, url: string, alive: boolean): Promise<number> => {
    const findData = await getLatestFetchHistory(connection, url);
    if (findData === undefined || findData.alive || alive) return 0;
    return Math.floor((new Date().getTime() - findData.timestamp.getTime()) / 1000);
}

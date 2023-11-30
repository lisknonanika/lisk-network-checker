import mysql from 'mysql2/promise';
import { PING_HISTORY, FETCH_HISTORY, PING_RESULT, FETCH_RESULT } from './type';
import { DB } from './config.json';

export const getMysqlConnection = async (): Promise<mysql.Connection> => {
    const connection = await mysql.createConnection(DB.params);
    await connection.connect();
    return connection;
}

export const getPingHistory = async (connection: mysql.Connection, host: string, limit: number): Promise<mysql.RowDataPacket[] | undefined> => {
    if (limit <= 0 || limit > 100) limit = DB.limit;
    const query: string = "SELECT * FROM `pinghistory` WHERE `host` = ? ORDER BY `host`, `timestamp` DESC LIMIT ?";
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, [host, limit]);
    return rows.length > 0 ? rows : undefined;
}

export const getFetchHistory = async (connection: mysql.Connection, url: string, limit: number): Promise<mysql.RowDataPacket[] | undefined> => {
    if (limit <= 0 || limit > 100) limit = DB.limit;
    const query: string = "SELECT * FROM `fetchhistory` WHERE `url` = ? ORDER BY `url`, `timestamp` DESC LIMIT ?";
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, [url, limit]);
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
    // DELETE
    try {
        const query: string = "DELETE FROM `pinghistory` WHERE `timestamp` < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        await connection.query(query);
        await connection.commit();
    } catch (_err) {
        console.log("[setPingHistory] DELETE FAILED");
        await connection.rollback();
    }

    // INSERT
    for (let result of pingResults) {
        try {
            const query: string = "INSERT INTO `pinghistory` SET ?";
            const pingData: PING_HISTORY = {
                host: result.host,
                alive: result.alive,
                timestamp: result.checkDate,
                responsetime: result.responseTime,
                downtime: result.downTime
            };
            await connection.query(query, [pingData]);
            await connection.commit();
        } catch (_err) {
            console.log(`[setPingHistory] INSERT FAILED(${result.host})`);
            await connection.rollback();
        }
    }
}

export const setFetchHistory = async (connection: mysql.Connection, fetchResult: FETCH_RESULT[]) => {
    // DELETE
    try {
        const query: string = "DELETE FROM `fetchhistory` WHERE `timestamp` < DATE_SUB(NOW(), INTERVAL 7 DAY)";
        await connection.query(query);
        await connection.commit();
    } catch (_err) {
        console.log("[setFetchHistory] DELETE FAILED");
        await connection.rollback();
    }

    // INSERT
    for (let result of fetchResult) {
        try {
            const query: string = "INSERT INTO `fetchhistory` SET ?";
            const pingData: FETCH_HISTORY = {
                url: result.url,
                alive: result.alive,
                timestamp: result.checkDate,
                responsetime: result.responseTime,
                downtime: result.downTime
            };
            await connection.query(query, [pingData]);
            await connection.commit();
        } catch (_err) {
            console.log(`[setFetchHistory] INSERT FAILED(${result.url})`);
            await connection.rollback();
        }
    }
}

export const getPingDownTime = async (connection: mysql.Connection, host: string, alive: boolean, checkDate: Date): Promise<number> => {
    if (alive === true) return 0;
    const findData = await getLatestPingHistory(connection, host);
    if (findData === undefined || findData.alive === "1") return 0;
    return getTime(findData.timestamp, checkDate) + +findData.downtime;
}

export const getFetchDownTime = async (connection: mysql.Connection, url: string, alive: boolean, checkDate: Date): Promise<number> => {
    if (alive === true) return 0;
    const findData = await getLatestFetchHistory(connection, url);
    if (findData === undefined || findData.alive === "1") return 0;
    return getTime(findData.timestamp, checkDate) + +findData.downtime;
}

export const getTime = (start: Date, end: Date) => {
    return end.getTime() - start.getTime();
}

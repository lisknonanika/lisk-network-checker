import { CronJob } from 'cron';
import { RunPing, RunFetch } from './app';
import { getMysqlConnection, setPingHistory, setFetchHistory } from './history';
import { CRON } from './config.json';

const pingJob: CronJob = new CronJob(CRON.timing, async () => {
    let connection = undefined;
    try {
        connection = await getMysqlConnection();
        const results = await RunPing(connection);
        await setPingHistory(connection, results);
    } catch (err) {
        console.log(err);
    } finally {
        if (connection) await connection.end();
    }
});

const fetchJob: CronJob = new CronJob(CRON.timing, async () => {
    let connection = undefined;
    try {
        connection = await getMysqlConnection();
        const results = await RunFetch(connection);
        await setFetchHistory(connection, results);
    } catch (err) {
        console.log(err);
    } finally {
        if (connection) await connection.end();
    }
});

(async () => {
    try {
        // Job
        if (!pingJob.running) pingJob.start();
        if (!fetchJob.running) fetchJob.start();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();

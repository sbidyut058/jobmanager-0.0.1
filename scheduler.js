import { scheduleJob } from 'node-schedule'

const scheduler = scheduleJob(cronExp, async () => {
    try {
        console.log(`Scheduled job(${title}) running at:`, new Date().toISOString());
        await jobFn();
    } catch (error) {
        console.error(`Scheduler Error in ${title}:`, error);
        service.job.cancel();
        console.log(`Scheduled job(${title}) cancelled due to error at:`, new Date().toISOString());
    }
});
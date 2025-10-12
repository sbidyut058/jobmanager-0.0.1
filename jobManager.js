import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { scheduleJob } from 'node-schedule';
import Job from './models/Job.js';
import ApiResponseEntity from './models/ApiResponseEntity.js';
import JobError from './exception/JobError.js';
import utils from './utils/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.resolve(__dirname, './worker.js');

/**
 * @typedef {Object} cronExpObj
 * @property {number} [second]
 * @property {number} minute
 * @property {number} hour
 * @property {number} dayOfMonth
 * @property {number} month
 * @property {number} dayOfWeek
 */

/** Map of jobId -> Job 
 * @type {Map<number, Job>}
*/
const jobMap = new Map();

/** Queue for pending thread jobs */
const jobQueue = [];

/** Max workers = number of CPU cores
 * @type {number}
 */
const MAX_WORKERS = os.cpus().length;

/** Currently running worker count
 * @type {number}
 */
let activeWorkers = 0;

/** Run next thread job from queue */
const runNextJobFromQueue = async () => {
    if (activeWorkers >= MAX_WORKERS || jobQueue.length === 0) return;

    const nextJob = jobQueue.shift();
    activeWorkers++;

    const { jobid, serviceModule, method, payload, title } = nextJob;

    const worker = new Worker(workerPath, {
        workerData: { serviceModule, jobid, method, payload: JSON.parse(JSON.stringify(payload ?? {})) }
    });

    nextJob.job.executor = worker;

    worker.on('message', (msg) => {
        const job = jobMap.get(msg.jobid);
        Object.assign(job.response, msg.msg);
    });

    worker.on('error', (error) => console.error(`Worker Error [${title}]:`, error));

    worker.on('exit', (code) => {
        console.log(`Worker Exit [${title}] Code:`, code);
        activeWorkers--;
        runNextJobFromQueue(); // start next job in queue
    });
};

/**
 * Create a job (thread or scheduler)
 * @param {Object} props
 * @param {'thread'|'scheduler'} props.type
 * @param {string} props.serviceModule
 * @param {string} props.method
 * @param {object} props.payload
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} [props.parentId]
 * @param {cronExpObj} [props.cronExp] - Only for scheduler
 * @returns {Promise<string>} jobid
 */
const createJob = async (props) => {
    const { type, serviceModule, method, payload, title, description, parentId, cronExp } = props;

    const service = await import(serviceModule);
    if (!service) throw new JobError(404, 'Service not found');

    const jobid = Date.now();
    if (parentId && !jobMap.has(parentId)) throw new JobError(404, `Parent job with id ${parentId} not found`);

    if (Array.from(jobMap.values()).some(job => job.title === title && job.type === 'scheduler')) throw new JobError(409, `Scheduler is already running`);

    const job = new Job({
        title,
        type,
        description,
        parentId,
        response: new ApiResponseEntity({ status: 202, message: 'Job is in Queue' })
    });

    if (type === 'thread') {
        const jobData = { jobid, serviceModule, method, payload, title, job };
        if (activeWorkers < MAX_WORKERS) {
            jobQueue.unshift(jobData);
            runNextJobFromQueue();
        } else {
            jobQueue.push(jobData);
        }
    } else if (type === 'scheduler') {
        if (!cronExp) throw new JobError(400, 'cronExp required for scheduler jobs');
        const cronExpString = utils.toCronExpression(cronExp);

        job.executor = scheduleJob(cronExpString, async () => {
            try {
                console.log(`Scheduler job "${title}" triggered at ${new Date().toISOString()}`);
                await createJob({
                    type: 'thread',
                    title: `Child of scheduled job: ${title}`,
                    description: '',
                    parentId: jobid,
                    serviceModule,
                    method,
                    payload
                });
            } catch (error) {
                console.error(`Scheduler job "${title}" error:`, error);
                cancelJob(jobid);
            }
        });
        job.response.message = 'Scheduler is Running';
    } else {
        throw new JobError(400, 'Invalid job type');
    }

    jobMap.set(jobid, job);
    return jobid;
};

/** Cancel a job (thread or scheduler)
 * @param {number} jobid - jobid of associated job
 * @throws {JobError} When job not found
 * @returns {ApiResponseEntity} Returns a response
 */
const cancelJob = (jobid) => {
    const job = jobMap.get(jobid);
    if (!job) throw new JobError(404, 'Job not found');

    if (job.type === 'thread') {
        if (job.executor) {
            job.executor.terminate();
            activeWorkers = Math.max(0, activeWorkers - 1);
        } else {
            // remove from queue
            const idx = jobQueue.findIndex(j => j.jobid === jobid);
            if (idx > -1) jobQueue.splice(idx, 1);
        }
    } else if (job.type === 'scheduler') {
        if (job.executor) job.executor.cancel();
    }

    job.response.status = 499;
    job.response.message = 'Job cancelled';
    job.executor = null;

    return new ApiResponseEntity({ status: 499, message: 'Job cancelled successfully' });
};

/** Get job details 
 * @param {number} jobid - Job id of associate job
 * @throws {JobError} - When job not found
 * @returns {ApiResponseEntity} Returns a response with job detail with it's children
*/
const getJobDetail = (jobid) => {
    const job = jobMap.get(jobid);
    if (!job) throw new JobError(404, 'Job not found');

    return new ApiResponseEntity({
        status: 200,
        message: 'Job detail fetched',
        data: {
            jobid,
            type: job.type,
            title: job.title,
            description: job.description,
            children: Array.from(jobMap)
                .filter(([_, childJob]) => childJob.parentId >= 0 && childJob.parentId === jobid)
                .map(([childJobId, childJob]) => 
                    ({
                        jobid: childJobId,
                        type: childJob.type,
                        title: childJob.title,
                        description: childJob.description,
                    })
                )
        }
    });
};

/** Get all active jobs 
 * @returns {ApiResponseEntity} Returns a response with all jobs details with it's children
*/
const getAllJobsDetail = () => {
    const jobs = Array.from(jobMap.entries()).map(([id, job]) => ({
        jobid: id,
        type: job.type,
        title: job.title,
        description: job.description,
        children: Array.from(jobMap)
            .filter(([_, childJob]) => childJob.parentId >= 0 && childJob.parentId === id)
            .map(([childJobId, childJob]) => 
                ({
                    jobid: childJobId,
                    type: childJob.type,
                    title: childJob.title,
                    description: childJob.description,
                })
            )
    }));

    return new ApiResponseEntity({
        status: 200,
        message: jobs.length ? 'Fetched all active jobs' : 'No active jobs',
        data: jobs
    });
};

/** Get job response
 * @param {number} jobid - Job id of associate job
 * @returns {ApiResponseEntity|null} response - job Response
*/
const getJobResponse = (jobid) => {
    const job = jobMap.get(jobid);
    if (!job) throw new JobError(404, 'Job not found');
    return job.response;
}

export {
    createJob,
    cancelJob,
    getJobDetail,
    getAllJobsDetail,
    getJobResponse
};

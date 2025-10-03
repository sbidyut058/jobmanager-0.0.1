import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import Job from "./models/Job.js";
import ApiResponseEntity from "./models/ApiResponseEntity.js";
import JobError from './exception/JobError.js';
import { scheduleJob } from 'node-schedule';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerPath = path.resolve(__dirname, './worker.js');

/**
 * Map of jobId -> Job object
 * @type {Map<string, Job>}
 */
const jobMap = new Map();

/**
 * Creates a new job and schedules it for execution.
 *
 * @param {import('./models/Job.js').JobType} type - Type of job ("thread" or "scheduler") 
 * @param {string} title - Job Title
 * @param {string} description - Short description of the job
 * @param {string} [parentId] - Optional Job Reference Id.
 * @param {string} serviceModule - Path of the service file where job method exists.
 * @param {string} method - The Name of the function that contains the job logic.
 * @param {object} payload - Payload for the method.
 * @returns {Promise<string>} jobid - Resolves with a unique job ID.
 * @example
 * let path = path.resolve('src/services/pdfservices.js');
 * const jobId = await createJob(path, 'plus', { numbers: [1, 2, 3] }, "addition");
 */
const createJob = async (type, title, description, parentId, serviceModule, method, payload) => {

    const service = await import(serviceModule);
    if (!service) throw new JobError(404, 'Service Not Found');
    // const instance = service.default ? service.default : service;
    // const fn = instance[method];
    // if (!fn) throw new JobError(404, 'Function Not Found');

    const jobid = String(Date.now());
    if (parentId) {
        if (jobMap.has(parentId)) throw new JobError(409, `Job already exist with id ${parentId}`);
        jobid = parentId;
    }
    jobMap.set(jobid, new Job({ title, type, description, parentId, response: new ApiResponseEntity({ status: 202, message: 'Job is in progress', type })}));
    let job = jobMap.get(jobid);
    if (type === 'thread') {
        const worker = new Worker(workerPath, {
            workerData: { serviceModule: serviceModule, jobid, method, payload: JSON.parse(JSON.stringify(payload)) }
        });

        job.executor = worker;
        worker.on("message", (msg) => {
            const job = jobMap.get(msg.jobid);
            Object.assign(job.response, msg.msg);
        });

        worker.on('error', (error) => {
            console.error(error);
        })

        worker.on('exit', (code) => {
            console.log('Exit Code:', code);
        })
    } else if (type === 'scheduler') {
        job
        jobMap.get(jobid).executor = scheduleJob(cronExp, async () => {
            try {
                console.log(`Scheduled job(${title}) running at:`, new Date().toISOString());
                createJob('thread', `Child Process of Scheduled Job ${title}`, '', jobid, serviceModule, method, payload);
            } catch (error) {
                console.error(`Scheduler Error in ${title}:`, error);
                service.job.cancel();
                console.log(`Scheduled job(${title}) cancelled due to error at:`, new Date().toISOString());
            }
        });
    } else {
        throw new JobError(202, 'Provide valid job type');
    }

    return jobid;
};

/**
 * 
 * @param {string} jobid - Provide Job Id to get Job details
 * @returns {Job} job - Returns Job;
 */
const getJob = (jobid) => {
    if (!jobid) throw new JobError(400, 'Provide Job Id');
    if (!jobMap.has(String(jobid))) {
        throw new JobError(404, 'No Job Found');
    }
    return jobMap.get(String(jobid));
};

const getAllJobs = () => {
    return new ApiResponseEntity({ status: 200, message: '', data: Array.from(jobMap.keys()) });
}

const cancelJob = (jobid) => {
    const job = getJob(jobid);
    if (!job) throw new JobError(404, 'Job Not Found');
    if (job.type === 'thread') {
        if (!job.executor || !(job.executor instanceof Worker)) throw new JobError(404, 'Worker Not Found');
        job.executor.terminate();
    } else if (job.type === 'scheduler') {
        job.executor.cancel();
    } else {
        throw new JobError(404, 'Job has not a valid type');
    }
    job.response.status = 499;
    job.response.message = 'Job is cancelled';
    job.executor = null;
    return new ApiResponseEntity({
        status: 499,
        message: 'Job is cancelled successfully'
    });
};

const processJob = (res, jobid) => {
    const job = getJob(jobid);
    if (job.headers) {
        Object.keys(job.headers).forEach(key => {
            res.setHeader(key, job.headers[key]);
        });
    }

    if (job.data instanceof Uint8Array && !Buffer.isBuffer(job.data)) {
        job.data = Buffer.from(job.data);
    }

    if (Buffer.isBuffer(job.data)) {
        res.status(200).send(job.data);
    } else {
        res.status(200).send(new ApiResponseEntity({ status: job.status, message: job.message, data: job.data }));
    }
}

export {
    createJob,
    getJob,
    getAllJobs,
    cancelJob,
    processJob
}

// april 24 to 25th march 2025

import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import Job from "./models/Job.js";
import ApiResponseEntity from "./models/ApiResponseEntity.js";
import JobError from './exception/JobError.js'
import utils from './utils/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerPath = path.resolve(__dirname, './worker.js');

const jobMap = new Map();

/**
 * Creates a new job and schedules it for execution.
 *
 * @param {string} serviceModule - Path of the service file where job method exists.
 * @param {string} method - The Name of the function that contains the job logic.
 * @param {object} payload - Payload for the method.
 * @returns {Promise<string>} jobid - Resolves with a unique job ID.
 *
 * @example
 * let path = path.resolve(root, 'src/services/pdfservices.js');
 * const jobId = await createJob(path, 'plus', { numbers: [1, 2, 3] });
 */
const createJob = async (serviceModule, method, payload) => {

    if (!(await import(serviceModule))) {
        throw new JobError(404, 'Service Not Found !!!');
    }

    const jobid = String(Date.now());

    jobMap.set(jobid, new Job({ status: 202, message: 'Job is in progress' }));

    const worker = new Worker(workerPath, {
        workerData: { serviceModule:`../${serviceModule}`, jobid, method, payload: JSON.parse(JSON.stringify(payload)) }
    });

    jobMap.get(jobid).worker = worker;
    worker.on("message", (msg) => {
        const job = jobMap.get(msg.jobid);
        Object.assign(job, msg.msg);    
    });

    worker.on('error',(error) => {
        console.error(error);
    })

    worker.on('exit',(code) => {
        console.log('Exit Code:', code);
    })
    return jobid;
};

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
    if (job.worker) {
        job.worker.terminate();
        Object.assign(job,{
            status: 499,
            message: 'Job is cancelled',
            worker: null
        });
        return new ApiResponseEntity({
            status: 499,
            message: 'Job is cancelled successfully'
        });
    }
    throw new JobError(404, 'Worker not found');
};

const processJob = (res, jobid) => {
    const job = getJob(jobid);
    if(job.headers) {
        Object.keys(job.headers).forEach(key=>{
            res.setHeader(key, job.headers[key]);
        });
    }

    if (job.data instanceof Uint8Array && !Buffer.isBuffer(job.data)) {
        job.data = Buffer.from(job.data);
    }

    if(Buffer.isBuffer(job.data)) {
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

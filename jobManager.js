import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import Job from "./models/Job.js";
import ApiResponseEntity from "./models/ApiResponseEntity.js";
import JobError from './exception/JobError.js';
import { scheduleJob } from 'node-schedule';
import utils from './utils/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerPath = path.resolve(__dirname, './worker.js');

/**
 * Map of jobId -> Job object
 * @type {Map<string, Job>}
 */
const jobMap = new Map();

/**
 * @typedef {Object} cronExpObj
 * @property {number|string} minute - Minute field (0–59 or "*" for every minute)
 * @property {number|string} hour - Hour field (0–23 or "*" for every hour)
 * @property {number|string} dayOfMonth - Day of month (1–31 or "*" for every day)
 * @property {number|string} month - Month field (1–12 or "*" for every month)
 * @property {number|string} dayOfWeek - Day of week (0–6 or "*" for every day; 0 = Sunday)
 */

/**
 * @typedef {Object} createJobProps
 * @property {import('./models/Job.js').JobType} type - Type of job ("thread" or "scheduler") 
 * @property {string} serviceModule - Path of the service file where job method exists.
 * @property {string} method - The Name of the function that contains the job logic.
 * @property {object} payload - Payload for the method.
 * @property {string} title - Job Title
 * @property {string} description - Short description of the job
 * @property {string} [parentId] - Optional Job Reference Id.
 * @property {cronExpObj} [cronExp] - Only for Scheduler Job
 */

/**
 * Creates a new job and schedules it for execution.
 * @param {createJobProps} props 
 * @returns {Promise<string>} jobid - Resolves with a unique job ID.
 */
const createJob = async (props) => {
    const { type, serviceModule, method, payload, title, description, parentId, cronExp } = props;

    const service = await import(serviceModule);
    if (!service) throw new JobError(404, 'Service Not Found');

    const jobid = String(Date.now());
    if (parentId && !jobMap.has(parentId)) throw new JobError(404, `No Job exist with provided parent id ${parentId}`);

    //Created Temporary Job instance
    let job = new Job({ title, type, description, parentId, response: new ApiResponseEntity({ status: 202, message: 'Job is in progress' }) });

    if (job.type === 'thread') {
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
    } else if (job.type === 'scheduler') {
        const cronExpString = utils.toCronExpression(cronExp);
        job.executor = scheduleJob(cronExpString, async () => {
            try {
                console.log(`Scheduled job(${title}) running at:`, new Date().toISOString());
                await createJob({ type: 'thread', title: `Child Process of Scheduled Job ${title}`, description:'', parentId: jobid, serviceModule, method, payload });
            } catch (error) {
                console.error(`Scheduler Error in ${title}:`, error);
                try {
                    cancelJob(jobid);
                    console.log(`Scheduled job(${title}) cancelled due to error at:`, new Date().toISOString());
                } catch (error) {
                    console.log(`Failed To Cancel Scheduled Job with id: ${jobid}`)
                }
            }
        });
    } else {
        throw new JobError(202, 'Provide valid job type');
    }
    jobMap.set(jobid, job);
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

/**
 * 
 * @returns {ApiResponseEntity} jobdetls - Return all running job details
 */
const getAllJobs = () => {
    const activeJobs = Array.from(jobMap.entries()).map(([jobid, job]) => ({
      jobid,
      type: job.type,
      title: job.title,
      description: job.description,
      children: Array.from(jobMap.entries())
        .filter(([_, jjob]) => jjob.parentId === jobid)
        .map(([childId, childJob]) => ({
          jobid: childId,
          type: childJob.type,
          title: childJob.title,
          description: childJob.description
        }))
    }));
    let response = new ApiResponseEntity({
    status: 200,
    message: activeJobs.length ? 'Successfully Fetched All Active Jobs' : 'No Active Jobs Found',
    data: activeJobs
  });
  return response;
};

/**
 * 
 * @param {String} jobid - Job id to cancel associated job 
 * @returns {ApiResponseEntity}
 */
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

export {
    createJob,
    getJob,
    getAllJobs,
    cancelJob
}

// april 24 to 25th march 2025

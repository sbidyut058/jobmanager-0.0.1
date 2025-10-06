export type cronExpObj = {
    /**
     * - Minute field (0–59 or "*" for every minute)
     */
    minute: number | string;
    /**
     * - Hour field (0–23 or "*" for every hour)
     */
    hour: number | string;
    /**
     * - Day of month (1–31 or "*" for every day)
     */
    dayOfMonth: number | string;
    /**
     * - Month field (1–12 or "*" for every month)
     */
    month: number | string;
    /**
     * - Day of week (0–6 or "*" for every day; 0 = Sunday)
     */
    dayOfWeek: number | string;
};
export type createJobProps = {
    /**
     * - Type of job ("thread" or "scheduler")
     */
    type: import("./models/Job.js").JobType;
    /**
     * - Path of the service file where job method exists.
     */
    serviceModule: string;
    /**
     * - The Name of the function that contains the job logic.
     */
    method: string;
    /**
     * - Payload for the method.
     */
    payload: object;
    /**
     * - Job Title
     */
    title: string;
    /**
     * - Short description of the job
     */
    description: string;
    /**
     * - Optional Job Reference Id.
     */
    parentId?: string | undefined;
    /**
     * - Only for Scheduler Job
     */
    cronExp?: cronExpObj | undefined;
};
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
export function createJob(props: createJobProps): Promise<string>;
/**
 *
 * @param {string} jobid - Provide Job Id to get Job details
 * @returns {Job} job - Returns Job;
 */
export function getJob(jobid: string): Job;
/**
 *
 * @returns {ApiResponseEntity} jobdetls - Return all running job details
 */
export function getAllJobs(): ApiResponseEntity;
/**
 *
 * @param {String} jobid - Job id to cancel associated job
 * @returns {ApiResponseEntity}
 */
export function cancelJob(jobid: string): ApiResponseEntity;
import Job from "./models/Job.js";
import ApiResponseEntity from "./models/ApiResponseEntity.js";

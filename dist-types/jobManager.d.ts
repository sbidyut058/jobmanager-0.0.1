/**
 * Creates a new job and schedules it for execution.
 *
 * @param {('thread'|'scheduler')} [jobType='thread'] - Type of job. Can be 'thread' for worker threads or 'scheduler' for scheduled jobs.
 * @param {string} serviceModule - Path of the service file where job method exists.
 * @param {string} method - The Name of the function that contains the job logic.
 * @param {object} payload - Payload for the method.
 * @returns {Promise<string>} jobid - Resolves with a unique job ID.
 *
 * @example
 * let path = path.resolve(root, 'src/services/pdfservices.js');
 * const jobId = await createJob(path, 'plus', { numbers: [1, 2, 3] });
 */
export function createJob(jobType?: ("thread" | "scheduler"), serviceModule: string, method: string, payload: object): Promise<string>;
export function getJob(jobid: any): any;
export function getAllJobs(): ApiResponseEntity;
export function cancelJob(jobid: any): ApiResponseEntity;
export function processJob(res: any, jobid: any): void;
import ApiResponseEntity from "./models/ApiResponseEntity.js";

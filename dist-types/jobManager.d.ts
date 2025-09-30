/**
 * Creates a new job and schedules it for execution.
 *
 * @param {string} serviceModule - Path of the service file where job method exists.
 * @param {string} method - The Name of the function that contains the job logic.
 * @param {object} payload - Payload for the method.
 * @returns {Promise<string>} jobid - Resolves with a unique job ID.
 *
 * @example
 * const jobId = await createJob("src/services/calculate", 'plus', { numbers: [1, 2, 3] });
 */
export function createJob(serviceModule: string, method: string, payload: object): Promise<string>;
export function getJob(jobid: any): any;
export function getAllJobs(): ApiResponseEntity;
export function cancelJob(jobid: any): ApiResponseEntity;
export function processJob(res: any, jobid: any): void;
import ApiResponseEntity from "./models/ApiResponseEntity.js";

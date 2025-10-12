export type cronExpObj = {
    second?: number | undefined;
    minute: number;
    hour: number;
    dayOfMonth: number;
    month: number;
    dayOfWeek: number;
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
export function createJob(props: {
    type: "thread" | "scheduler";
    serviceModule: string;
    method: string;
    payload: object;
    title: string;
    description?: string | undefined;
    parentId?: string | undefined;
    cronExp?: cronExpObj | undefined;
}): Promise<string>;
/** Cancel a job (thread or scheduler)
 * @param {number} jobid - jobid of associated job
 * @throws {JobError} When job not found
 * @returns {ApiResponseEntity} Returns a response
 */
export function cancelJob(jobid: number): ApiResponseEntity;
/** Get job details
 * @param {number} jobid - Job id of associate job
 * @throws {JobError} - When job not found
 * @returns {ApiResponseEntity} Returns a response with job detail with it's children
*/
export function getJobDetail(jobid: number): ApiResponseEntity;
/** Get all active jobs
 * @returns {ApiResponseEntity} Returns a response with all jobs details with it's children
*/
export function getAllJobsDetail(): ApiResponseEntity;
/** Get job response
 * @param {number} jobid - Job id of associate job
 * @returns {ApiResponseEntity|null} response - job Response
*/
export function getJobResponse(jobid: number): ApiResponseEntity | null;
import ApiResponseEntity from './models/ApiResponseEntity.js';

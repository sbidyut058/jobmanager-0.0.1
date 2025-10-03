import { Worker } from 'worker_threads';
import { Job as ScheduleJob } from 'node-schedule';
import ApiResponseEntity from "./ApiResponseEntity.js";

/**
 * @typedef {"thread" | "scheduler"} JobType
 */

/**
 * Represents a generic Job, can be a Worker thread or a scheduled job.
 * @class
 */
class Job {
  /**
   * @param {Object} props
   * @param {JobType} props.type - Type of job ("thread" or "scheduler")
   * @param {string} [props.parentId] - Optional parent job ID
   * @param {string} props.title - Job title
   * @param {string} [props.description] - Optional description
   * @param {ApiResponseEntity} [props.response] - Response object for job result
   * @param {Worker|ScheduleJob} [props.executor] - Either a Worker thread or node-schedule Job instance
   */
  constructor({ type, parentId, title, description, response, executor }) {
    this.type = type;
    this.parentId = parentId;
    this.title = title,
    this.description = description,
    this.response = response,
    this.executor = executor;
  }
}

export default Job;
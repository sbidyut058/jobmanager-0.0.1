import { Worker } from 'worker_threads';
import { Job as ScheduleJob } from 'node-schedule';
import ApiResponseEntity from "./ApiResponseEntity.js";
import BaseObject from './BaseObject.js';

/**
 * @typedef {"thread" | "scheduler"} JobType
 */

/**
 * @typedef {Object} JobProps
 * @property {JobType} type - Type of job ("thread" or "scheduler")
 * @property {string} [parentId] - Optional parent job ID
 * @property {string} title - Job title
 * @property {string} [description] - Optional description
 * @property {ApiResponseEntity} [response] - Response object for job result
 * @property {Worker|ScheduleJob} [executor] - Worker thread or scheduler job
 */

/**
 * 
 * @class Represents a generic Job (thread or scheduled job).
 * @extends {BaseObject}
 */
class Job extends BaseObject {

  /** @type {"thread" | "scheduler"} */
  type;

  /** @type {string | null} */
  parentId;

  /** @type {string} */
  title;

  /** @type {string | null} */
  description;

  /** @type {ApiResponseEntity | null} */
  response;

  /** @type {Worker | ScheduleJob | null} */
  executor;

  /**
   * @param {JobProps} props
   */
  constructor(props) {
    super(props, {
      type: { type: "string", validValues: ["thread", "scheduler"], nullable: false },
      parentId: { type: "string", nullable: true },
      title: { type: "string", nullable: false },
      description: { type: "string", nullable: true },
      response: { type: "object", instance: ApiResponseEntity, nullable: true },
      executor: { type: "object", instance: [Worker, ScheduleJob], nullable: true }
    });
  }
}

export default Job;

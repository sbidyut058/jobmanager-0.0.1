import ApiResponseEntity from "../models/ApiResponseEntity.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * 
 * @param {Object} res - Response object
 * @param {ApiResponseEntity} entity 
 * @returns {Object} res - Response object
 */
const processResponseEntity = (res, entity) => {
    if (entity.headers) {
        Object.keys(entity.headers).forEach(key => {
            res.setHeader(key, entity.headers[key]);
        });
    }

    if (entity.data instanceof Uint8Array && !Buffer.isBuffer(entity.data)) {
        entity.data = Buffer.from(entity.data);
    }

    if (Buffer.isBuffer(entity.data)) {
        res.status(200).send(entity.data);
    } else {
        res.status(200).send({ status: entity.status, message: entity.message, data: entity.data });
    }
    return res;
} 

/**
 * Converts a cronExpObj into a cron expression string.
 * @param {import("../jobManager.js").cronExpObj} obj
 * @returns {string} Cron expression string.
 */
function toCronExpression(obj) {
  const { second, minute, hour, dayOfMonth, month, dayOfWeek } = obj;
  return `${second ?? '*'} ${minute ?? '*'} ${hour ?? '*'} ${dayOfMonth ?? '*'} ${month ?? '*'} ${dayOfWeek ?? '*'}`;
}

export default {
    sleep,
    asyncHandler,
    toCronExpression,
    processResponseEntity
}
declare namespace _default {
    export { sleep };
    export { asyncHandler };
    export { toCronExpression };
    export { processResponseEntity };
}
export default _default;
declare function sleep(ms: any): Promise<any>;
declare function asyncHandler(fn: any): (req: any, res: any, next: any) => Promise<any>;
/**
 * Converts a cronExpObj into a cron expression string.
 * @param {import("../jobManager.js").cronExpObj} obj
 * @returns {string} Cron expression string.
 */
declare function toCronExpression(obj: import("../jobManager.js").cronExpObj): string;
/**
 *
 * @param {Object} res - Response object
 * @param {ApiResponseEntity} entity
 * @returns {Object} res - Response object
 */
declare function processResponseEntity(res: Object, entity: ApiResponseEntity): Object;
import ApiResponseEntity from "../models/ApiResponseEntity.js";

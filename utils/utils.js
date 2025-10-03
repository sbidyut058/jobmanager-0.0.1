const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Returns the absolute path to the main project root (where `npm start` was run).
 * Uses `process.cwd()`, so it's safe even if this library is inside node_modules.
 */

export default {
    sleep,
    asyncHandler
}
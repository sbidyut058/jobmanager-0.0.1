/**
 * Represents a Job Error.
 */

/**
 * @class
 */
class JobError extends Error {
    /**
     * 
     * @param {number} status - Status code of the error
     * @param {string} [message] - Optional message 
     */
    constructor(status, message) {
        super(message);
        this.status = status;
        this.message = message;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, JobError);
        }
    }
}

export default JobError;
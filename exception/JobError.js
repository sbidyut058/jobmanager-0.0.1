class JobError extends Error {

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
export default JobError;
declare class JobError extends Error {
    constructor(status: any, message: any);
    status: any;
    message: any;
}

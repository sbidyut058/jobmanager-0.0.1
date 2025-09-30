export default JobController;
declare class JobController {
    getJob: (req: any, res: any) => Promise<void>;
    cancelJob: (req: any, res: any) => Promise<any>;
    getAllJobs: (req: any, res: any) => Promise<any>;
}

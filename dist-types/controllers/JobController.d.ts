export default JobController;
declare class JobController {
    getJob: (req: any, res: any) => Promise<Object>;
    cancelJob: (req: any, res: any) => Promise<Object>;
    getAllJobs: (req: any, res: any) => Promise<Object>;
}

import utils from "../utils/utils.js";
import { cancelJob, getAllJobs, getJob } from "../jobManager.js";

class JobController {
    getJob = async (req, res) => {
        const { jobid } = req.query;
        const job = getJob(jobid);
        return utils.processResponseEntity(res, job.response);
    }

    cancelJob = async (req, res) => {
        const { jobid } = req.body;
        return utils.processResponseEntity(res, cancelJob(jobid));
    }

    getAllJobs = async (req, res) => {
        return utils.processResponseEntity(res, getAllJobs());
    }

}

export default JobController;
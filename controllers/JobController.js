import { cancelJob, getAllJobs, processJob } from "../jobManager.js";

class JobController {
    getJob = async (req, res) => {
        const { jobid, service } = req.query;
        processJob(res, jobid);
    }

    cancelJob = async (req, res) => {
        const { jobid } = req.body;
        return res.status(200).send(cancelJob(jobid));
    }

    getAllJobs = async (req, res) => {
        return res.status(200).send(getAllJobs());
    }

}

export default JobController;
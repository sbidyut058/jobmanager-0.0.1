import express from 'express';
import utils from '../utils/utils.js';
import JobController from '../controllers/JobController.js';
const routes = express.Router();

const jobController = new JobController();
routes.get('/get', utils.asyncHandler(jobController.getJob));
routes.get('/getall', utils.asyncHandler(jobController.getAllJobs))
routes.post('/cancel', utils.asyncHandler(jobController.cancelJob));

export default routes;
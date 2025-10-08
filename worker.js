import { workerData, parentPort } from 'worker_threads';
import JobError from './exception/JobError.js';
import ApiResponseEntity from './models/ApiResponseEntity.js';

/**
 * Worker thread entry point.
 * Executes a method from a service module with provided payload.
 * Sends progress and final response back to parent thread via parentPort.
 */
(async () => {
    const { serviceModule, jobid, method, payload } = workerData;

    /**
     * Sends an update message to parent thread
     * @param {any} [data] - Optional progress data
     */
    const sendUpdate = (data) => {
        parentPort.postMessage(JSON.parse(JSON.stringify({
            jobid,
            msg: new ApiResponseEntity({
                status: 202,
                message: 'Job is in progress',
                data
            })
        })));
    };

    try {
        // Import service dynamically
        const service = await import(serviceModule);
        if (!service) throw new JobError(404, 'Service Not Found');

        // Get the service instance (default export or named export)
        const instance = service.default ? service.default : service;
        const fn = instance[method];
        if (!fn) throw new JobError(404, 'Function Not Found');

        // Send initial progress update
        sendUpdate();

        // Execute the service method
        const response = await fn.call(instance, payload, sendUpdate);

        // Handle file response
        if (response && response.constructor && response.constructor.name === 'File') {
            const buffer = Buffer.from(await response.arrayBuffer());
            parentPort.postMessage({
                jobid,
                msg: {
                    status: 200,
                    message: 'job has Ended',
                    headers: {
                        'Content-Type': response.type,
                        'Content-Disposition': `attachment; filename=${response.name}`
                    },
                    data: buffer
                }
            }, [buffer.buffer]); // Transfer buffer for performance
        } else {
            parentPort.postMessage(JSON.parse(JSON.stringify({
                jobid,
                msg: {
                    status: 200,
                    message: 'Job has Ended'
                }
            })));
        }
    } catch (err) {
        parentPort.postMessage(JSON.parse(JSON.stringify({
            jobid,
            msg: new ApiResponseEntity({
                status: 500,
                message: err.message
            })
        })));
    }
})().catch(error => {
    throw new JobError(500, error.message);
});

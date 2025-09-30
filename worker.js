import { workerData, parentPort } from 'worker_threads';
import Job from './models/Job.js';
import JobError from './exception/JobError.js';

try {
    (async () => {
        const { serviceModule, jobid, method, payload } = workerData;
        try {
            const service = await import(serviceModule);
            if (!service) throw new JobError(404, 'Service Not Found');

            const instance = service.default ? new service.default() : service;
            const fn = instance[method];
            if (!fn) throw new JobError(404, 'Function Not Found');
            const response = await fn.call(instance, payload, (data) => parentPort.postMessage({
                jobid,
                msg: JSON.parse(JSON.stringify(new Job({
                    status: 200,
                    data: data
                })))
            }));

            if (response && response.constructor && response.constructor.name === 'File') {
                const buffer = Buffer.from(await response.arrayBuffer());
                parentPort.postMessage({
                    jobid,
                    msg: {
                        status: 200,
                        headers: {
                            'Content-Type': response.type,
                            'Content-Disposition': `attachment; filename=${response.name}`
                        },
                        data: buffer
                    }
                }, [buffer.buffer]);
            }
        } catch (err) {
            parentPort.postMessage({
                jobid,
                msg: JSON.parse(JSON.stringify(new Job({
                    status: 500,
                    message: err.message
                })))
            });
        }
    })()
} catch (error) {
    throw new JobError(500, error.message);
}
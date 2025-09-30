import BaseObject from "./BaseObject.js";
import { Worker } from 'worker_threads';

class Job extends BaseObject {
    constructor(props) {
        super(props,{
            status: "number",
            message: "string",
            headers: { "type":"object", "nullable": true },
            data: "any",
            worker: { "type":"object", "instance": Worker, "nullable": true }
        });
    }
}

export default Job;
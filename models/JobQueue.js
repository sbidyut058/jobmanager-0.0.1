import JobQueueItem from './JobQueueItem.js';
import { Worker } from 'worker_threads';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getJob } from '../jobManager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.resolve(__dirname, '../worker.js');

/**
 * JobQueue manages a queue of JobQueueItem instances.
 */
class JobQueue {

    /**
     * @type {Array<JobQueueItem>} props
     */
    #items = [];

    /** Max workers = number of CPU cores
     * @type {number}
     */
    #MAX_WORKERS = os.cpus().length;

    /** Currently running worker count
     * @type {number}
     */
    #activeWorkers = 0;

    /**
     * @returns {number} Number of items in the queue
     */
    get length() {
        return this.#items.length;
    }
    /**
     * @returns {Array<JobQueueItem>} All items in the queue
     */
    get items() {
        return this.#items;
    }

    /**
     * Push a new item to the end of the queue
     * @param {JobQueueItem} item 
     */
    push(item) {
        if (!(item instanceof JobQueueItem)) throw new Error('Invalid item type. Expected JobQueueItem.');
        this.#items.push(item);
    }

    /**
     * Remove and return the first item from the queue
     * @returns {JobQueueItem|null} The removed item or null if the queue is empty
     */
    shift() {
        return this.#items.length > 0 ? this.#items.shift() : null;
    }

    /**
     * Add a new item to the front of the queue
     * @param {JobQueueItem} item 
     */
    unshift(item) {
        if (!(item instanceof JobQueueItem)) throw new Error('Invalid item type. Expected JobQueueItem.');
        this.#items.unshift(item);
    }

    /** Remove item by jobid 
     * @param {number} jobid - Job ID to remove
    */
    removeByJobId(jobid) {
        const idx = this.#items.findIndex(item => item.jobid === jobid);
        if (idx > -1) this.#items.splice(idx, 1);
    }

    /** Terminate worker by jobid
     * @param {number} jobid - Job ID to terminate
    */
    terminateByJobId(jobid) {
        const item = this.#items.find(item => item.jobid === jobid);
        if (item) {
            item.job.executor.terminate();
            this.#activeWorkers = Math.max(0, this.#activeWorkers - 1);
            this.runNextJobFromQueue();
        }
    }

    /** Check if job is in queue
     * @param {number} jobid - Job ID to check
     * @returns {boolean} True if job is in queue, false otherwise
    */
    hasJobInQueue(jobid) {
        return this.#items.some(item => item.jobid === jobid);
    }

    /** Run next thread job from queue */
    runNextJobFromQueue = () => {
        if (this.#activeWorkers >= this.#MAX_WORKERS || this.#items.length === 0) return;

        const nextJob = this.shift();
        this.#activeWorkers++;

        const jobid = nextJob.jobid;
        const method = nextJob.method;
        const title = nextJob.title;
        const mainThreadOnMessage = nextJob.messageHandler.mainThreadOnMessage;
        const workerOnMessage = nextJob.messageHandler.workerOnMessage;

        /** @type {Worker} */
        const worker = new Worker(workerPath, {
            workerData: { jobid, method: JSON.parse(JSON.stringify(method)), workerOnMessage: JSON.parse(JSON.stringify(workerOnMessage)) }
        });

        nextJob.job.executor = worker;

        worker.on('message', (msg) => {
            if(msg.type === 'default') {
                const job = getJob(msg.jobid);
                job.status = msg.msg.status;
                Object.assign(job.response, msg.msg);
            } else {
                mainThreadOnMessage(msg);
            }
        });

        worker.on('error', (error) => console.error(`Worker Error [${title}]:`, error));

        worker.on('exit', (code) => {
            console.log(`Worker Exit [${title}] Code:`, code);
            this.#activeWorkers = Math.max(0, this.#activeWorkers - 1);
            this.runNextJobFromQueue();
        });
    };

}

const jobQueue = new JobQueue();
jobQueue.runNextJobFromQueue();
export default jobQueue;
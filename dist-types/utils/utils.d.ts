declare namespace _default {
    export { sleep };
    export { asyncHandler };
    export { getProjectRoot };
}
export default _default;
declare function sleep(ms: any): Promise<any>;
declare function asyncHandler(fn: any): (req: any, res: any, next: any) => Promise<any>;
/**
 * Returns the absolute path to the main project root (where `npm start` was run).
 * Uses `process.cwd()`, so it's safe even if this library is inside node_modules.
 */
declare function getProjectRoot(): any;

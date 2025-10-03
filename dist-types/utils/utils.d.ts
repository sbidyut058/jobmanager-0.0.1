declare namespace _default {
    export { sleep };
    export { asyncHandler };
}
export default _default;
declare function sleep(ms: any): Promise<any>;
declare function asyncHandler(fn: any): (req: any, res: any, next: any) => Promise<any>;

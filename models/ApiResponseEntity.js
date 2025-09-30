import BaseObject from "./BaseObject.js";

class ApiResponseEntity extends BaseObject {
    constructor(params) {
        super(params, {
            status: { "type":"number", defaultValue: 500 },
            message: "string",
            data: "any"
        })
    }
}

export default ApiResponseEntity;
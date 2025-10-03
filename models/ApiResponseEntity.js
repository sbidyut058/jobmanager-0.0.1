/**
 * Represents a Api Response.
 */

/**
 * @class
 */
class ApiResponseEntity {

    /**
     * @param {Object} props
   * @param {number} props.status - Status of the response
   * @param {string} [props.message] - Optional Response message
   * @param {Object} [props.headers] - Optional response headers
   * @param {any} [props.data] - Optional Response data
   */
    constructor({
        status,
        message,
        headers,
        data
    }) {
        this.status = status;
        this.message = message;
        this.headers = headers;
        this.data = data
    }
}

export default ApiResponseEntity;
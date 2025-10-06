import BaseObject from "./BaseObject.js";

/**
 *
 * @typedef {Object} ApiResponseProps
 * @property {number} status - Status of the response.
 * @property {string} [message] - Optional response message.
 * @property {Object} [headers] - Optional response headers.
 * @property {any} [data] - Optional response data.
 */

/**
 * Represents an API Response.
 * @class
 * @extends {BaseObject}
 */
class ApiResponseEntity extends BaseObject {
  /** @type {number} */
  status;

  /** @type {string | null} */
  message;

  /** @type {Object | null} */
  headers;

  /** @type {any | null} */
  data;

  /**
   * @param {ApiResponseProps} props - API response properties.
   */
  constructor(props) {
    super(props, {
      status: "number",
      message: { type: "string", nullable: true },
      headers: { type: "object", instance: Object, nullable: true },
      data: "any",
    });
  }
}

export default ApiResponseEntity;

/**
 * @typedef {Object<string, { type: string, defaultValue?: any, instance?: Function|Function[], validValues?: any[], nullable?: boolean }>} SchemaType
 */

class BaseObject {
  #schema;

  /**
   * Creates a validated DTO object.
   * @param {Object<string, any>} parameters - Key-value pairs for the object
   * @param {SchemaType} schema - Schema definition for validation
   */
  constructor(parameters = {}, schema) {
    this.#schema = schema;

    for (const [key, rule] of Object.entries(schema)) {
      const value = parameters[key] !== undefined
        ? parameters[key]
        : rule?.defaultValue ?? null;

      this.#validateProperty(key, value);

      // private backing field
      this[`#${key}`] = value;

      // define getter/setter for public access
      Object.defineProperty(this, key, {
        get: () => this[`#${key}`],
        set: (val) => {
          this.#validateProperty(key, val);
          this[`#${key}`] = val;
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  /**
   * Validates a property value against the schema
   * @param {string} prop
   * @param {any} value
   */
  #validateProperty(prop, value) {
    const rule = this.#schema[prop];
    if (!rule) throw new Error(`Property '${prop}' is not allowed`);

    const { type, instance, validValues, nullable } = typeof rule === "string"
      ? { type: rule, nullable: true }
      : rule;

    if (value === null) {
      if (!nullable) throw new Error(`'${prop}' cannot be null`);
      return;
    }

    if (!this.#isTypeMatch(value, type)) {
      throw new Error(`Invalid type for '${prop}', expected '${type}', got '${typeof value}'`);
    }

    if (instance) {
      const instances = Array.isArray(instance) ? instance : [instance];
      if (!instances.some(ins => value instanceof ins)) {
        throw new Error(`Invalid instance for '${prop}', expected one of: ${instances.map(i => i.name).join(', ')}`);
      }
    }

    if (validValues && !validValues.includes(value)) {
      throw new Error(`Invalid value for '${prop}', expected one of: ${validValues.join(', ')}`);
    }
  }

  /**
   * Checks type match, supports 'any', 'array', and 'date' (valid date string)
   * @param {any} value
   * @param {string} type
   * @returns {boolean}
   */
  #isTypeMatch(value, type) {
    if (type === "any") return true;
    if (type === "array") return Array.isArray(value);
    if (type === "date") return typeof value === "string" && !isNaN(Date.parse(value));
    return typeof value === type;
  }
}

export default BaseObject;

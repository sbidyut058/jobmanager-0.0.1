const schemaMap = new WeakMap();

class BaseObject {
  constructor(parameters, type) {
    const target = {};

    // Initial validation
    for (const [key, value] of Object.entries(parameters)) {
      const newValue = value !== undefined ? value : type?.[key]?.defaultValue ?? null;
      validateProperty(key, newValue, type);
      target[key] = value;
    }

    schemaMap.set(target, type);

    return new Proxy(target, {
      get(target, prop) {
        return target[prop];
      },
      set(target, prop, value) {
        const schema = schemaMap.get(target);
        validateProperty(prop, value, schema);
        target[prop] = value;
        return true;
      },
    });
  }
}

// Validation helper
function validateProperty(prop, value, schema) {
  const rule = schema[prop];
  if (!rule) throw new Error(`Property '${prop}' is not allowed`);


  const { type, instance, nullable } = typeof rule === "string" ? { type: rule, nullable: true } : rule;
  if (value === null) {
    if (!nullable) throw new Error(`'${prop}' cannot be null`);
    return;
  }

  if (typeof value !== type && type !== 'any') {
    throw new Error(
      `Invalid type for '${prop}', expected ${type}, got ${typeof value}`
    );
  }
  if ((instance && !(value instanceof instance))) {
    throw new Error(
      `Invalid instance passed for '${prop}', expected ${instance.prototype.name}`
    );
  }
  if (rule.enum) {
    if (!Array.isArray(rule.enum)) throw new Error(`Invalid Enum defined`);
    if (!rule.enum.includes(value)) throw new Error(
      `Invalid value passed for '${prop}', expected ${rule.enum.entries(i => i)}`
    );
  }
}

// Patch Object.assign for BaseObject
const nativeAssign = Object.assign;
Object.assign = function (target, ...sources) {
  if (schemaMap.has(target)) {
    const schema = schemaMap.get(target);

    // Validate all properties in all sources first
    for (const source of sources) {
      for (const [key, value] of Object.entries(source)) {
        validateProperty(key, value, schema);
      }
    }

    // All valid → assign
    for (const source of sources) {
      nativeAssign(target, source);
    }
    return target;
  }

  // fallback for normal objects
  return nativeAssign(target, ...sources);
};

export default BaseObject;
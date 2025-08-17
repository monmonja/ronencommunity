/**
 * @file Replace {{config.variable}} with values from the config
 */

import config from "../src/backend/config/default.json" with { type: "json" };

function flattenConfig(obj, prefix = "", res = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      flattenConfig(value, newKey, res);
    } else {
      res[newKey] = value;
    }
  }
  return res;
}

export default function (source) {
  let replacedSource = source;
  const flatConfig = flattenConfig(config);

  Object.keys(flatConfig).forEach((key) => {
    const value = flatConfig[key];
    const regex = new RegExp(`{{config.${key}}}`, 'g');

    replacedSource = replacedSource.replace(regex, value);
  });

  return replacedSource;
}

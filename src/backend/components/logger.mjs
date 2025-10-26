import Rollbar from "rollbar";
import config from "../config/default.json" with { type: "json" };

let rollbar = { log: (message, { auditData } = {}) => {}};

if (config.isProd) {
  rollbar = new Rollbar({
    accessToken: config.web3.rollbar,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });
}

export function logError({ message, auditData } = {}) {
  console.log('config.isProd', config.isProd)
  if (config.isProd) {
    rollbar.log(message, { auditData });
  }

  // eslint-disable-next-line no-console
  console.log(message, auditData);
}

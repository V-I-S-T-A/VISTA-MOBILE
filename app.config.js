const fs = require('fs');
const path = require('path');

// Optional local Firebase configuration. A checkout without this file still builds.
module.exports = ({ config }) => {
  const googleServicesFile = process.env.VISTA_GOOGLE_SERVICES_FILE || './google-services.json';
  const exists = fs.existsSync(path.resolve(__dirname, googleServicesFile));
  return {
    ...config,
    android: {
      ...config.android,
      ...(exists ? { googleServicesFile } : {}),
    },
  };
};

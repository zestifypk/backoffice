const dotenv = require('dotenv');

let loaded = false;

function loadEnv() {
  if (!loaded) {
    dotenv.config();
    loaded = true;
  }
}

function getEnv(name, defaultValue = undefined) {
  loadEnv();
  const value = process.env[name];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

module.exports = {
  loadEnv,
  getEnv,
};

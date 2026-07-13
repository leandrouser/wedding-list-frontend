export const ApiConfig = {
  baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080/api'
    : 'https://wedding.dlaraenxovais.tech/api',
  cloudinaryCloudName: 'dtv0nnt3i',
  cloudinaryUploadPreset: 'rca2hqqa'
};

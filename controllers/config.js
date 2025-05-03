
// config.js
const environment = 'testing'; // Change to 'production' when ready

const config = {
    testing: {
        baseUrl: 'https://restpilot.paylink.sa',
        apiId: 'APP_ID_1123453311',
        secretKey: '0662abb5-13c7-38ab-cd12-236e58f43766',
    },
    production: {
        baseUrl: 'https://restapi.paylink.sa',
        apiId: process.env.PAYLINK_API_ID,
        secretKey: process.env.PAYLINK_API_KEY,
    },
};

const { baseUrl, apiId, secretKey } = config[environment];

module.exports = { baseUrl, apiId, secretKey };

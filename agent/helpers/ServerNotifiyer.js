const axios = require('axios');

module.exports = function registerAgentOnServer(
    agentHost,
    agentPort,
    SERVER_HOST,
    SERVER__PORT
) {
    axios({
        method: 'NOTIFY',
        url: `${SERVER_HOST}:${SERVER__PORT}/notify_agent`,
        data: {
            agentHost,
            agentPort
        }
    })
        .then(response => {
            console.log('Registered on SERVER');
        })
        .catch(err => {
            console.log('Error during registration on Server\n', err.message);
            process.exit(1);
        });
};

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config.agent.json');
const PORT = config['port'] || 3000;
const HOST = config['host'] || 'http://localhost';
const SERVER_HOST = config['server-host'] || 'http://localhost';
const SERVER__PORT = config['server-port'] || 5000;
const registerAgentOnServer = require('./helpers/ServerNotifiyer');
const buildController = require('./build-controller/build-controller');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/build', buildController);
app.listen(PORT);
console.log(`Agent started on PORT ${PORT}`);
registerAgentOnServer(HOST, PORT, SERVER_HOST, SERVER__PORT);

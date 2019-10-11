const express = require('express');
const bodyParser = require('body-parser');
const filehandle = require('fs').promises;
const config = require('./config.server.json');
const PORT = config["port"] || 3000;
const REPOSITORY_URL = config["repositoryUrl"] || '';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.notify('/notify_agent', async (req, res) => {
    const {agentHost, agentPort} = req.body;
    let agents = await filehandle.readFile('./server/data/agents.json');
    agents = JSON.parse(agents.toString());
    agents.push({
        agentHost,
        agentPort
    });
    await filehandle.writeFile('./server/data/agents.json', JSON.stringify(agents));
    await res.sendStatus(200);
});

app.notify('/notify_build_result', async (req, res) => {
    const { buildId, status, stdout, stderr } = req.body;
    await res.sendStatus(200);
});

app.get('/', res => {
    //TODO:Implement UI
});
app.get('/build/:buildId', (req, res) => {
   //TODO: Implement UI
});


app.listen(PORT);
console.log(`Server started on PORT ${PORT}`);
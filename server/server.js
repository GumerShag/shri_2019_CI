const express = require('express');
const bodyParser = require('body-parser');
const filehandle = require('fs').promises;
const config = require('./config.server.json');
const PORT = config["port"] || 5000;
const REPOSITORY_URL = config["repositoryUrl"] || '';
const AGENTS_PATH = './server/data/agents.json';

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.notify('/notify_agent', async (req, res) => {
    const {agentHost, agentPort} = req.body;
    let agents = await filehandle.readFile(AGENTS_PATH);
    agents = JSON.parse(agents.toString());
    //TODO: add validation for unique agent
    agents.push({
        agentHost,
        agentPort
    });
    await filehandle.writeFile(AGENTS_PATH, JSON.stringify(agents));
    await res.sendStatus(200);
});

app.notify('/notify_build_result', async (req, res) => {
    const { buildId, status, buildStart, buildFinish, logs } = req.body;
    try {
        await filehandle.mkdir(`./server/data/build-${buildId}-${status}`);
        await filehandle.writeFile(`./server/data/build-${buildId}-${status}/.logs`, logs);
        await filehandle.writeFile(`./server/data/build-${buildId}-${status}/timing.json`, JSON.stringify({buildStart, buildFinish}));
    } catch (e) {
        res.send(500);
    }
    await res.sendStatus(200);
});

app.get('/', (req, res) => {
    //TODO:Implement UI

});
app.get('/build/:buildId', (req, res) => {
   //TODO: Implement UI
});


app.listen(PORT);
console.log(`Server started on PORT ${PORT}`);
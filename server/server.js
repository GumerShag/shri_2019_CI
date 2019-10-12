const express = require('express');
const bodyParser = require('body-parser');
const filehandle = require('fs').promises;
const axios = require('axios');
const config = require('./config.server.json');
const PORT = config["port"] || 5000;
const REPOSITORY_URL = config["repositoryUrl"] || '';
const AGENTS_PATH = './server/data/agents.json';

const app = express();
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '50mb'}));

app.notify('/notify_agent', async (req, res) => {
    const {agentHost, agentPort} = req.body;
    let agents = await filehandle.readFile(AGENTS_PATH);
    agents = JSON.parse(agents.toString());
    //TODO: add validation for unique agent
    agents.push({
        agentHost,
        agentPort,
        busy: false
    });
    await filehandle.writeFile(AGENTS_PATH, JSON.stringify(agents));
    await res.sendStatus(200);
});

app.notify('/notify_build_result', async (req, res) => {
    const { buildId, status, buildStart, buildFinish, logs, agentPort, commitHash } = req.body;
    await changeAgentStatus(agentPort);
    try {
        await filehandle.mkdir(`./server/data/builds/build-${buildId}-${status}`, {recursive: true});
        await filehandle.writeFile(`./server/data/builds/build-${buildId}-${status}/info.json`, JSON.stringify({buildStart, buildFinish, commitHash, buildId, status, logs: logs.toString()}));
    } catch (e) {
        res.send(500);
    }
    await res.sendStatus(200);
});

app.post('/start_build', async (req, res) => {
    const { commitHash, command } = req.body;
    console.log('### START BUILD\nHASH:', commitHash, '\nCOMMAND: ',command);
    startBuildOnAgent(commitHash, command).then(resolve => {
        res.sendStatus(201);
    }).catch(err => {
        res.status(500).send(err);
    });
});

app.get('/', (req, res) => {
    //TODO:Implement UI

});
app.get('/builds', async (req, res) => {
    const buildsPath = './server/data/builds/';
    const builds = await filehandle.readdir(buildsPath);
    let buildsArray = [];
    for (const build of builds) {
        let buildInfo = await filehandle.readFile(`${buildsPath}/${build}/info.json`);
        buildsArray.push(JSON.parse(buildInfo.toString()));
    }
    await res.json(buildsArray);

});
app.get('/build-info', async (req, res) => {
    const { id } = req.query;
    const buildsPath = './server/data/builds/';
    const builds = await filehandle.readdir(buildsPath);
    for (const build of builds) {
        let buildInfo = await filehandle.readFile(`${buildsPath}/${build}/info.json`);
        buildInfo = JSON.parse(buildInfo.toString());
        if (buildInfo.buildId === id) {
            await res.json(buildInfo);
        }
    }

});

async function startBuildOnAgent (commitHash, command) {
    let agents = await filehandle.readFile(AGENTS_PATH);
    agents = JSON.parse(agents.toString());
    const freeAgentIndex = agents.findIndex(agent => {
        return !agent.busy;
    });

    if (freeAgentIndex === -1){
        console.log("NO FREE AGENTS");
        throw Error("NO FREE AGENTS");
    }

    const freeAgent = agents[freeAgentIndex];
    agents[freeAgentIndex].busy = true;
    await filehandle.writeFile(AGENTS_PATH, JSON.stringify(agents));
    //TODO: use id generator with less collision effect
    const buildId = `f${(~~(Math.random()*1e8)).toString(16)}`;
    return axios({
        method: 'POST',
        url: `${freeAgent.agentHost}:${freeAgent.agentPort}/build`,
        data: {
            buildId,
            repositoryURL: REPOSITORY_URL,
            commitHash,
            command
        }
    })
}
async function changeAgentStatus(agentPort) {
    let agents = await filehandle.readFile(AGENTS_PATH);
    agents = JSON.parse(agents.toString());
    const agentIndex = agents.findIndex(agent => {
        return agent.agentPort === agentPort;
    });
    if (agentIndex !== -1) {
        agents[agentIndex].busy = false;
    }
    await filehandle.writeFile(AGENTS_PATH, JSON.stringify(agents));
}
filehandle.writeFile(AGENTS_PATH, JSON.stringify([]));
app.listen(PORT);
console.log(`Server started on PORT ${PORT}`);
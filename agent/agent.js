const express = require('express');
const fs = require('fs');
const os = require("os");
const buffer = require('buffer');
const bodyParser = require('body-parser');
const config = require('./config.agent.json');
const PORT = config["port"] || 3000;
const HOST = config["host"] || 'http://localhost';
const SERVER_HOST = config["server-host"] || 'http://localhost';
const SERVER__PORT = config["server-port"] || 5000;
const { exec, spawn } = require('child_process');
const BUILDS_BASE_PATH = './builds/';
const axios = require('axios');
const getFolderName = require('./helpers/getFolderName');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function registerAgentOnServer(agentHost, agentPort) {
    axios({
        method: 'NOTIFY',
        url: `${SERVER_HOST}:${SERVER__PORT}/notify_agent`,
        data: {
            agentHost,
            agentPort
        }
    }).then(response => {
        console.log('Registered on SERVER')
    }).catch(err => {
        console.log('Error during registration on Server\n', err.message);
        process.exit(1);
    })
}
async function cloneRepo(repositoryURL, commitHash) {
    const repoFolder = getFolderName(repositoryURL, commitHash);
    return new Promise((resolve, reject) => {
        if (fs.existsSync(`${BUILDS_BASE_PATH}${repoFolder}`)) {
            resolve(repoFolder);
            return;
        }
        exec(`git clone ${repositoryURL} ${BUILDS_BASE_PATH}${repoFolder}`, error => {
            if (error) {
                reject(error);
                return;
            }
            resolve(repoFolder);
        });
    })
}
async function checkOutCommit(commitHash, repoFolder) {
    return new Promise((resolve, reject) => {
        exec(`git checkout ${commitHash}`, {cwd: `${BUILDS_BASE_PATH}${repoFolder}`}, (error, logs) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(logs);
        });
    })
}
async function runCommand(command, repoFolder) {
    return new Promise((resolve, reject) => {
        const commandParts = command.split(' ');
        let currentStatus = {
            logs: '',
            status: ''
        };
        const buildLogs = spawn(/^win/.test(process.platform) ? `${commandParts[0]}.cmd`: commandParts[0], commandParts.slice(1, commandParts.lenght), {cwd: `${BUILDS_BASE_PATH}${repoFolder}`});
        buildLogs.stdout.on('data', logs => {
            logs = Buffer.from(logs).toString();
            currentStatus.logs = currentStatus.logs.concat(logs);
        });

        buildLogs.on('error', errors => {
            currentStatus.logs = currentStatus.logs.concat(errors);
        });

        buildLogs.on('close', exitStatus => {
            console.log("EXIT STATUS", exitStatus);
            currentStatus.status = exitStatus === 0 ? 'PASSED' : 'FAILED';
            resolve(currentStatus)
        });
    })
}
async function sendRunStatus(buildId, runStatus, buildStart, buildFinish, commitHash) {
    axios({
        method: 'NOTIFY',
        url: `${SERVER_HOST}:${SERVER__PORT}/n2otify_build_result`,
        data: {
            buildId,
            status: runStatus.status,
            buildStart,
            buildFinish,
            logs: runStatus.logs,
            agentPort: PORT,
            commitHash
        }
    })
}

app.post('/build', async (req, res) => {
    const { buildId, repositoryURL, commitHash, command } = req.body;
    let buildStart;
    let buildFinish;
    if (!buildId || !repositoryURL || !commitHash || !command) {
        res.sendStatus(400).json('buildId, repositoryURL, commitHash and command should be provided');
        return;
    }
    try {
        console.log("AGENT BUILD STARTED");
        res.sendStatus(200);
        buildStart = new Date(Date.now()).toLocaleString();
        const repoFolder = await cloneRepo(repositoryURL, commitHash);
        await checkOutCommit(commitHash, repoFolder);
        const runStatus = await runCommand(command, repoFolder);
        buildFinish = new Date(Date.now()).toLocaleString();
        await sendRunStatus(buildId, runStatus, buildStart, buildFinish, commitHash);
        console.log("AGENT BUILD FINISHED");
    } catch (e) {
        buildFinish = new Date(Date.now()).toLocaleString();
        await sendRunStatus(buildId, {status: 'FAILED', logs: e.toString()}, buildStart, buildFinish, commitHash);
    }


});
app.listen(PORT);
console.log(`Agent started on PORT ${PORT}`);
registerAgentOnServer(HOST, PORT);



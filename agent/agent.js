const express = require('express');
const fs = require('fs');
const os = require("os");
const buffer = require('buffer');
const bodyParser = require('body-parser');
const config = require('./config.agent.json');
const PORT = config["port"] || 3000;
const SERVER_HOST = config["server-host"] || 'http://localhost';
const SERVER__PORT = config["server-port"] || 5000;
const { exec, spawn } = require('child_process');
const BUILDS_BASE_PATH = './builds/';
const axios = require('axios');
const getFolderName = require('./helpers/getFolderName');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
        const buildLogs = spawn(commandParts[0], commandParts.slice(1, commandParts.lenght), {cwd: `${BUILDS_BASE_PATH}${repoFolder}`});
        buildLogs.stdout.on('data', logs => {
            logs = Buffer.from(logs).toString();
            console.log(logs);
            resolve(logs);
        });

        buildLogs.stderr.on('data', errors => {
            errors = Buffer.from(errors).toString();
            console.log(errors);
            reject(errors);
        });

        buildLogs.on('close', exitLogs => {
            console.log(exitLogs);
            resolve(exitLogs)
        });
    })
}
async function sendRunStatus(buildId, status) {
    axios({
        method: 'NOTIFY',
        url: `${SERVER_HOST}:${SERVER__PORT}/notify_build_result`,
        data: {
            buildId: buildId,
            status: status,
            stdout: "stdout",
            stderr: "stderr"
        }
    })
}

app.post('/build', async (req, res) => {
    const { buildId, repositoryURL, commitHash, command } = req.body;
    if (!buildId || !repositoryURL || !commitHash || !command) {
        res.sendStatus(400).json('buildId, repositoryURL, commitHash, command should be provided');
        return;
    }

    const repoFolder =  await cloneRepo(repositoryURL, commitHash);
    await checkOutCommit(commitHash, repoFolder);
    const runStatus = await runCommand(command, repoFolder);
    await sendRunStatus(buildId, runStatus);
    await res.sendStatus(200);
});
app.listen(PORT);
console.log(`Agent started on PORT ${PORT}`);
//registerAgentOnServer(os.hostname, PORT);

function registerAgentOnServer(agentHost, agentPort) {
    axios({
        method: 'NOTIFY',
        url: `${SERVER_HOST}:${SERVER__PORT}/notify_agent`,
        data: {
            agentHost,
            agentPort
        }
    }).then(response => {
        console.log('Registered on SERVER', response)
    }).catch(err => {
        console.log('ERROR', err)
    })
}

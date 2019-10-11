const express = require('express');
const fs = require('fs');
const os = require("os");
const config = require('./config.agent.json');
const PORT = config["port"] | 3000;
const { exec, spawn } = require('child_process');
const SERVER_HOST = config["server-host"] | 'http://localhost';
const SERVER__PORT = config["server-port"] | 5000;
const axios = require('axios');

const app = express();

async function cloneRepo(repositoryURL, commitHash) {
    const repoFolder = `${commitHash}_build`;
    // //TODO: change to mkdtemp
    // fs.makeDir(repoFolder, err => {
    //     console.log('Error in creating dir')
    // });
    return new Promise((resolve, reject) => {
        exec(`git clone ${repositoryURL} ${repoFolder}`, (error, logs) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(logs);

        });
    })
}
async function checkOUtCommit(commitHash) {
    return new Promise((resolve, reject) => {
        exec(`git checkout ${commitHash}`, (error, logs) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(logs);
        });
    })
}

async function runBuild() {

}

async function sendBuildStatus(buildId, status, stdout, stderr) {
    axios({
        method: 'POST',
        url: `${SERVER_HOST}:${SERVER__PORT}/notify_build_result`,
        data: {
            status: status,
            stdout: stdout,
            stderr: stderr
        }
    })
}

app.post('/build', async req=> {
    const { buildId, repositoryURL, commitHash, command } = req.body;
    await cloneRepo(repositoryURL, commitHash);
    await checkOUtCommit(commitHash);
    // await runBuild(command);
    // await sendBuildStatus(buildId);
});
app.listen(PORT);
console.log(`Agent started on PORT ${PORT}`);
//registerAgentOnServer(os.hostname, PORT);

function registerAgentOnServer(host, port) {
    axios({
        method: 'CREATE',
        url: `${SERVER_HOST}:${SERVER__PORT}/notify_agent`,
        data: {
            host: host,
            port: port
        }
    }).then(response => {
        console.log('Registered on SERVER', response)
    }).catch(err => {
        console.log('ERROR', err)
    })
}

console.log('Works')
document.addEventListener('DOMContentLoaded', function () {
    const buildId = new URLSearchParams(new URL(window.location.href).search).get('id');
    loadData(buildId)
});

function loadData(buildId) {
    fetch(`http://localhost:5000/build-info?id=${buildId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(respone => {
        return respone.json();
    }).then(response => {
            console.log(response);
        renderBuildInfo(response);
        }
    ).catch(err => {
        console.log(err)
    })
}

function renderBuildInfo(item) {
    const headEl = document.getElementById('head');
    headEl.innerHTML =
        `<span class="label-commit">${item.commitHash}</span>
        <span class="status-${item.status.toLowerCase()}">${item.status}</span>
        <div class="dates">
            <div class="started">Started: ${item.buildStart}</div>
            <div class="finished">Finished: ${item.buildFinish}</div>
        </div>
        <label>Logs</label>
        <textarea class="logs">${item.logs}</textarea>`
}
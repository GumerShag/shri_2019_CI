console.log('Works');
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('submit-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const commitHash = event.target[0].value;
        const command = event.target[1].value;
        const buildInfo = document.getElementById('build-info');
        if (!commitHash || !command) return;
        fetch('http://localhost:5000/start_build', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                commitHash,
                command
            })
        })
            .then(respone => {
                buildInfo.innerText =
                    respone.status === 201
                        ? 'Сборка запущена'
                        : 'Ошибка сервера';
            })
            .catch(err => {
                buildInfo.innerText = 'Ошибка сервера';
            });
    });

    loadBuilds();
    //TODO: Websocket is to implemented here
    const interval = setInterval(loadBuilds, 20000);
});

function loadBuilds() {
    fetch('http://localhost:5000/builds', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(respone => {
            return respone.json();
        })
        .then(response => {
            console.log(response);
            renderTableItems(response);
        })
        .catch(err => {
            clearInterval(loadBuilds);
            console.log(err);
        });
}

function renderTableItems(items) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = items
        .map(item => {
            return `<tr class="data-table-row">
                    <td class="data-table-row__cell data-table-row__cell-updated"><a href="/build/?id=${
                        item.buildId
                    }" class="text text_color-primary">${
                item.commitHash
            }</a></td>
                    <td class="data-table-row__cell data-table-row__cell-updated"><span class="text text_color-primary status-${item.status.toLowerCase()}">${
                item.status
            }</span></td>
                    <td class="data-table-row__cell data-table-row__cell-updated"><span class="text text_color-primary">${
                        item.buildFinish
                    }</span></td>
                </tr>`;
        })
        .join('');
}

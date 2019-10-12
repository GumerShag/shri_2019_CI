console.log('Works')
document.addEventListener('DOMContentLoaded', function () {
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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                commitHash,
                command
            })
        }).then(respone => {
            buildInfo.innerText = respone.status === 201 ? 'Успех' : 'Неудачно'
        }).catch(err => {
            buildInfo.innerText = 'Неудачно'
        })
    });

    loadBuilds();
    //TODO: Websocket is to implemented here
    setInterval(loadBuilds, 5000);
    
});

function loadBuilds() {
    fetch('http://localhost:5000/builds', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(respone => {
        return respone.json();
    }).then(response => {
            console.log(response);
        renderTableItems(response);
        }
    ).catch(err => {
        console.log(err)
    })
}

function renderTableItems(items) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = items.map(item => {
        return `<tr class="data-table-row">
                    <td class="data-table-row__cell data-table-row__cell-updated"><span class="text text_color-primary">${item.commitHash}</span></td>
                    <td class="data-table-row__cell data-table-row__cell-updated"><span class="text text_color-primary">${item.status}</span></td>
                    <td class="data-table-row__cell data-table-row__cell-updated"><span class="text text_color-primary">${item.buildFinish}</span></td>
                </tr>`
    }).join('');
}
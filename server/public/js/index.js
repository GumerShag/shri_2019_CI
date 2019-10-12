console.log('Works')
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('submit-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const commitHash = event.target[0].value;
        const command = event.target[1].value;
        debugger
        fetch('http://localhost:5000/start_build', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                commitHash,
                command
            })
        })
    })
    
});
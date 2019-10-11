const path = require('path');

module.exports = (repositoryURL, commitHash) => {
    return `${path.basename(repositoryURL).replace('.git', '')}_${commitHash}_build`;
};

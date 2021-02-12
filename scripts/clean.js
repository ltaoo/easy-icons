const path = require('path');

const del = require('del');

const ROOT_DIR = __dirname;
function resolve(...paths) {
    return path.resolve(ROOT_DIR, ...paths);
}
console.log('[clean]...', resolve('../lib'), resolve('../es'))
del([resolve('../lib'), resolve('../es')]);
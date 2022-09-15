// Production mode
function isProduction() {
    return true;
}

// Performance monitoring
let timings = [];

function start_timing(action) {
    if (!isProduction()) {
        timings[action] = new Date().getTime();
    }
}

function end_timing(action) {
    if (!isProduction()) {
        let took = new Date().getTime() - timings[action];
        console.log('Action <' + action + '> took '
            + took
            + 'ms');
    }
}

// Logging
function log(message) {
    if (!isProduction()) {
        console.log(message);
    }
}

// Debug
function sleep(milliseconds) {
    let start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}



// Initialize application
function initApplication(baseUrl) {

    console.log(`Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)`)

    let fileExtension = '.js';
    if (isProduction()) {
        fileExtension = '.min.js';
    }

    let applicationFiles = [
        'resources/js/apiFuncs.js',
        'resources/js/globalFuncs.js',

        'vendors/vuejs/vue' + fileExtension,
        'vendors/vuex/vuex' + fileExtension,
        'vendors/vue-resource/vue-resource' + fileExtension,

        'resources/js/store/modules/app.js',
        'resources/js/store/modules/databases.js',
        'resources/js/store/modules/sessions.js',
        'resources/js/store/modules/modalDialog.js',
        'resources/js/store/store.js',

        'resources/js/components/searchableTable.js',
        'resources/js/components/loading.js',
        'resources/js/components/statusBar.js',
        'resources/js/components/databaseSelector.js',
        'resources/js/components/sessionFilters.js',
        'resources/js/components/sessionDetails.js',
        'resources/js/components/sessionLongops.js',
        'resources/js/components/sessionLocks.js',
        'resources/js/components/session.js',
        'resources/js/components/sessions.js',
        'resources/js/components/toolbar.js',
        'resources/js/components/modalDialog.js',

        'resources/js/sequeltoolsapp.js'
    ];

    let fileIndex = 0;
    let fileMaxIndex = applicationFiles.length - 1;

    function loadScriptFile(fileIndex, fileMaxIndex) {

        if (fileIndex <= fileMaxIndex) {
            let script = document.createElement('script');
            script.onload = function () {
                loadScriptFile(fileIndex + 1, fileMaxIndex);
            };
            script.src = baseUrl + applicationFiles[fileIndex];
            log((fileIndex + 1) + '/' + (fileMaxIndex + 1) + '-' + applicationFiles[fileIndex]);
            document.head.appendChild(script);
        } else {
            document.getElementById('appLoading').remove();
            removeErrorHandling();
            end_timing('Startup');
        }
    }

    start_timing('Startup');
    loadScriptFile(fileIndex, fileMaxIndex);
}

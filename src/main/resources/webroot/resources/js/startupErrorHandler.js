// Error Handler
function errorHandler() {
    alert('An error occurred during application startup.' +
        '\nPlease make sure you are using a modern browser supporting JavaScript 6:' +
        '\nAt least Chrome 58+, Edge14+, Firefox 54+, Safari 10+, Opera 55+'
    );
}

function addErrorHandling() {
    window.addEventListener('error', errorHandler)
}

function removeErrorHandling() {
    // called in appInit.js after full application startup
    window.removeEventListener('error', errorHandler);
}

addErrorHandling();
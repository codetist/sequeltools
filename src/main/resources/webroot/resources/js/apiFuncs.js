const baseApiUrl = baseUrl + 'api/';
const sessionsUrl = baseApiUrl + '$database/sessions';
const databasesUrl = baseApiUrl + 'databases';

const appVersionUrl = baseUrl + 'version.json';

const sessionUrl = sessionsUrl + '/$sid';
const longOpsUrl = sessionsUrl + '/$sid,$serial/longops';
const sessionLocksUrl = sessionsUrl + '/$sid/locks';

function getAppVersionUrl() {
    return appVersionUrl;
}

function getDatabasesUrl() {
    return databasesUrl;
}

function getSessionsUrl(database) {
    return sessionsUrl.replace('$database', database);
}

function getSessionUrl(database, sid) {
    return sessionUrl.replace('$database', database)
        .replace('$sid', sid);
}

function getLongOpsUrl(database, sid, serial) {
    return longOpsUrl.replace('$database', database)
        .replace('$sid', sid)
        .replace('$serial', serial);
}

function getSessionLocksUrl(database, sid) {
    return sessionLocksUrl.replace('$database', database)
        .replace('$sid', sid);
}


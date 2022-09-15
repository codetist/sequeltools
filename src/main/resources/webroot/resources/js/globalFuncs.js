function changeStyleMode(style) {
    if (style=="dark") {
        document.getElementById("displaymode").setAttribute("href", "resources/css/dark.css");
    } else {
        document.getElementById("displaymode").setAttribute("href", "resources/css/light.css");
    }
}

function formatDate(dateString, dateFormatter) {
    const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    let returnString = '';

    if (dateString && typeof dateString === "string" && dateFormat.test(dateString)) {
        let date = new Date(dateString);
        returnString = dateFormatter.format(date).replace(',', '');
    } else {
        returnString = dateString;
    }
    return returnString;
}

function enrichSessionData(sessions, dateFormatter) {
    start_timing('enrichSessionData');
    if (sessions) {
        for (let i = 0; i < sessions.length; i++) {
            if (!sessions[i].USERNAME) {
                sessions[i].USERNAME = '[Background process]';
            }

            sessions[i].LOGON_TIME = formatDate(sessions[i].LOGON_TIME, dateFormatter);

            if (!sessions[i].BLOCK_STATUS) {
                sessions[i].BLOCK_STATUS = '';
            }

            if (sessions[i].BLOCK_STATUS && sessions[i].BLOCK_STATUS.indexOf('BLOCKING') > -1) {
                sessions[i].BLOCK_INFO = 'BLOCKING';
            }

            if (sessions[i].BLOCKING_SESSION) {
                sessions[i]. BLOCK_INFO = 'BLOCKED BY ' + sessions[i].BLOCKING_SESSION;
            }

            sessions[i] = printObjectIfAvailable(sessions[i]);
        }
    }
    end_timing('enrichSessionData');
    return sessions;
}

function applyStateFilters(sessions, filters) {
    start_timing('applyStateFilters');
    for(let filter in filters) {
        if (filters.hasOwnProperty(filter) && filters[filter]) {

            filter = filter.toUpperCase();
            if (filter == 'ACTIVE' || filter == 'INACTIVE' || filter == 'KILLED') {
                sessions = sessions.filter(function (row) {
                    return(row.STATUS == filter.toUpperCase());
                });
            }

            if (filter == 'BLOCKED' || filter == 'BLOCKING') {
                sessions = sessions.filter(function (row) {
                    return(row.BLOCK_STATUS && row.BLOCK_STATUS.indexOf(filter.toUpperCase()) > -1);
                });
            }

            if (filter == 'OTHER') {
                sessions = sessions.filter(function (row) {
                    return(row.STATUS != 'ACTIVE'
                        && row.STATUS != 'INACTIVE'
                        && row.STATUS != 'KILLED'
                        && row.BLOCK_STATUS != 'BLOCKED'
                        && !row.BLOCK_STATUS.indexOf(filter.toUpperCase()) > -1);
                });
            }

            if (filter == 'USER' || filter == 'BACKGROUND') {
                sessions = sessions.filter(function (row) {
                    return(row.TYPE && row.TYPE == filter.toUpperCase());
                });
            }
        }
    }
    end_timing('applyStateFilters');
    return sessions;
}

function applyTextFilters(sessions, searchTerm, option) {
    start_timing('applyTextFilters');
    if (searchTerm) {
        sessions = sessions.filter(function (row) {
            return Object.keys(row).some(function (key) {
                if (option) {
                    if (option == key) {
                        return String(row[key]).toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
                    }
                } else {
                    return String(row[key]).toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
                }
                return false;
            });
        });
    }

    end_timing('applyTextFilters');
    return sessions;
}

function applySessionFilters(sessions, filters, searchTerm, option) {
    start_timing('applySessionFilters');
    sessions = applyStateFilters(sessions, filters);
    sessions = applyTextFilters(sessions, searchTerm, option)
    end_timing('applySessionFilters');
    return sessions;
}

function calculatePages(sessionsPerPage, currentPage, numberOfSessions) {
    start_timing('calculatePages');
    let numberOfPages = Math.floor(numberOfSessions / sessionsPerPage);
    let remainder = numberOfSessions % sessionsPerPage;
    let pages = [];

    if (remainder > 0) {
        numberOfPages++;
    }

    for (let i = 1; i <= numberOfPages; i++) {
        let pageStart = (i - 1) * sessionsPerPage + 1;
        let pageEnd = i * sessionsPerPage;

        if (pageEnd > numberOfSessions) {
            pageEnd = numberOfSessions;
        }
        pages.push({"page": i, "range": 'Page ' + i + ' (' + pageStart + '..' + pageEnd + ')'});
    }

    if (currentPage > numberOfPages) {
        if (numberOfPages > 0) {
            currentPage = numberOfPages;
        } else {
            currentPage = 1;
        }
    }
    end_timing('calculatePages');

    return {
        pages: pages,
        currentPage: currentPage
    }
}

function showRequestError(store, response, message) {
    let errorMessage = response.status + ' ' + response.statusText;
    if (response.data.error) {
        errorMessage = errorMessage + ', ' + response.data.error;
    }

    if (!message) {
        message = 'Error during operation';
    }

    store.dispatch('modalDialog/open', {
        caption: 'Request failed',
        message: message + ': "' + errorMessage.trim() + '".'
    });
}

function hasValue(value) {
    if (value === undefined || value === null) return false;
    return true
}

function printValueIfAvailable(value) {
    if (hasValue(value)) return value;
    return '<span class="text_grayish">n/a</span>';
}

function printObjectIfAvailable(object) {
    Object.keys(object).forEach(function(prop, index) {
        if (Object.prototype.hasOwnProperty.call(object, prop))
            object[prop] = printValueIfAvailable(object[prop]);
    });
    return object;
}
const sessionsModule = {
    namespaced: true,
    state: {
        queryActive: false,
        sessions: [],
        statistics: {},
        filters : {
            active: false,
            inactive: false,
            blocked: false,
            blocking: false,
            killed: false,
            user: false,
            background: false,
            other: false
        },
        textQuery: {
            searchTerm: null,
            option: ""
        },
        textQueryOptions: [
            { field: "", description: "[All Attributes]" },
            { field: "ACTION", description: "Action" },
            { field: "CLIENT_IDENTIFIER", description: "Client Identifier" },
            { field: "CLIENT_INFO", description: "Client Info" },
            { field: "USERNAME", description: "Connected As" },
            { field: "SCHEMANAME", description: "Current Schema" },
            { field: "LOGON_TIME", description: "Logon Time" },
            { field: "MACHINE", description: "Machine" },
            { field: "MODULE", description: "Module" },
            { field: "OSUSER", description: "OS User" },
            { field: "PROGRAM", description: "Program" },
            { field: "SERIAL#", description: "Serial" },
            { field: "TYPE", description: "Session Type" },
            { field: "SID", description: "SID" },
            { field: "STATUS", description: "Status" },
            { field: "TERMINAL", description: "Terminal" }
        ],
        paging: {
            pages: [],
            currentPage: 1,
            currentSessionsPerPage: 25,
            sessionsPerPage: [
                { pages: 10},
                { pages: 25},
                { pages: 50},
                { pages: 100},
                { pages: 200},
                { pages: 500},
            ]
        }
    },
    getters: {
        queryActive: (state) => state.queryActive,
        statistics: (state) => state.statistics,
        filters: (state) => state.filters,
        textQuery: (state) => state.textQuery,
        textQueryOptions: (state) => state.textQueryOptions,
        paging: (state) => state.paging,
        sessions:
            (state) => {
                let sessions = state.sessions;
                let filters = state.filters;
                let textQuery  = state.textQuery;
                sessions = applySessionFilters(sessions, filters, textQuery.searchTerm, textQuery.option);
                return sessions;
            },
        isTextQueryApplied:
            (state) => {
                if (state.textQuery && state.textQuery.searchTerm && state.textQuery.searchTerm.length>0) return true;
                return false;
            }
    },
    mutations: {
        SET_SESSIONS(state, sessions) {
            state.sessions = sessions;
        },
        SET_SESSION_STATISTICS(state, statistics) {
            state.statistics = statistics;
        },
        TOGGLE_FILTER(state, filterName) {
            let newFilterValue = !state.filters[filterName];
            if (filterName == 'user' || filterName =='background') {
                state.filters.user = false;
                state.filters.background = false;
            } else {
                state.filters.active = false;
                state.filters.inactive = false;
                state.filters.blocked = false;
                state.filters.blocking = false;
                state.filters.killed = false;
                state.filters.other = false;
            }
            state.filters[filterName] = newFilterValue;
        },
        CLEAR_FILTERS(state) {
            for (let filter in state.filters) {
                if (state.filters.hasOwnProperty(filter)) {
                    state.filters[filter] = false;
                }
            }
        },
        SET_SEARCH_TERM(state, searchTerm) {
            state.textQuery.searchTerm = searchTerm;
        },
        SET_TEXTQUERY_OPTION(state, option) {
            state.textQuery.option = option;
        },
        SET_CURRENT_PAGE(state, page) {
            state.paging.currentPage = parseInt(page);
        },
        SET_PAGES(state, pages) {
            state.paging.pages = pages;
        },
        SET_CURRENT_SESSIONSPERPAGE(state, pages) {
            state.paging.currentSessionsPerPage = parseInt(pages);
        },
        SET_QUERY_ACTIVE(state) {
            state.queryActive = true;
        },
        SET_QUERY_INACTIVE(state) {
            state.queryActive = false;
        }
    },
    actions: {
        querySessions({commit, dispatch, state}, parameters) {
            let store = this;
            let databaseToQuery = parameters.currentDatabase;
            let dateFormatter = parameters.dateFormatter;
            if (!databaseToQuery) return;
            if (state.queryActive) return;

            store.dispatch('app/addActivity');
            start_timing('sessionRequest');
            commit('SET_QUERY_ACTIVE');

            Vue.http.get(getSessionsUrl(databaseToQuery))
                .then(function(response) {
                        let sessions = response.data.sessions;
                        if (!sessions) sessions = [];
                        end_timing('sessionRequest');
                        sessions = enrichSessionData(sessions, dateFormatter);
                        commit('SET_SESSIONS', sessions);

                        let statistics = response.data.statistics;
                        commit('SET_SESSION_STATISTICS', statistics);
                        commit('SET_QUERY_INACTIVE');

                        store.dispatch('app/removeActivity');
                        store.dispatch('app/sendNotification', 'Sessions retrieved successfully');
                    },
                    function(response) {
                        showRequestError(store, response, 'Error while retrieving sessions');
                        store.dispatch('app/removeActivity');
                        commit('SET_QUERY_INACTIVE');
                        end_timing('sessionRequest');
                    }
                )
        },
        toggleFilter({commit, dispatch}, filterName) {
             commit('TOGGLE_FILTER', filterName);
        },
        clearSessions({commit}) {
            commit('SET_SESSIONS', []);
            commit('SET_SESSION_STATISTICS', {})
        },
        clearFilters({commit, dispatch}) {
            commit('CLEAR_FILTERS');
        },
        setSearchTerm({commit, dispatch}, searchTerm) {
            commit('SET_SEARCH_TERM', searchTerm);
        },
        setTextQueryOption({commit, dispatch}, option) {
            commit('SET_TEXTQUERY_OPTION', option);
        },
        previousPage({commit, state}) {
            if (state.paging.currentPage > 1) {
                commit('SET_CURRENT_PAGE', state.paging.currentPage - 1);
            }
        },
        nextPage({commit, state}) {
            if (state.paging.currentPage < state.paging.pages.length) {
                commit('SET_CURRENT_PAGE', state.paging.currentPage + 1);
            }
        },
        setCurrentPage({commit, state}, page) {
            commit('SET_CURRENT_PAGE', page);
        },
        setCurrentSessionsPerPage({commit, state}, pages) {
            commit('SET_CURRENT_SESSIONSPERPAGE', pages);
        },
        calculatePages({commit, state}, numberOfSessions) {
            let sessionsPerPage = state.paging.currentSessionsPerPage;
            let currentPage = state.paging.currentPage;
            let pageInfo = calculatePages(sessionsPerPage, currentPage, numberOfSessions);

            commit('SET_PAGES', pageInfo.pages);
            commit('SET_CURRENT_PAGE', pageInfo.currentPage);
        }
    }
}
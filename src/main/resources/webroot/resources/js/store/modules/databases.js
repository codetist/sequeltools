const databasesModule = {
        namespaced: true,
        state: {
            availableDatabases: [],
            currentDatabase: ''
        },
        getters: {
            availableDatabases: state => state.availableDatabases,
            currentDatabase: state => state.currentDatabase
        },
        mutations: {
            SET_CURRENT_DATABASE(state, database) {
                state.currentDatabase = database;
            },
            SET_AVAILABLE_DATABASES(state, databases) {
                state.availableDatabases = databases;
            }
        }
        ,
        actions: {
            setCurrentDatabase({commit}, database) {
                this.dispatch('sessions/clearSessions');
                commit('SET_CURRENT_DATABASE', database);
            },
            queryAvailableDatabases({commit}) {
                let store = this;
                start_timing('databasesRequest');
                store.dispatch('app/addActivity');
                Vue.http.get(getDatabasesUrl())
                    .then(function (response) {
                        let currentDatabase = null;
                        let availableDatabases = response.data.databases;
                        if (availableDatabases.length > 0) {
                            currentDatabase = availableDatabases[0].id;
                        }

                        commit('SET_AVAILABLE_DATABASES', availableDatabases);
                        commit('SET_CURRENT_DATABASE', currentDatabase);

                        store.dispatch('app/removeActivity');
                        end_timing('databasesRequest');
                    }, function (response) {
                        showRequestError(store, response, 'Error while retrieving database connections');
                        store.dispatch('app/removeActivity');
                        end_timing('databasesRequest');
                    });
            }
        }
    }
;
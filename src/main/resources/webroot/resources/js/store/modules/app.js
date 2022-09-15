const appModule = {
        namespaced: true,
        state: {
            config: {
                dateFormatter: new Intl.DateTimeFormat(navigator.language, {
                    month: '2-digit',
                    day: '2-digit',
                    minute: '2-digit',
                    hour: '2-digit',
                    second: '2-digit'
                })
            },
            appVersion: null,
            activity: 0,
            isNotificationAvailable: false,
            notificationMessage: ''
        },
        getters: {
            dateFormatter: state => state.config.dateFormatter,
            appVersion: state => state.appVersion,
            activity: state => state.activity,
            isNotificationAvailable: state => state.isNotificationAvailable,
            notificationMessage: state => state.notificationMessage,
            isActive: state => {
                if (state.activity && state.activity > 0) return true;
                return false;
            }
        },
        mutations: {
            SET_APP_VERSION(state, version) {
                state.appVersion = version;
            },
            INCREMENT_ACTIVITY(state) {
                state.activity = state.activity + 1;
            },
            DECREMENT_ACTIVITY(state) {
                state.activity = state.activity - 1;
                if (state.activity < 0) {
                    state.activity = 0;
                }
            },
            SET_NOTIFICATION(state, notification) {
                state.notificationMessage = notification;
                state.isNotificationAvailable = true;
            },
            CLEAR_NOTIFICATION(state) {
                state.isNotificationAvailable = false;
                state.notificationMessage = '';
            }
        },
        actions: {
            queryAppVersion({commit}) {
                start_timing('appVersionRequest');
                Vue.http.get(getAppVersionUrl())
                    .then(function (response) {
                        let appVersion = response.data;

                        commit('SET_APP_VERSION', appVersion);
                        end_timing('appVersionRequest');
                    }, function (response) {
                        end_timing('appVersionRequest');
                    });
            },
            addActivity({commit}) {
                commit('INCREMENT_ACTIVITY');
            },
            removeActivity({commit}) {
                commit('DECREMENT_ACTIVITY');
            },
            sendNotification({commit}, notificationMessage) {
                commit('SET_NOTIFICATION', notificationMessage);
                let func = function() {
                    commit('CLEAR_NOTIFICATION');
                }
                setTimeout(func, 1500);
            }
        }
    }
;
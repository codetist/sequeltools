const modalDialogModule = {
        namespaced: true,
        state: {
            visible: false,
            options: {
                caption: null,
                message: null,
                buttons: []
            }
        },
        getters: {
            visible: state => state.visible,
            options: state => state.options
        },
        mutations: {
            SET_VISIBILITY(state, visible) {
                state.visible = visible;
            },
            SET_OPTIONS(state, options) {
                if (!options) options = {};
                if (!options.caption) options.caption = 'Message';
                if (!options.buttons) options.buttons = [];
                if (options.buttons.length==0) {
                    options.buttons.push ({ text : 'Ok' });
                }
                state.options = options;
            }
        },
        actions: {
            open({commit}, options) {
                commit('SET_OPTIONS', options);
                commit('SET_VISIBILITY', true);
            },
            close({commit}) {
                commit('SET_VISIBILITY', false);
            }
        }
    }
;
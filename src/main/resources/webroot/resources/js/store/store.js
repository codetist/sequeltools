Vue.use(Vuex);

let store = new Vuex.Store({
    strict: !isProduction(),
    modules: {
        app: appModule,
        databases: databasesModule,
        sessions: sessionsModule,
        modalDialog: modalDialogModule
    }
});
Vue.component('databaseSelector', {
    template: `
        <select v-model="currentDatabase" title="Choose database connection">
            <option v-for="database in availableDatabases" v-bind:value="database.id">
                {{database.description}}
            </option>
        </select>    
    `,
    computed: {
        currentDatabase: {
            get() {
                return this.$store.getters['databases/currentDatabase'];
            },
            set(database) {
                this.$store.dispatch('databases/setCurrentDatabase', database);
                this.$store.dispatch('sessions/setSearchTerm', '');
            }

        },
        availableDatabases() {
            return this.$store.getters['databases/availableDatabases'];
        }
    }
});
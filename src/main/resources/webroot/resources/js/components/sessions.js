Vue.component('sessions', {
    template: `
        <div class="sessions_list">
            <session v-for="session in sessions" v-bind:session="session" v-bind:key="session.SID"></session>
        </div>
   `,
    methods: {
      calculatePages: function(pageCount) {
          this.$store.dispatch('sessions/calculatePages', pageCount);
      }
    },
    computed: {
        sessions() {
            let currentPage = this.$store.getters['sessions/paging'].currentPage;
            let currentSessionsPerPage = this.$store.getters['sessions/paging'].currentSessionsPerPage;
            let sessions = this.$store.getters['sessions/sessions'];

            this.calculatePages(sessions.length);

            if (sessions.length > currentSessionsPerPage) {
                let start = (currentPage - 1) * currentSessionsPerPage;
                let end = start + currentSessionsPerPage;
                sessions = sessions.slice(start, end);
            }
            return sessions;
        }
    }
});
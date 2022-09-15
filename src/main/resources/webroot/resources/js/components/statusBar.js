Vue.component('statusBar', {
    template: `
        <div class="status_bar">
            <div class="status_bar_panel">                                
                <div v-if="pages && pages.length>0">
                    Sessions per Page&nbsp;
                    <select v-model="currentSessionsPerPage">
                        <option v-for="sessionPerPage in sessionsPerPage">
                            {{sessionPerPage.pages}}
                         </option>
                     </select>
                 </div>                                   
            </div>            
            
            <div v-if="isNotificationAvailable && !appActivity" class="status_bar_panel text_normal">
                <span class="pulsate_once_slow"><i class="fas fa-info-circle" />&nbsp;{{notificationMessage}}</span>
            </div>

            <div v-if="isTextQueryApplied && !appActivity && !isNotificationAvailable" class="status_bar_panel text_normal">
                <span class="clickable" @click="clearSearchTerm" title="Click to clear filter">Text filter applied: {{sessionCount}} session(s)</span>
            </div>

            <div v-if="appActivity" class="status_bar_panel">
                <loading></loading>
            </div>

            <div class="status_bar_panel">
                <div v-if="pages && pages.length>0">
                    <select v-model="currentPage">
                        <option v-for="page in pages" v-bind:value="page.page">
                            {{page.range}}
                        </option>
                    </select>            
                    &nbsp;Page {{currentPage}} of {{pages.length}}&nbsp;
                    <button @click="previousPage()"><i class="clickable"></i> previous </button> | 
                    <button @click="nextPage()">next <i class="clickable"></i></button>
                </div> 
            </div>
        </div> 
    `,
    computed: {
        currentSessionsPerPage: {
            get() {
                return this.$store.getters['sessions/paging'].currentSessionsPerPage;
            },
            set(value) {
                this.$store.dispatch('sessions/setCurrentSessionsPerPage', value);
            }
        },
        currentPage: {
            get() {
                return this.$store.getters['sessions/paging'].currentPage;
            },
            set(value) {
                this.$store.dispatch('sessions/setCurrentPage', value);
            }
        },
        appActivity: {
            get() {
                return this.$store.getters['app/activity'];
            }
        },
        pages() {
            return this.$store.getters['sessions/paging'].pages;
        },
        sessionsPerPage() {
            return this.$store.getters['sessions/paging'].sessionsPerPage;
        },
        isTextQueryApplied() {
            return this.$store.getters['sessions/isTextQueryApplied'];
        },
        sessionCount() {
            return this.$store.getters['sessions/sessions'].length;
        },
        isNotificationAvailable() {
            return this.$store.getters['app/isNotificationAvailable'];
        },
        notificationMessage() {
            return this.$store.getters['app/notificationMessage'];
        }
    },
    methods: {
        nextPage() {
            this.$store.dispatch('sessions/nextPage');
        },
        previousPage() {
            this.$store.dispatch('sessions/previousPage');
        },
        clearSearchTerm() {
            this.$store.dispatch('sessions/setSearchTerm', '');
            this.$store.dispatch('app/sendNotification', 'Text filter cleared');
        }
    }
});
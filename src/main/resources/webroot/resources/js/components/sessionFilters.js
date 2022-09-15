Vue.component('sessionFilters', {
    template: `
        <div class="sessions_filter text_intermediate text_normal nowrap">
            <div v-if="sessionStatistics.total">
                <span class="text_dark">By State </span>
                <span @click="clearFilters()" class="clickable">ALL ({{sessionStatistics.total}})</span>
                <span v-if="sessionStatistics.active">/</span>
                <span v-if="sessionStatistics.active" @click="toggleFilter('active')" :class="{ underline:filters.active}" class="session_active clickable">ACTIVE ({{sessionStatistics.active}})</span>
                <span v-if="sessionStatistics.inactive">/</span>
                <span v-if="sessionStatistics.inactive" @click="toggleFilter('inactive')" :class="{ underline:filters.inactive}" class="session_inactive clickable">INACTIVE ({{sessionStatistics.inactive}})</span>
                <span v-if="sessionStatistics.blocked">/</span>
                <span v-if="sessionStatistics.blocked" @click="toggleFilter('blocked')" :class="{ underline:filters.blocked}" class="session_blocked clickable">BLOCKED ({{sessionStatistics.blocked}})</span>
                <span v-if="sessionStatistics.blocking">/</span>
                <span v-if="sessionStatistics.blocking" @click="toggleFilter('blocking')" :class="{ underline:filters.blocking}" class="session_blocking clickable">BLOCKING ({{sessionStatistics.blocking}})</span>
                <span v-if="sessionStatistics.killed">/</span>
                <span v-if="sessionStatistics.killed"  @click="toggleFilter('killed')" :class="{ underline:filters.killed}" class="session_killed clickable">KILLED ({{sessionStatistics.killed}})</span>
                <span v-if="sessionStatistics.other">/</span>
                <span v-if="sessionStatistics.other"  @click="toggleFilter('other')" :class="{ underline:filters.other}" class="session_other clickable">OTHER ({{sessionStatistics.other}})</span>
            </div>
            <div v-else>
                <span class="text_dark">By State </span>
                No sessions
            </div>
    
            <div v-if="sessionStatistics.total">
                <span class="text_dark">By Type </span>
                <span v-if="sessionStatistics.user" @click="toggleFilter('user')"  :class="{ underline:filters.user}" class="clickable">USER ({{sessionStatistics.user}})</span>
                <span v-if="sessionStatistics.background">/</span> <span v-if="sessionStatistics.background"  @click="toggleFilter('background')"  :class="{ underline:filters.background}" class="clickable">BACKGROUND ({{sessionStatistics.background}})</span>
            </div>
            <div v-else>
                <span class="text_dark">By Type </span>
                No sessions            
            </div>
        </div>
    `,
    computed: {
        sessionStatistics() {
            let statistics = this.$store.getters['sessions/statistics'];
            return statistics;
        },
        filters() {
            let filters = this.$store.getters['sessions/filters'];
            return filters;
        }
    },
    methods: {
        toggleFilter(filterName) {
            this.$store.dispatch('sessions/toggleFilter', filterName);
        },
        clearFilters() {
            this.$store.dispatch('sessions/clearFilters');
        },
        checkFilters() {
            let filterName = '';
            let filters = this.$store.getters['sessions/filters'];
            let statistics = this.$store.getters['sessions/statistics'];

            for (let filter in filters) {
                if (filters.hasOwnProperty(filter)) {
                    if (filters[filter] && statistics[filter] == 0) {
                        this.$store.dispatch('sessions/toggleFilter', filter);
                        if (filterName.length > 0) {
                            filterName = filterName + ', ' + filter;
                        } else {
                            filterName = filter;
                        }
                    };
                }
            }
            return filterName;
        }
    },
    updated: function() {
        let filter = this.checkFilters();
        if (filter && filter.length>0) {
            this.$store.dispatch('app/sendNotification', 'Filter removed: ' + filter.toUpperCase());
        }
    }
});
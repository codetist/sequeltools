Vue.component('toolbar', {
    template: `
        <div class="toolbar noselect">
            <div class="toolbar_search text_toolbar">
                <div>
                    <select v-model="currentTextQueryOption" title="Allow text filter for all or a selected attribute only">
                        <option v-for="option in textQueryOptions" v-bind:value="option.field">
                            {{option.description}}
                         </option>
                     </select>                
                    <input type="text" v-model="searchTerm" title="Enter text filter" placeholder="Filter by keyword..." /> 
                    <span @click="resetTextFilter" class="clickable" title="Clear filter"><i class="fas fa-minus-circle"/> Reset</span>
                </div>
                |
                <div>
                    <database-selector></database-selector>
                </div>
                | 
                <div>                
                    <span @click="querySessions" class="clickable" title="Reload sessions">
                        <i class="fas fa-sync" v-bind:class="appActivityClass"/> Reload
                    </span>
                </div>
                |
                <div>
                    <span @click="toggleVisibility" class="clickable" title="Toggle toolbar">
                        <i v-if="!isVisible" class="fas fa-door-open" />
                        <i v-else class="fas fa-fw fa-door-closed" /> Options/About
                    </span>      
                </div>        
            </div>
            <div v-if="isVisible" @mouseleave="hide" class="toolbar_panel text_about">
                <div style="text-align:right;">
                    Toggle Display Mode: 
                    <i class="fas fa-moon" />&nbsp;<a class="clickable text_about" @click="enableDarkMode" href="#">Dark</a> 
                    / 
                    <i class="fas fa-sun" />&nbsp;<a class="clickable text_about" @click="enableLightMode" href="#">Light</a>
                </div>
                <div v-if="appVersion">
                    sequelTools Session Browser version {{appVersion.major}}.{{appVersion.minor}}.{{appVersion.patch}} {{appVersion.label}}<br/>
                    2019 by Marco Dehmel, <a class="clickable text_about" href="https://github.com/codetist/sequeltools"target="_blank">https://github.com/codetist/sequeltools</a>
                </div>
                <div>
                    <a class="clickable text_about" href="licenses.html" target="_blank">Licenses</a>                                        
                </div>
            </div>
        </div>    
    `,
    data: function() {
        return {
            isVisible: false
        }
    },
    computed: {
        searchTerm: {
            get() {
                return this.$store.getters['sessions/textQuery'].searchTerm;
            },
            set(value) {
                this.$store.dispatch('sessions/setSearchTerm', value);
            }
        },
        currentTextQueryOption: {
            get() {
                return this.$store.getters['sessions/textQuery'].option;
            },
            set(value) {
                this.$store.dispatch('sessions/setTextQueryOption', value);
            }
        },
        currentDatabase: {
            get() {
                return this.$store.getters['databases/currentDatabase'];
            },
            set(value) {
                this.$store.dispatch('databases/setCurrentDatabase', value);
            }
        },
        textQueryOptions: {
            get() {
                return this.$store.getters['sessions/textQueryOptions'];
            }
        },
        dateFormatter() {
            return this.$store.getters['app/dateFormatter'];
        },
        appVersion() {
            return this.$store.getters['app/appVersion'];
        },
        appActivityClass: function() {
            if (this.$store.getters['app/isActive'])
                return 'fa-spin';
            return '';
        }
    },
    methods: {
        resetTextFilter: function() {
            let searchTerm = this.searchTerm;
            this.searchTerm = "";
            this.currentTextQueryOption = "";
            if (searchTerm && searchTerm.length>0) {
                this.$store.dispatch('app/sendNotification', 'Text filter cleared');
            }
        },
        querySessions: function() {
            this.$store.dispatch('sessions/querySessions', {
                currentDatabase: this.currentDatabase,
                dateFormatter: this.dateFormatter
            });

        },
        queryAvailableDatabases: function() {
            this.$store.dispatch('databases/queryAvailableDatabases');
        },
        queryAppVersion: function() {
            this.$store.dispatch('app/queryAppVersion');
        },
        toggleVisibility: function() {
            this.isVisible = !this.isVisible;
        },
        hide: function() {
            this.isVisible = false;
        },
        enableDarkMode: function() {
            changeStyleMode('dark');
        },
        enableLightMode: function() {
            changeStyleMode('light');
        }
    },
    watch: {
        currentDatabase: function() {
            this.querySessions();
        }
    },
    created: function() {
        this.queryAvailableDatabases();
        this.queryAppVersion();
    }
});
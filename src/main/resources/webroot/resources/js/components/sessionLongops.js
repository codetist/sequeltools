Vue.component('sessionLongops', {
    props: [ 'sessionId', 'serialNumber', 'dateFormatter' ],
    data: function() {
        return {
            unfoldLongops: false,
            sessionLongopsList: [],
            activeQuery: false,
            timerIntervals: [1, 2, 5, 10, 30 ,60],
            timerIntervalIndex: 2,
            timerActive: false,
            timerRef: null,
            success: false
        }
    },
    template: `
        <div>
            <div class="session_details_container">
                <div class="session_basics">                    
                </div>
                
                <div class="session_details_operations nowrap text_dark noselect">
                    <span class="clickable" v-bind:class="{ 'text_normal': unfoldLongops }" @click="toggleDetails" title="Toggle more information"><i class="fas fa-ruler" /> Details</span><br/>
                    <br/>                                                 
                    <span class="clickable" v-bind:class="{ 'text_normal': timerActive }" @click="toggleTimer" title="Toggle auto refresh"><i class="fas fa-clock" /> Auto</span>
                    <span v-bind:class="{ 'clickable': !timerActive }" @click="setTimerInterval" title="Toggle timer interval">[{{currentTimerInterval}}s]</span></br>
                    
                    <span v-if="!success" class="clickable" v-bind:class="{'text_normal': activeQuery}" @click="querySessionLongops" title="Refresh data"><i class="fas fa-sync" v-bind:class="{'fa-spin text_normal': activeQuery}" /> Reload</span>                      
                    <span v-else class="pulsate_once"><i class="fas fa-fw fa-check-circle" /> Success</span>
                </div>                                           
            
                <div v-if="!isLongopsListAvailable" class="session_details_block flex_col">
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| No LongOps</div>
                    </div>                            
                </div>
                <div v-if="isLongopsListAvailable" class="session_details_block flex_col">
                    <div v-for="(longop, index) in sessionLongopsList" class="session_details_group">
                        <div class="session_details_caption text_intermediate">| <span v-html="longop.OPNAME"></span> 
                            - {{getPercentage(longop.SOFAR,longop.TOTALWORK)}}<span v-if="longop.TIME_REMAINING==0">, completed <i class="fas fa-check-circle" />
                            </span><span style="z-index: 7;" v-else>, <span v-html="longop.TIME_REMAINING"></span>s remaining <i class="fas fa-spin fa-spinner" /></span>                            
                        </div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">Target</span>&nbsp;&nbsp;<span v-html="longop.TARGET_DESC"></span></div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">Units</span>&nbsp;&nbsp;<span v-html="longop.UNITS"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Message</span>&nbsp;&nbsp;<span v-html="longop.MESSAGE"></span></div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">Elapsed</span>&nbsp;&nbsp;<span v-html="longop.ELAPSED_SECONDS"></span>s</div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">Remaining</span>&nbsp;&nbsp;<span v-html="longop.TIME_REMAINING"></span>s</div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">Start time</span>&nbsp;&nbsp;<span v-html="longop.START_TIME"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Last update</span>&nbsp;&nbsp;<span v-html="longop.LAST_UPDATE_TIME"></span></div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">&nbsp;</span>&nbsp;</div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal nowrap"><span class="text_dark">SQL Id</span>&nbsp;&nbsp;<span v-html="longop.SQL_ID"></span></div>
                        <div v-if="unfoldLongops" class="session_details_value text_normal"><span class="text_dark">Statement</span>&nbsp;&nbsp;<span v-html="longop['SQT#SQL_FULLTEXT']"></span></div>
                    </div>                                            
                </div>                 
                            
            </div>
        </div>
   `,
    computed: {
        currentDatabase: {
            get() {
                return this.$store.getters['databases/currentDatabase'];
            }
        },
        currentTimerInterval: function() {
            return this.timerIntervals[this.timerIntervalIndex];
        },
        isLongopsListAvailable: function() {
            if (this.sessionLongopsList && this.sessionLongopsList.length > 0) {
                return true;
            }
            return false;
        },
    },
    methods: {
        emptySessionLongopsList: function() {
            this.sessionLongopsList.splice(0, this.sessionLongopsList.length);
        },
        querySessionLongops: function() {
            if (this.activeQuery || this.success) return;

            let queryFunc = this.setQueryActive;
            let disableFunc = this.disableTimer;
            let formatFunc = this.formatDate;
            let successFunc = this.showSuccess;
            let databaseToQuery = this.currentDatabase;
            let sessionLongopsList = this.sessionLongopsList;
            let emptySessionLongopsList = this.emptySessionLongopsList;

            start_timing('sessionLongopsRequest');
            queryFunc(true);

            Vue.http.get(getLongOpsUrl(databaseToQuery, this.sessionId, this.serialNumber))
                .then(function(response) {
                        emptySessionLongopsList();
                        let longOps = response.data.sessionLongOps;
                        longOps.forEach(function(element) {
                            element = printObjectIfAvailable(element);
                            element.LAST_UPDATE_TIME = formatFunc(element.LAST_UPDATE_TIME);
                            element.START_TIME = formatFunc(element.START_TIME);
                            sessionLongopsList.push(element);
                        });
                        queryFunc(false);
                        successFunc();
                        end_timing('sessionLongopsRequest');
                    },
                    function(response) {
                        queryFunc(false);
                        disableFunc();
                        showRequestError(store, response, 'Error while retrieving session longops');
                        end_timing('sessionLongopsRequest');
                    }
                )
        },
        setQueryActive: function(boolean) {
            this.activeQuery = boolean;
        },
        formatDate: function(dateString) {
            return formatDate(dateString, this.dateFormatter);
        },
        printIfAvailable: function(value) {
            printValueIfAvailable(value);
        },
        setTimerInterval: function() {
            if (this.timerActive) return;

            let index = this.timerIntervalIndex+1;
            if (index > this.timerIntervals.length-1) {
                index = 0;
            }
            this.timerIntervalIndex = index;
        },
        disableTimer: function() {
            this.timerActive = false;
            if (this.timerRef) window.clearInterval(this.timerRef);
        },
        toggleTimer: function() {
            if (this.timerActive) {
                this.timerActive = false;
                this.disableTimer();
            } else {
                this.timerActive = true;
                this.timerRef = window.setInterval(
                    this.querySessionLongops, this.currentTimerInterval * 1000);
            }
        },
        toggleDetails: function() {
            this.unfoldLongops = !this.unfoldLongops;
        },
        getPercentage: function(sofar, total) {
            if (sofar == total) return '100%';
            if (hasValue(sofar) && hasValue(total)) {
                return Math.round(sofar * 100 / total) + '%'
            }
            return '';
        },
        showSuccess: function() {
            this.success = true;
            setTimeout(this.hideSuccess,500);
        },
        hideSuccess: function() {
            this.success = false;
        }
    },
    created: function() {
        this.querySessionLongops();
    },
    beforeDestroy: function() {
        this.disableTimer();
    }
});
Vue.component('sessionDetails', {
    props: [ 'sessionId', 'serialNumber', 'dateFormatter' ],
    data: function() {
        return {
            section: 'statement',
            sessionDetailsList: [],
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
            <div v-if="sessionDetails" class="session_details_container">
                <div class="session_basics">                    
                </div>
                <div class="session_details_operations nowrap text_dark noselect">                    
                    <span class="clickable" v-bind:class="{ 'text_normal': section=='statement'}" @click="selectSection('statement')" title="Show current SQL statement"><i class="fas fa-align-left" /> SQL</span><br/>
                    <span class="clickable" v-bind:class="{ 'text_normal': section=='objects'}" @click="selectSection('objects')" title="Show objects details"><i class="fas fa-cubes" /> Objects</span><br/>
                    <span class="clickable" v-bind:class="{ 'text_normal': section=='waits'}" @click="selectSection('waits')" title="Show current wait details"><i class="fas fa-clock" /> Waits</span><br/>                                        
                    <span class="clickable" v-bind:class="{ 'text_normal': section=='raw'}" @click="selectSection('raw')" title="Show raw session data"><i class="fas fa-table" /> Raw</span><br/>
                    <br/>                    
                    <span class="clickable" v-bind:class="{ 'text_normal': timerActive }" @click="toggleTimer" title="Toggle auto refresh"><i class="fas fa-clock" /> Auto</span>
                    <span v-bind:class="{ 'clickable': !timerActive }" @click="setTimerInterval" title="Toggle timer interval">[{{currentTimerInterval}}s]</span></br>
                    
                    <span v-if="!success" class="clickable" v-bind:class="{'text_normal': activeQuery}" @click="querySessionDetails" title="Refresh data"><i class="fas fa-sync" v-bind:class="{'fa-spin text_normal': activeQuery}" /> Reload</span>                      
                    <span v-else class="pulsate_once"><i class="fas fa-check-circle" /> Success</span>                      
                </div>                                           
            
                <div v-if="section=='waits' " class="session_details_block">
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| Wait Event</div>                    
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Event#</span>&nbsp;&nbsp;<span v-html="sessionDetails['EVENT#']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Event</span>&nbsp;&nbsp;<span v-html="sessionDetails.EVENT"></span></div>                    
                        <div class="session_details_caption text_intermediate">| Wait Class</div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Wait Class#</span>&nbsp;&nbsp;<span v-html="sessionDetails['WAIT_CLASS#']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Wait Class</span>&nbsp;&nbsp;<span v-html="sessionDetails.WAIT_CLASS"></span></div>
                    </div>                    
                                    
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| Wait Event Parameter</div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">P1 Text</span>&nbsp;&nbsp;<span v-html="sessionDetails.P1TEXT"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">P1 Value</span>&nbsp;&nbsp;<span v-html="sessionDetails.P1"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">P2 Text</span>&nbsp;&nbsp;<span v-html="sessionDetails.P2TEXT"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">P2 Value</span>&nbsp;&nbsp;<span v-html="sessionDetails.P2"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">P3 Text</span>&nbsp;&nbsp;<span v-html="sessionDetails.P3TEXT"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">P3 Value</span>&nbsp;&nbsp;<span v-html="sessionDetails.P3"></span></div>
                    </div>
                    
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| Wait Timing</div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">State</span>&nbsp;&nbsp;<span v-html="sessionDetails.STATE"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Wait Time (&micro;s)</span>&nbsp;&nbsp;<span v-html="sessionDetails.WAIT_TIME_MICRO"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Time Since Last Wait (s)</span>&nbsp;&nbsp;<span v-html="sessionDetails.TIME_SINCE_LAST_WAIT_MICRO"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Last Call ET (s)</span>&nbsp;&nbsp;<span v-html="sessionDetails.LAST_CALL_ET"></span></div>
                    </div>                    
                </div>
                
                <div v-if="section=='objects'" class="session_details_block">
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| Row Wait Object</div>                    
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Owner</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#ROW_OBJECT_OWNER']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Name</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#ROW_OBJECT_NAME']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Type</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#ROW_OBJECT_TYPE']"></span></div>
                    </div>
                    <div class="session_details_group">                        
                        <div class="session_details_caption text_intermediate">| PL/SQL Entry</div>                    
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Owner</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_ENTRY_OWNER']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Object</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_ENTRY_OBJECT_NAME']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Program</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_ENTRY_PROCEDURE']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Type</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_ENTRY_OBJECT_TYPE']"></span></div>
                    </div>
                    <div class="session_details_group">                        
                        <div class="session_details_caption text_intermediate">| PL/SQL Current</div>                    
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Owner</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_OWNER']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Object</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_OBJECT_NAME']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Program</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_PROCEDURE']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Type</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#PLSQL_OBJECT_TYPE']"></span></div>                        
                    </div>
                </div>         
                
                <div v-if="section=='statement'" class="session_details_block">
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| SQL</div>                                                                    
                        <div class="session_details_value text_normal" v-html="sessionDetails['SQT#SQL_FULLTEXT']"></div>
                    
                        <div class="session_details_caption text_intermediate">| SQL Details</div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Command Type</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQT#COMMAND_NAME']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Execution Start</span>&nbsp;&nbsp;<span v-html="sessionDetails['SQL_EXEC_START']"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">SQL Id</span>&nbsp;&nbsp;<span v-html="sessionDetails.SQL_ID"></span></div>
                        
                        
                    </div>
                    <div class="session_details_group">
                        
                        <div class="session_details_caption text_intermediate">| Previous SQL</div>                                                                    
                        <div class="session_details_value text_normal" v-html="sessionDetails['SQT#PREV_SQL_FULLTEXT']"></div>
                        
                        <div class="session_details_caption text_intermediate">| Previous SQL Details</div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Execution Start</span>&nbsp;&nbsp;<span v-html="formatDate(sessionDetails.PREV_EXEC_START)"></span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">SQL Id</span>&nbsp;&nbsp;<span v-html="sessionDetails.PREV_SQL_ID"></span></div>
                        
                    </div>
                </div>
                
                <div v-if="section=='raw'" class="session_details_block">
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| Raw Session Data</div>                    
                        <div class="session_details_value text_normal">
                            <searchable-table v-bind:tableData="sessionDetailsTable"></searchable-table>                          
                        </div>                        
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
        sessionDetails: function() {
            if (this.sessionDetailsList && this.sessionDetailsList[0]) {
                return this.sessionDetailsList[0];
            }
            return {}
        },
        sessionDetailsTable: function() {
            let detailsTable = [];
            if (this.sessionDetails) {
                let sessionDetails = this.sessionDetails;

                Object.keys(sessionDetails).forEach(function(key, index){
                    if (!key.startsWith('SQT#')) {
                        if (sessionDetails.hasOwnProperty(key)) {
                            detailsTable.push({attribute: key, value: sessionDetails[key]})
                        }
                    }
                })
            }
            return detailsTable;
        },
        currentTimerInterval: function() {
            return this.timerIntervals[this.timerIntervalIndex];
        }
    },
    methods: {
        emptySessionDetailsList: function() {
            this.sessionDetailsList.splice(0, this.sessionDetailsList.length);
        },
        querySessionDetails: function() {
            if (this.activeQuery || this.success) return;

            let queryFunc = this.setQueryActive;
            let disableFunc = this.disableTimer;
            let formatFunc = this.formatDate;
            let successFunc = this.showSuccess;
            let databaseToQuery = this.currentDatabase;
            let sessionDetailsList = this.sessionDetailsList;
            let emptySessionDetailsList = this.emptySessionDetailsList;

            start_timing('sessionDetailsRequest');
            queryFunc(true);

            Vue.http.get(getSessionUrl(databaseToQuery, this.sessionId))
                .then(function(response) {
                        emptySessionDetailsList();
                        let sessionDetails = printObjectIfAvailable(response.data.session);
                        sessionDetails.SQL_EXEC_START = formatFunc(sessionDetails.SQL_EXEC_START);
                        sessionDetails.PREV_EXEC_START = formatFunc(sessionDetails.PREV_EXEC_START);
                        sessionDetails.LOGON_TIME = formatFunc(sessionDetails.LOGON_TIME);
                        sessionDetailsList.push(sessionDetails);

                        queryFunc(false);
                        successFunc();
                        end_timing('sessionDetailsRequest');
                    },
                    function(response) {
                        queryFunc(false);
                        disableFunc();
                        showRequestError(store, response, 'Error while retrieving session details');
                        end_timing('sessionDetailsRequest');
                    }
                )
        },
        selectSection: function(sectionName) {
            this.section = sectionName;
        },
        setQueryActive: function(boolean) {
            this.activeQuery = boolean;
        },
        formatDate: function(dateString) {
            return formatDate(dateString, this.dateFormatter);
        },
        printIfAvailable: function(value) {
            return printValueIfAvailable(value);
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
                    this.querySessionDetails, this.currentTimerInterval * 1000);
            }
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
        this.querySessionDetails();
    },
    beforeDestroy: function() {
        this.disableTimer();
    }
});
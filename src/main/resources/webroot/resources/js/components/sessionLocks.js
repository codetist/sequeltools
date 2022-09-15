Vue.component('sessionLocks', {
    props: [ 'sessionId', 'serialNumber', 'dateFormatter' ],
    data: function() {
        return {
            sessionLocksList: [],
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
                    <span class="clickable" v-bind:class="{ 'text_normal': timerActive }" @click="toggleTimer" title="Toggle auto refresh"><i class="fas fa-clock" /> Auto</span>
                    <span v-bind:class="{ 'clickable': !timerActive }" @click="setTimerInterval" title="Toggle timer interval">[{{currentTimerInterval}}s]</span></br>
                    
                    <span v-if="!success" class="clickable" v-bind:class="{'text_normal': activeQuery}" @click="querySessionLocks" title="Refresh data"><i class="fas fa-sync" v-bind:class="{'fa-spin fa-fw text_normal': activeQuery}" /> Reload</span>                      
                    <span v-else class="pulsate_once"><i class="fas fa-check-circle" /> Success</span>
                </div>                                           
            
                <div v-if="!isLocksListAvailable" class="session_details_block flex_col">
                    <div class="session_details_group">
                        <div class="session_details_caption text_intermediate">| No Locks</div>
                    </div>                            
                </div>
                <div v-if="isLocksListAvailable" class="session_details_block flex_col">
                    <div v-for="(lock, index) in sessionLocksList" class="session_details_group">
                        <div class="session_details_caption text_intermediate">| 
                            <span v-if="lock['SQT#LOCK_OBJECT_OWNER'] && lock['SQT#LOCK_OBJECT_NAME']">{{lock['SQT#LOCK_OBJECT_OWNER']}}.{{lock['SQT#LOCK_OBJECT_NAME']}}</span>
                            <span v-else>Unknown Object</span>
                        </div>                        
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Lock Mode</span>&nbsp;&nbsp;<span>{{lock.LOCKED_MODE}}, {{lock.LOCKED_MODE_DESCRIPTION}}</span></div>
                        <div class="session_details_value text_normal nowrap"><span class="text_dark">Object Type</span>&nbsp;&nbsp;<span v-if="lock['SQT#LOCK_OBJECT_TYPE']">{{lock['SQT#LOCK_OBJECT_TYPE']}}</span></div>                                                
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
        isLocksListAvailable: function() {
            if (this.sessionLocksList && this.sessionLocksList.length > 0) {
                return true;
            }
            return false;
        },
    },
    methods: {
        emptySessionLocksList: function() {
            this.sessionLocksList.splice(0, this.sessionLocksList.length);
        },
        querySessionLocks: function() {
            if (this.activeQuery || this.success) return;

            let queryFunc = this.setQueryActive;
            let disableFunc = this.disableTimer;
            let successFunc = this.showSuccess;
            let databaseToQuery = this.currentDatabase;
            let sessionLocksList = this.sessionLocksList;
            let emptySessionLocksList = this.emptySessionLocksList;

            start_timing('sessionLocksRequest');
            queryFunc(true);

            Vue.http.get(getSessionLocksUrl(databaseToQuery, this.sessionId))
                .then(function(response) {
                        emptySessionLocksList();
                        let locks = response.data.sessionLocks;
                        locks.forEach(function(element) {
                            element = printObjectIfAvailable(element);
                            sessionLocksList.push(element);
                        });
                        queryFunc(false);
                        successFunc();
                        end_timing('sessionLocksRequest');
                    },
                    function(response) {
                        queryFunc(false);
                        disableFunc();
                        showRequestError(store, response, 'Error while retrieving session locks');
                        end_timing('sessionLocksRequest');
                    }
                )
        },
        setQueryActive: function(boolean) {
            this.activeQuery = boolean;
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
                    this.querySessionLocks, this.currentTimerInterval * 1000);
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
        this.querySessionLocks();
    },
    beforeDestroy: function() {
        this.disableTimer();
    }
});
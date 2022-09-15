Vue.component('session', {
    props: [ 'session' ],
    template: `
        <div class="session text_small" :class="'session_' + sessionColor">
            <div class="session_content">
                <div class="session_default_view">
                    <div class="session_basics text_normal nowrap">
                        <nobr>
                            <span class="detail_sid text_huge">{{session.SID}}/</span>
                            <span class="detail_serial text_small">{{session['SERIAL#']}}</span>
                        </nobr>
                        <span class="text_grayish text_small">{{session.STATUS}}</span>
                        <nobr>
                            <span v-if="session.BLOCK_INFO" class="text_highlight text_small text_bold">{{session.BLOCK_INFO}}</span>                                  
                        </nobr>
                        <span class="text_grayish text_small">{{session.TYPE}}</span>
                        <nobr>
                            <span class="text_grayish">{{session.LOGON_TIME}}</span>
                        </nobr>
                    </div>
                    <div class="session_operations noselect text_dark nowrap">
                        <span class="clickable" v-bind:class="{'text_normal':isComponentLoaded('sessionDetails')}" @click="toggleSessionDetails('sessionDetails')" title="Toggle Session Details"><i class="fas fa-info-circle" /> Details</span><br/>
                        <span class="clickable" v-bind:class="{'text_normal':isComponentLoaded('sessionLongops')}" @click="toggleSessionDetails('sessionLongops')" title="Toggle LongOps"><i class="fas fa-cog" /> LongOps</span><br/>
                        <span class="clickable" v-bind:class="{'text_normal':isComponentLoaded('sessionLocks')}" @click="toggleSessionDetails('sessionLocks')" title="Toggle Session Locks"><i class="fas fa-lock" /> Locks</span><br/>
                    </div>
                    <div class="session_details text_dark">
                        <div class="session_user">
                            <div class="session_detail">
                                <span class="nowrap">
                                    Connected As 
                                    <span class="text_medium text_grayish" v-html="session.USERNAME"></span>
                                </span>, 
                                <span class="nowrap">
                                    Current Schema
                                    <span class="text_medium text_grayish" v-html="session.SCHEMANAME"></span>
                                </span>
                            </div>
                        </div>
                        <div class="session_client">
                            <div class="session_detail">
                                <span>| OS User</span><br/>
                                <span class="text_medium text_normal" v-html="session.OSUSER"></span>
                            </div>
    
                            <div class="session_detail">
                                <span>| Machine</span><br/>
                                <span class="text_medium text_normal" v-html="session.MACHINE"></span>
                            </div>
    
                            <div class="session_detail">
                                <span>| Terminal</span><br/>
                                <span class="text_medium text_normal" v-html="session.TERMINAL"></span>
                            </div>
                            
                            <div class="session_detail">
                                <span>| Program</span><br/>
                                <span class="text_medium text_normal" v-html="session.PROGRAM"></span>
                            </div>                        
                        </div>
    
                        <div class="session_info">
                            <div class="session_detail">
                                <span>| Module</span><br/>
                                <span class="text_medium text_normal" v-html="session.MODULE"></span>
                            </div>
    
                            <div class="session_detail">
                                <span>| Action</span><br/>
                                <span class="text_medium text_normal" v-html="session.ACTION"></span>
                            </div>
                            
                            <div class="session_detail">
                                <span>| Client Info</span><br/>
                                <span class="text_medium text_normal" v-html="session.CLIENT_INFO"></span>
                            </div>
                            
                            <div class="session_detail">
                                <span>| Client Identifier</span><br/>
                                <span class="text_medium text_normal" v-html="session.CLIENT_IDENTIFIER"></span>
                            </div>                                                                            
                        </div>
    
                    </div>
                </div>
                <div v-if="isAnyComponentLoaded" class="session_advanced_view">
                    <component v-for="subComponent in subComponents" v-bind:is="subComponent.type" :key="subComponent.sid" :sessionId="subComponent.sid" :serialNumber="subComponent.serial" :dateFormatter="dateFormatter"></component>
                </div>
            </div>
        </div>
   `,
    data: function() {
        return {
            subComponents: []
        }
    },
    computed: {
        dateFormatter() {
            return this.$store.getters['app/dateFormatter'];
        },
        sessionColor() {
            let status = this.session.STATUS;
            if (status && (status == 'ACTIVE' || status == 'INACTIVE' || status == 'KILLED')) {
                return status.toLowerCase();
            }
            return 'other';
        }
    },
    methods: {
        isAnyComponentLoaded: function() {
            if (this.subComponents && this.subComponents.length > 0) {
                return true;
            }
            return false;
        },
        isComponentLoaded: function(componentName) {
            if (this.isAnyComponentLoaded()) {
                if (this.subComponents[0].type == componentName) return true;
            }
            return false;
        },
        toggleSessionDetails: function(componentName) {
            let component = {
                'sid': this.session.SID,
                'serial': this.session['SERIAL#'],
                'type': componentName};

            if (this.subComponents && this.subComponents.length == 0) {
                this.subComponents.push(component);

            } else {
                if (componentName == this.subComponents[0].type) {
                    this.subComponents = [];
                } else {
                    this.subComponents = [];
                    this.subComponents.push(component);
                }
            }
        }
    }
});
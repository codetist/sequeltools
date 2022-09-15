Vue.component('modalDialog', {
    template: `    
        <div v-if="visible && options" class="dialog_background text_intermediate">    
            <div class="dialog_window">
                <div class="dialog_window_caption text_highlight text_bold">
                    {{options.caption}}
                </div>
                <div class="dialog_window_message text_grayish">
                    <div>{{options.message}}</div>
                    <div class="dialog_window_button_bar">
                        <div v-for="(button, index) in options.buttons" @click="buttonClick(index)" class="dialog_button clickable">
                            {{button.text}}
                        </div>
                    </div>
                </div>                                                
            </div>            
        </div>
   `,
    methods: {
        buttonClick: function(buttonIndex) {
            let buttons = this.$store.getters['modalDialog/options'].buttons;
            if (buttons && buttons[buttonIndex] && buttons[buttonIndex].callback) {
                buttons[buttonIndex].callback();
            }
            this.$store.dispatch('modalDialog/close');
        }
    },
    computed: {
        visible: {
            get() {
                return this.$store.getters['modalDialog/visible'];
            }
        },
        options: {
            get() {
                return this.$store.getters['modalDialog/options'];
            }
        }
    }
});
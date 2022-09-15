Vue.component('searchableTable', {
    props: ['tableData'],
    data: function () {
        return {
            searchTerm: ''
        }
    },
    template: `
        <div>                  
            <table>
                <th colspan="2" align="left" class="text_dark">
                    <input type="text" v-model="searchTerm" title="Enter text filter" placeholder="Filter by keyword..."/>&nbsp; 
                    <span @click="clearSearchTerm" class="clickable" title="Clear filter"><i class="far fa-minus-square" /> Clear</span>                
                </th>
                <tr v-if="filteredTableData.length==0">
                    <td class="text_dark" colspan="2">No data</td>
                </tr>                            
                <tr v-for="(row) in filteredTableData">
                    <td class="text_dark">{{row.attribute}}</td>
                    <td v-html="row.value"></td>
                </tr>
            </table>
        </div>     
    `,
    computed: {
        filteredTableData() {
            let searchTerm = this.searchTerm;
            let tableData = this.tableData;

            if (searchTerm) {
                tableData = tableData.filter(function (row) {
                    return Object.keys(row).some(function (key) {
                        return String(row[key]).toLowerCase().indexOf(searchTerm) > -1;
                    });
                });
            }

            return tableData;
        }
    },
    methods: {
        clearSearchTerm: function() {
            this.searchTerm = '';
        }
    }
});
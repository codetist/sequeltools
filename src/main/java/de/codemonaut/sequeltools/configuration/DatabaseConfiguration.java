package de.codemonaut.sequeltools.configuration;

import io.vertx.core.json.JsonObject;

public class DatabaseConfiguration extends AbstractConfiguration {

    private DatabaseTableConfiguration tableConfiguration;

    /**
     * constructor, sets configJson and created a DatabaseTableConfiguration object
     * @param configJson configJson
     */
    public DatabaseConfiguration(JsonObject configJson) {
        super(configJson);
        // set generic config description
        setConfigType("Database Configuration");
        // set specific config description or fail
        setConfigType("Database Configuration '" + getDataSourceName() + "'");
        this.tableConfiguration = new DatabaseTableConfiguration();

        if (configJson.containsKey("debug")) {
            JsonObject debug = configJson.getJsonObject("debug");
            if (debug.containsKey("enabled") && debug.getBoolean("enabled")) {
                this.tableConfiguration = new DatabaseTableConfiguration(debug);
            }
        }
    }

    /**
     * returns table configuration
     * @return table config
     */
    public DatabaseTableConfiguration getTableConfiguration() {
        return tableConfiguration;
    }

    /**
     * returns dataSourceName or IllegalArgumentException
     * @return datasourceName
     */
    public String getDataSourceName() {
        return getStringValue("dataSourceName");
    }

    /**
     * returns description or default dataSourceName
     * @return description
     */
    public String getDescription() {
        return getStringValue("description", getDataSourceName());
    }

    /**
     * returns jdbcUrl or IllegalArgumentException
     * @return url
     */
    public String getUrl() {
        return getStringValue("url");
    }

    /**
     * returns driver class or default value
     * @return driver
     */
    public String getDriver() {
        return getStringValue("driver", "oracle.jdbc.OracleDriver");
    }

    /**
     * returns if session cache should be used, default false
     * @return useSessionCache
     */
    public Boolean useSessionCache() {
        return getBooleanValue("useSessionCache", false);
    }

    /**
     * returns initial pool size or default value 1
     * @return initial pool size
     */
    public Integer getInitialPoolSize() {
        return getIntegerValue("initialPoolSize", 1);
    }

    /**
     * returns min pool size or default value 1
     * @return min pool size
     */
    public Integer getMinPoolSize() {
        return getIntegerValue("minPoolSize", 1);
    }

    /**
     * returns max pool size or default value 2
     * @return max pool size
     */
    public Integer getMaxPoolSize() {
        return getIntegerValue("maxPoolSize", 2);
    }

    /**
     * returns refresh interval or default value 60
     * @return refresh interval
     */
    public Integer getRefreshInterval() {
        return getIntegerValue("refreshInterval", 60);
    }

    /**
     * returns number of retry attempts when acquiring connections or default value 3
     * @return attempts
     */
    public Integer getAcquireRetryAttempts() {
        return getIntegerValue("acquireRetryAttempts", 3);
    }

    /**
     * returns checkout timeout in milliseconds or default 10000
     * @return timeout
     */
    public Integer getCheckoutTimeout() {
        return getIntegerValue("checkoutTimeout", 10000);
    }

    /**
     * returns true if connections should be checked on startup or default value true
     * @return boolean
     */
    public Boolean checkConnectionOnStartup() {
        return getBooleanValue("checkConnectionOnStartup", true);
    }

    /**
     * returns database user or empty string
     * @return
     */
    public String getUser() {
        return getStringValue("user", "");
    }

    /**
     * return database password or empty string
     * @return
     */
    public String getPassword() {
        return getStringValue("password", "");
    }

    /**
     * Validate that required properties exists
     */
    public void validate() throws IllegalArgumentException {
        super.validate();
        getDataSourceName();
        getUrl();
    }
}

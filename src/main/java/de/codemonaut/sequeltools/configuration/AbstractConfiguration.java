package de.codemonaut.sequeltools.configuration;

import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;

abstract class AbstractConfiguration {

    private Logger logger = LoggerFactory.getLogger(getClass());
    private String configType = "global";
    JsonObject configJson = null;

    /**
     * empty default constructor
     */
    AbstractConfiguration() {
    }

    /**
     * constructor, setting config Json
     * @param configJson configJson
     */
    AbstractConfiguration(JsonObject configJson) {
        this.configJson = configJson;
    }

    /**
     * Output an info log, telling that a config had no value and a default is used
     * @param property name of the config property
     * @param defaultValue the default value that has been used
     */
    private void logDefaultWarning(String property, String defaultValue) {
        logger.info(configType + ": Property '" + property + "' not set in configuration, using default value: " + defaultValue);
    }

    /**
     * check if a configuration key exists
     * @param key config key
     * @return boolean
     */
    private Boolean checkKey(String key) {
        return configJson.containsKey(key);
    }

    /**
     * checks if the give key contains a non-empty string value and returns it
     * in case no value exists defaultValue will be returned
     * @param key config key
     * @param defaultValue default value
     * @return defaultValue
     */
    String getStringValue(String key, String defaultValue) {
        if (checkKey(key) && !configJson.getString(key).isEmpty()) {
            return configJson.getString(key);
        }
        logDefaultWarning(key, defaultValue);
        return defaultValue;
    }

    /**
     * checks if the give key contains a non-empty string value and returns it
     * in case no value exists an exception is thrown
     * @param key config key
     * @return found value or IllegalArgumentException
     */
    String getStringValue(String key) throws IllegalArgumentException {
        if (checkKey(key) && !configJson.getString(key).isEmpty()) {
            return configJson.getString(key);
        }
        throw new IllegalArgumentException(configType + ": Attribute '" + key + "' needs to be set");
    }

    /**
     * checks if the give key contains a non-empty integer value and returns it
     * in case no value exists defaultValue will be returned
     * @param key config key
     * @param defaultValue  default value
     * @return defaultValue
     */
    Integer getIntegerValue(String key, Integer defaultValue) {
        if (checkKey(key) && configJson.getInteger(key) != null) {
            return configJson.getInteger(key);
        }
        logDefaultWarning(key, String.valueOf(defaultValue));
        return defaultValue;
    }

    /**
     * checks if the give key contains a non-empty integer value and returns it
     * in case no value exists an exception is thrown
     * @param key config key
     * @return found value or IllegalArgumentException
     */
    Integer getIntegerValue(String key) throws IllegalArgumentException {
        if (checkKey(key) && configJson.getInteger(key) != null) {
            return configJson.getInteger(key);
        }
        throw new IllegalArgumentException(configType + ": Attribute '" + key + "' needs to be set");
    }

    /**
     * checks if the give key contains a non-empty boolean value and returns it
     * in case no value exists defaultValue will be returned
     * @param key config key
     * @param defaultValue  default value
     * @return defaultValue
     */
    Boolean getBooleanValue(String key, Boolean defaultValue) {
        if (checkKey(key) && configJson.getBoolean(key) != null) {
            return configJson.getBoolean(key);
        }
        logDefaultWarning(key, String.valueOf(defaultValue));
        return defaultValue;
    }

    /**
     * checks if the give key contains a non-empty boolean value and returns it
     * in case no value exists an exception is thrown
     * @param key config key
     * @return found value or IllegalArgumentException
     */
    Boolean getBooleanValue(String key) throws IllegalArgumentException {
        if (checkKey(key) && configJson.getBoolean(key) != null) {
            return configJson.getBoolean(key);
        }
        throw new IllegalArgumentException(configType + ": Attribute '" + key + "' needs to be set");
    }

    /**
     * Sets a configuration name to be shown in error message
     * @param configType
     */
    void setConfigType(String configType) {
        this.configType = configType;
    }

    /**
     * Validate required parameters and throw IllegalArgumentException in case of errors
     */
    public void validate() throws IllegalArgumentException {
    }

}

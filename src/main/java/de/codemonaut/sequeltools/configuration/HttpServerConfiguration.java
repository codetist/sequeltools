package de.codemonaut.sequeltools.configuration;

import io.vertx.core.json.JsonObject;

public class HttpServerConfiguration extends AbstractConfiguration {

    /**
     * constructor, sets configJson and created a DatabaseTableConfiguration object
     * @param configJson configJson
     */
    public HttpServerConfiguration(JsonObject configJson) {
        super(configJson);
        setConfigType("HTTP Server Configuration");
    }

    /**
     * returns port or default value 8080
     * @return port
     */
    public Integer getPort() {
        return getIntegerValue("port", 8080);
    }

    /**
     * returns host or default value 127.0.0.1
     * @return host
     */
    public String getBindToHost() {
        return getStringValue("bindToHost", "127.0.0.1");
    }

    /**
     * returns base url or default value /
     * @return baseUrl
     */
    public String getBaseUrl() {
        String baseUrl = getStringValue("baseUrl", "/");
        if ((baseUrl.length() > 0) && !(baseUrl.substring(baseUrl.length() - 1).equals("/"))) {
            baseUrl = baseUrl + "/";
        }
        return baseUrl;
    }

    /**
     * Validate that required properties exists
     */
    public void validate() {
        super.validate();
    }

}

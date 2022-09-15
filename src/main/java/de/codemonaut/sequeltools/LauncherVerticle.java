package de.codemonaut.sequeltools;

import de.codemonaut.sequeltools.database.DatabaseVerticle;
import de.codemonaut.sequeltools.http.HttpServerVerticle;
import de.codemonaut.sequeltools.util.ConsoleOutput;
import de.codemonaut.sequeltools.util.ExceptionTools;
import io.reactivex.Observable;
import io.vertx.config.ConfigRetrieverOptions;
import io.vertx.config.ConfigStoreOptions;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Launcher;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.JULLogDelegate;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.reactivex.config.ConfigRetriever;
import io.vertx.reactivex.core.AbstractVerticle;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;

public class LauncherVerticle extends AbstractVerticle {

    private Logger logger = LoggerFactory.getLogger(LauncherVerticle.class);
    private List<String> dataSources = new ArrayList<>();
    private String configFile = "config.json";

    /**
     * Convenience method to run application from IDE
     *
     * @param args command line arguments
     */
    public static void main(String[] args) {

        Launcher.main(new String[]{
                "run", LauncherVerticle.class.getName(), ""
        });
    }

    /**
     * Verticle starter
     *
     * @param startPromise start promise
     */
    @Override
    public void start(Promise<Void> startPromise) {

        ConsoleOutput.printBanner();
        String tryConfig=System.getProperty("SQT_CONFIG_PATH");
        if (tryConfig!= null && !tryConfig.isEmpty()) {
            configFile = tryConfig;
        }
        vertx.fileSystem().rxExists(configFile).subscribe(result -> {
            if (result) {
                ConsoleOutput.print("Using configuration file: " + configFile);
                launchApplication(startPromise);
            } else {
                ConsoleOutput.print("ERROR: Configuration file not found: " + configFile);
            }
        });
    }

    /**
     * Verticle stopped
     *
     * @param stopPromise stop promise
     */
    @Override
    public void stop(Promise<Void> stopPromise) {

        ConsoleOutput.print("Application shutdown....");
        stopPromise.complete();
    }

    /**
     * set log level according to configuration file
     * @param config configuration json
     */
    private void setLogLevel(JsonObject config) {

        String logLevel = "";

        if (config.containsKey("application")) {
            JsonObject application = config.getJsonObject("application");
            if (application.containsKey("logLevel")) {
                logLevel = application.getString("logLevel");
            }
        }
        setLogLevel(logLevel);
    }

    /**
     * set log level according by string
     * @param logLevel string representing the desired level
     */
    private void setLogLevel(String logLevel) {

        Level level = null;

        try {
            level = Level.parse(logLevel.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.info("LogLevel could not be translated to existing Level, current logLevel will not be changed");
            logger.info("LogLevel from default configuration is '" + logLevel + "'");
        }

        if (level != null) {
            JULLogDelegate delegate = (JULLogDelegate) logger.getDelegate();
            java.util.logging.Logger unwrap = (java.util.logging.Logger) delegate.unwrap();
            unwrap.getParent().setLevel(level);
            logger.info("LogLevel set to " + level.toString() + " for " + unwrap.getParent().getClass().getCanonicalName());
        }
    }

    /**
     * Check if duplicate data sources exists. Throws IllegalArgumentException if duplicate is found
     * @param dataSourceName data source
     * @throws IllegalArgumentException thrown when duplicates found
     */
    private void checkDataSourceUniqueness(String dataSourceName) throws IllegalArgumentException{
        if (dataSources.contains(dataSourceName)) {
            throw new IllegalArgumentException("Duplicate dataSourceName found: " + dataSourceName + ", unique names required");
        } else {
            dataSources.add(dataSourceName);
        }
    }

    /**
     * Start the application
     *
     * @param startPromise start promise passed from vertx-start
     */
    private void launchApplication(Promise<Void> startPromise) {
        setLogLevel(Level.OFF.toString());

        JsonObject path = new JsonObject().put("path", configFile);
        ConfigRetrieverOptions configRetrieverOptions = new ConfigRetrieverOptions().addStore(new ConfigStoreOptions().setType("file").setConfig(path));
        // ConfigOptions are optional, default is FILE in config/config.json. From the documenation:
        // This path can be overridden using the vertx-config-path system property or VERTX_CONFIG_PATH environment variable.
        ConfigRetriever configRetriever = ConfigRetriever.create(vertx, configRetrieverOptions);

        configRetriever.rxGetConfig()
                .flatMap(config -> {
                    setLogLevel(config);
                    if (!config.containsKey("database") || config.getJsonObject("database").getJsonArray("connections").size() == 0) {
                        throw new IllegalArgumentException("Configuration file does not contain any database connections");
                    }
                    return Observable.fromIterable(config.getJsonObject("database").getJsonArray("connections"))
                            .cast(JsonObject.class)
                            .flatMapSingle(connectionConfig -> {
                                String dataSource = connectionConfig.getString("dataSourceName");
                                ConsoleOutput.print("Starting DatabaseService '" + dataSource + "'...");
                                checkDataSourceUniqueness(dataSource);
                                return vertx.rxDeployVerticle(DatabaseVerticle.class.getName(), new DeploymentOptions().setConfig(connectionConfig));
                            })
                            .doOnComplete(() -> ConsoleOutput.print("All DatabaseServices started successfully"))
                            .toList()
                            .flatMap(l -> vertx.rxDeployVerticle(HttpServerVerticle.class.getName(), new DeploymentOptions().setConfig(config))
                            )
                            .doAfterSuccess(message -> {
                                JsonObject httpServer = config.getJsonObject("httpServer");
                                String url = "http://" + httpServer.getString("bindToHost") + ":" + httpServer.getInteger("port");
                                ConsoleOutput.print("Application launched successfully, " + url);
                            });
                })
                .doOnError(err -> ConsoleOutput.print("ERROR: " + ExceptionTools.getRootCause(err) + "\nApplication failed to start!" ))
                .subscribe(id ->  startPromise.complete(), err -> this.getVertx().close());
    }
}

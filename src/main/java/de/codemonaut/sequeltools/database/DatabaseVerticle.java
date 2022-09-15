package de.codemonaut.sequeltools.database;

import com.mchange.v2.c3p0.ComboPooledDataSource;
import de.codemonaut.sequeltools.configuration.DatabaseConfiguration;
import de.codemonaut.sequeltools.util.ExceptionTools;
import io.vertx.core.Promise;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.serviceproxy.ServiceBinder;

import java.beans.PropertyVetoException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Properties;

public class DatabaseVerticle extends AbstractVerticle {

    public static final String CONFIG_ORACLEDB_QUEUE = "oracledb.queue.";
    private Logger logger = LoggerFactory.getLogger(getClass());

    /**
     * Verticle starter
     *
     * @param startPromise start promise
     */
    @Override
    public void start(Promise<Void> startPromise) {

        DatabaseConfiguration dbConfig = new DatabaseConfiguration(config());

        try {
            dbConfig.validate();
        } catch (IllegalArgumentException e) {
            startPromise.fail("DatabaseService '" + dbConfig.getDataSourceName() + ": Invalid configuration");
        }

        if (dbConfig.getTableConfiguration().hasDebugConfiguration()) {
            logger.warn("DatabaseService '" + dbConfig.getDataSourceName() + "' starting with debug configuration");
        }

        Properties properties = new Properties();
        properties.put("v$session.program", "sequelTools");
        properties.put("v$session.osuser", System.getProperty("user.name"));
        try {
            properties.put("v$session.machine", InetAddress.getLocalHost().getCanonicalHostName());
            properties.put("v$session.terminal", InetAddress.getLocalHost().getCanonicalHostName());
        } catch (UnknownHostException e) {
            logger.info("Could not determine hostname, will not set machine and terminal on database session");
        }

        ComboPooledDataSource dataSource = new ComboPooledDataSource();

        dataSource.setJdbcUrl(dbConfig.getUrl());

        if (!dbConfig.getUser().isEmpty()) {
            dataSource.setOverrideDefaultUser(dbConfig.getUser());
        } else {
            dataSource.setOverrideDefaultUser(null);
        }

        if (!dbConfig.getPassword().isEmpty()) {
            dataSource.setOverrideDefaultPassword(dbConfig.getPassword());
        } else {
            dataSource.setOverrideDefaultPassword(null);
        }

        try {
            dataSource.setDriverClass(dbConfig.getDriver());
        } catch (PropertyVetoException e) {
            throw new IllegalArgumentException(e);
        }
        dataSource.setInitialPoolSize(dbConfig.getInitialPoolSize());
        dataSource.setMinPoolSize(dbConfig.getMinPoolSize());
        dataSource.setMaxPoolSize(dbConfig.getMaxPoolSize());
        dataSource.setAcquireRetryAttempts(dbConfig.getAcquireRetryAttempts());
        dataSource.setProperties(properties);
        dataSource.setCheckoutTimeout(dbConfig.getCheckoutTimeout());

        JDBCClient jdbcClient = JDBCClient.create(vertx.getDelegate(), dataSource);

        OracleDatabaseService.create(jdbcClient, dbConfig, readyService -> {
            if (readyService.succeeded()) {
                ServiceBinder serviceBinder = new ServiceBinder(vertx.getDelegate());
                serviceBinder.setAddress(CONFIG_ORACLEDB_QUEUE + dbConfig.getDataSourceName())
                        .register(OracleDatabaseService.class, readyService.result());

                logger.info("DatabaseService '" + dbConfig.getDataSourceName() + "' successfully loaded");
                startPromise.complete();

            } else {
                logger.error("DatabaseService '" + dbConfig.getDataSourceName() + "' failed to start with: " + readyService.cause().getLocalizedMessage());
                logger.error(ExceptionTools.getStackTraceAsString(readyService.cause()));
                startPromise.fail("DatabaseService '" + dbConfig.getDataSourceName() + "' failed to start with: " + ExceptionTools.getRootCause(readyService.cause()));
            }
        });
    }
}
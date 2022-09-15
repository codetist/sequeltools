package de.codemonaut.sequeltools.http;

import de.codemonaut.sequeltools.configuration.HttpServerConfiguration;
import de.codemonaut.sequeltools.database.DatabaseVerticle;
import de.codemonaut.sequeltools.database.reactivex.OracleDatabaseService;
import de.codemonaut.sequeltools.util.ExceptionTools;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.reactivex.core.AbstractVerticle;
import io.vertx.reactivex.core.http.HttpServer;
import io.vertx.reactivex.core.http.HttpServerResponse;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.RoutingContext;
import io.vertx.reactivex.ext.web.common.template.TemplateEngine;
import io.vertx.reactivex.ext.web.handler.BodyHandler;
import io.vertx.reactivex.ext.web.handler.SessionHandler;
import io.vertx.reactivex.ext.web.handler.StaticHandler;
import io.vertx.reactivex.ext.web.sstore.LocalSessionStore;
import io.vertx.reactivex.ext.web.templ.handlebars.HandlebarsTemplateEngine;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class HttpServerVerticle extends AbstractVerticle {
    private Logger logger = LoggerFactory.getLogger(getClass());
    private Map<String, OracleDatabaseService> databaseServices = new HashMap<>();
    private Map<String, String> databaseNames = new HashMap<>();

    /**
     * Verticle starter
     *
     * @param startPromise start promise
     */
    @Override
    public void start(Promise<Void> startPromise) {

        JsonArray databaseConfigurations = config().getJsonObject("database").getJsonArray("connections");
        HttpServerConfiguration httpConfig = new HttpServerConfiguration(config().getJsonObject("httpServer"));
        httpConfig.validate();

        databaseConfigurations.stream()
                .map(JsonObject.class::cast)
                .forEach(item -> {
                    String dataSourceName = item.getString("dataSourceName");
                    OracleDatabaseService databaseService = de.codemonaut.sequeltools.database.OracleDatabaseService.createProxy(vertx.getDelegate(), DatabaseVerticle.CONFIG_ORACLEDB_QUEUE + dataSourceName);
                    databaseServices.put(dataSourceName, databaseService);
                    String description = item.getString("description");
                    databaseNames.put(dataSourceName, description);
                });

        // order by description name
        databaseNames = databaseNames.entrySet()
                .stream()
                .sorted(Map.Entry.comparingByValue())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (oldValue, newValue) -> oldValue, LinkedHashMap::new));

        HttpServerOptions httpServerOptions = new HttpServerOptions();
        httpServerOptions.setCompressionSupported(true);
        HttpServer server = vertx.createHttpServer(httpServerOptions);

        Router router = Router.router(vertx);
        router.route().handler(BodyHandler.create());
        router.route().handler(SessionHandler.create(LocalSessionStore.create(vertx)));

        TemplateEngine templateEngine = HandlebarsTemplateEngine.create(vertx);
        JsonObject templateData = new JsonObject().put("baseUrl", httpConfig.getBaseUrl());

        // Template urls
        router.get("/index.html").handler(context -> renderIndex(context, templateEngine, templateData));
        router.get("/").handler(context -> renderIndex(context, templateEngine, templateData));

        // API urls
        router.get("/api/databases").handler(this::apiGetDatabases);
        router.get("/api/:database/sessions").handler(this::apiGetSessions);
        router.get("/api/:database/sessions/:sid").handler(this::apiGetSessionDetails);
        router.get("/api/:database/sessions/:sid,:serial/longops").handler(this::getSessionLongOps);
        router.get("/api/:database/sessions/:sid/locks").handler(this::getSessionLocks);

        // Static resources
        StaticHandler resourceHandler = StaticHandler.create();
        resourceHandler.setCachingEnabled(false);
        resourceHandler.setCacheEntryTimeout(1);
        router.route("/*").handler(resourceHandler);

        Integer portNumber = httpConfig.getPort();
        String host = httpConfig.getBindToHost();

        server.requestHandler(router)
                .rxListen(portNumber, host)
                .subscribe(s -> {
                    logger.warn("HttpServer running on port " + portNumber + ", application link http://" + host + ":" + portNumber + "/");
                    startPromise.complete();
                }, t -> {
                    logger.error("HttpService failed to start: " + t.getLocalizedMessage());
                    logger.error(ExceptionTools.getStackTraceAsString(t));
                    startPromise.fail("HttpService failed to start: " + ExceptionTools.getRootCause(t));
                });
    }

    /**
     * Render index html and use handlebars template for this
     * @param context routing context
     * @param templateEngine template engine to use for rendering
     * @param templateData the data that needs to go to the template
     */
    private void renderIndex(RoutingContext context, TemplateEngine templateEngine, JsonObject templateData) {
        templateEngine
                .rxRender(templateData, "templates/index.hbs")
                .subscribe(buffer -> context.response().end(buffer));
    }

    /**
     * Checks if the connection identifier (a.k.a. dataSourceName) send by the client
     * exists in the runnning application. If it does not exists an http response is created
     * by this method.
     *
     * @param context  routing context
     * @param database database name according to config.json
     * @return true if database exists, else false
     */
    private Boolean checkDatabaseAndRespondOnFailure(RoutingContext context, String database) {

        Boolean dbExists = databaseServices.containsKey(database);

        if (!dbExists) {
            apiFailure(context, 500, "Invalid database");
        }

        return dbExists;
    }

    /**
     * Get all available database connections
     *
     * @param context the vertx routing context
     */
    private void apiGetDatabases(RoutingContext context) {
        JsonArray databases = new JsonArray();
        databaseNames.forEach((database, name) -> databases.add(new JsonObject().put("id", database).put("description", name)));
        apiResponse(context, 200, new JsonObject().put("databases", databases));
    }

    /**
     * Get current database sessions, uses cached connection from OracleDatabaseService. ResultSet might
     * by empty in case of never initialized cache
     *
     * @param context routing context
     */
    private void apiGetSessions(RoutingContext context) {

        String database = context.request().getParam("database");

        if (checkDatabaseAndRespondOnFailure(context, database)) {
            databaseServices.get(database)
                    .rxGetSessions()
                    .subscribe(resultJson -> apiResponse(context, 200, resultJson), t -> apiFailure(context, t));
        }
    }

    /**
     * Get session details
     *
     * @param context routing context
     */
    private void apiGetSessionDetails(RoutingContext context) {

        String database = context.request().getParam("database");

        try {
            Integer sid = Integer.valueOf(context.request().getParam("sid"));
            if (checkDatabaseAndRespondOnFailure(context, database)) {
                databaseServices.get(database)
                        .rxGetSessionDetails(sid)
                        .subscribe(resultJson -> apiResponse(context, 200, resultJson), t -> apiFailure(context, t));
                


            }
        } catch (NumberFormatException e) {
            apiFailure(context, 500, "Invalid SID, " + e.getMessage());
        }
    }

    /**
     * Get session longops
     *
     * @param context routing context
     */
    private void getSessionLongOps(RoutingContext context) {

        String database = context.request().getParam(("database"));

        try {
            Integer sid = Integer.valueOf(context.request().getParam("sid"));
            Integer serial = Integer.valueOf(context.request().getParam("serial"));

            if (checkDatabaseAndRespondOnFailure(context, database)) {
                databaseServices.get(database)
                        .rxGetSessionLongOps(sid, serial)
                        .subscribe(resultJson -> apiResponse(context, 200, resultJson), t -> apiFailure(context, t));
            }
        } catch (NumberFormatException e) {
            apiFailure(context, 500, "Invalid SID, " + e.getMessage());
        }

    }

    /**
     * Get session locks
     *
     * @param context routing context
     */
    private void getSessionLocks(RoutingContext context) {

        String database = context.request().getParam("database");

        try {
            Integer sid = Integer.valueOf(context.request().getParam("sid"));

            if (checkDatabaseAndRespondOnFailure(context, database)) {
                databaseServices.get(database)
                        .rxGetSessionLocks(sid)
                        .subscribe(resultJson -> apiResponse(context, 200, resultJson), t -> apiFailure(context, t));
            }
        } catch (NumberFormatException e) {
            apiFailure(context, 500, "Invalid SID, " + e.getMessage());
        }

    }

    /**
     * Create default response headers valid for all/most web responses
     * @param response response object to add headers too
     * @param statusCode http status code
     */
    private void attachResponseHeader(HttpServerResponse response, int statusCode) {
        response.setStatusCode(statusCode);
        response.putHeader("Content-Type", "application/json");
        response.putHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.putHeader("Pragma", "no-cache");
        response.putHeader("Expires", "0");
    }

    /**
     * Generic JSON response generator. Creates a valid http response.
     *
     * @param context    routing context
     * @param statusCode http status code
     * @param jsonData   the JSON response data
     */
    private void apiResponse(RoutingContext context, int statusCode, JsonObject jsonData) {
        attachResponseHeader(context.response(), statusCode);

        JsonObject wrapped;
        if (jsonData == null) {
            wrapped = new JsonObject();
        } else {
            wrapped = jsonData;
        }
        context.response().end(wrapped.encode());
    }

    /**
     * Creates an http-500 error response from a Throwable
     *
     * @param context routing context
     * @param t       throwable to return the error message from
     */
    private void apiFailure(RoutingContext context, Throwable t) {
        apiFailure(context, 500, t.getMessage());
    }

    /**
     * Create an http-500 error response with a custom error message
     *
     * @param context    routing context
     * @param statusCode http status code
     * @param error      user defined error message
     */
    private void apiFailure(RoutingContext context, int statusCode, String error) {
        attachResponseHeader(context.response(), statusCode);
        context.response().end(new JsonObject()
                .put("error", error).encode());
    }
}


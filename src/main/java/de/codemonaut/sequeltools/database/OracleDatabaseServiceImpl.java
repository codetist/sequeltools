package de.codemonaut.sequeltools.database;

import de.codemonaut.sequeltools.configuration.DatabaseConfiguration;
import io.reactivex.Flowable;
import io.reactivex.Observable;
import io.reactivex.Single;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.ext.sql.ResultSet;
import io.vertx.reactivex.SingleHelper;
import io.vertx.reactivex.ext.jdbc.JDBCClient;
import io.vertx.reactivex.ext.sql.SQLConnection;

import java.sql.SQLDataException;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

public class OracleDatabaseServiceImpl implements OracleDatabaseService {

    private final JDBCClient jdbcClient;
    private Logger logger = LoggerFactory.getLogger(OracleDatabaseServiceImpl.class);
    private JsonObject sessionsCache;
    private Boolean useSessionCache;
    private String sessionAttributes;
    private StatementDictionary statementDictionary;

    private String entitySession = "session";
    private String entityCurrSql = "currentSql";
    private String entityPrevSql = "prevSql";
    private String entityRowWaitObj = "rowWaitObj";
    private String entityEntryPlsql = "entryPlsql";
    private String entityCurrPlsql = "currentPlsql";
    private String entitySessionLocks = "sessionLocks";
    private String entityLockObject = "lockObject";
    private String genericResultSet = "resultSet";

    /**
     * Block the current thread for a given number of milliseconds. This is not for regular use,
     * just a helper function for frontend testing with slow responses
     *
     * @param millis milliseconds to wait
     */
    private void sleep(Integer millis) {
        try {
            Thread.sleep(millis);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Creates a new OracleDatabaseService instance. Throws IllegalArgumentException in case of
     * malformed or missing parameters. Also sets up a timer instance for automatic session refresh.
     *
     * @param jdbcClient             the jdbc client
     * @param configuration          config JSON for current connection
     * @param readyHandler           result handler
     */
    OracleDatabaseServiceImpl(io.vertx.ext.jdbc.JDBCClient jdbcClient, DatabaseConfiguration configuration, Handler<AsyncResult<OracleDatabaseService>> readyHandler) {
        this.jdbcClient = new JDBCClient(jdbcClient);
        this.sessionsCache = new JsonObject();
        this.useSessionCache = configuration.useSessionCache();
        this.sessionAttributes = "";
        this.statementDictionary = new StatementDictionary(configuration.getTableConfiguration());

        if (configuration.getRefreshInterval() <= 0) {
            throw new IllegalArgumentException("timerInterval must be greater zero, is " + configuration.getRefreshInterval() + " for " + configuration.getDataSourceName());
        }

        if (configuration.checkConnectionOnStartup()) {
            Flowable<Long> timer = Flowable.interval(configuration.getRefreshInterval(), TimeUnit.SECONDS);
            getConnection()
                    .flatMapCompletable(connection -> connection.rxExecute("SELECT 1 FROM DUAL"))
                    .andThen(Single.just(this))
                    .doAfterSuccess(done -> {
                        if (useSessionCache) {
                            timer.subscribe(timerEvent ->
                                    refreshSessionsCache()
                            );
                        }
                        logger.info("Connection check for '" + configuration.getDataSourceName() +"' successful");
                    })
                    .subscribe(SingleHelper.toObserver(readyHandler));
        } else {
            logger.info("Skipping connection check for '" + configuration.getDataSourceName() +"'");
            Single.just(this).subscribe(SingleHelper.toObserver(readyHandler));
        }
    }

    /**
     * Gets a database connection from the pool
     *
     * @return Single containing the SQLConnection
     */
    private Single<SQLConnection> getConnection() {
        return jdbcClient.rxGetConnection().flatMap(connection -> {
            Single<SQLConnection> connectionSingle = Single.just(connection);
            return connectionSingle.doFinally(connection::close);
        });
    }

    /**
     * Change the list of attributes returned for each session during runtime, valid for session list only.
     * Default constructor leaves this list empty so all sessions are returned. Use this function to specify
     * the list at runtime.
     *
     * @param sessionAttributes session attributes to be returned by session list
     */
    @Override
    public void setSessionAttributesFilter(String sessionAttributes) {
        this.sessionAttributes = sessionAttributes;
    }

    /**
     * Loads current sessions from database connection
     *
     * @param resultHandler result handler holding a JSON representation of all current sessions
     */
    private void getSessionsFromDatabase(Handler<AsyncResult<JsonObject>> resultHandler) {
        getConnection()
                .flatMap(conn -> conn.rxQuery(statementDictionary.getSessionsSql()))
                .map(ResultSet::getRows)
                .flatMapPublisher(Flowable::fromIterable)
                .collect(SessionCollector::new, SessionCollector::add)
                .map(sessionCollector -> sessionCollector.serialize(sessionAttributes))
                .subscribe(SingleHelper.toObserver(resultHandler));
    }

    /**
     * Retrieve all current database sessions. Sessions are loaded from cache if
     * session caching has been enabled, else they are queried from database
     *
     * @param resultHandler result handler
     * @return OracleDatabaseService
     */
    @Override
    public OracleDatabaseService getSessions(Handler<AsyncResult<JsonObject>> resultHandler) {
        if (useSessionCache) {
            Single.just(sessionsCache)
                    .subscribe(SingleHelper.toObserver(resultHandler));
        } else {
            getSessionsFromDatabase(resultHandler);
        }
        return this;
    }

    /**
     * Get details for specified database session
     *
     * @param sid           session id
     * @param resultHandler result Handler holding a JSON representation of the session
     * @return resultHandler result Handler holding a JSON representation of the session
     */
    @Override
    public OracleDatabaseService getSessionDetails(Integer sid, Handler<AsyncResult<JsonObject>> resultHandler) {
        MasterStatement masterStatement = new MasterStatement(entitySession, statementDictionary.getSessionSql(), sid);

        DetailStatement currSqlStatement = new DetailStatement(entityCurrSql, statementDictionary.getStatementSql(), "SQL_ID");
        DetailStatement prevSqlStatement = new DetailStatement(entityPrevSql, statementDictionary.getStatementSql(), "PREV_SQL_ID");
        DetailStatement rowObjStatement = new DetailStatement(entityRowWaitObj, statementDictionary.getObjectSql(), "ROW_WAIT_OBJ#");
        DetailStatement entryPlsqlStatement = new DetailStatement(entityEntryPlsql, statementDictionary.getProcedureSql(), "PLSQL_ENTRY_OBJECT_ID", "PLSQL_ENTRY_SUBPROGRAM_ID");
        DetailStatement currPlsqlStatement = new DetailStatement(entityCurrPlsql, statementDictionary.getProcedureSql(), "PLSQL_OBJECT_ID", "PLSQL_SUBPROGRAM_ID");

        ArrayList<DetailStatement> detailQueries = new ArrayList<>();
        detailQueries.add(currSqlStatement);
        detailQueries.add(prevSqlStatement);
        detailQueries.add(rowObjStatement);
        detailQueries.add(entryPlsqlStatement);
        detailQueries.add(currPlsqlStatement);

        Single<JsonObject> queryChainSingle = getStatementSingle(getConnection(), masterStatement, detailQueries);
        queryChainSingle
                .doAfterSuccess(logger::debug)
                .map(this::getMappedSessionDetails)
                .doOnError(logger::error)
                .subscribe(SingleHelper.toObserver(resultHandler));
        return this;
    }

    /**
     * Get locks for specified database session
     *
     * @param sid           session id
     * @param resultHandler result Handler holding a JSON representation of the session locks
     * @return resultHandler result Handler holding a JSON representation of the session locks
     */
    @Override
    public OracleDatabaseService getSessionLocks(Integer sid, Handler<AsyncResult<JsonObject>> resultHandler) {

        MasterStatement masterStatement = new MasterStatement(entitySessionLocks, statementDictionary.getSessionLocksSql(), sid);
        DetailStatement rowObjStatement = new DetailStatement(entityLockObject, statementDictionary.getObjectSql(), "OBJECT_ID");

        ArrayList<DetailStatement> detailQueries = new ArrayList<>();
        detailQueries.add(rowObjStatement);

        Single<JsonObject> queryChainSingle = getStatementSingleMultiRecord(getConnection(), masterStatement, detailQueries);

        queryChainSingle
                .doAfterSuccess(logger::debug)
                .map(this::getMappedSessionLocks)
                .doOnError(logger::error)
                .subscribe(SingleHelper.toObserver(resultHandler));
        return this;
    }

    /**
     * Get longops for specified database session/serial
     *
     * @param sid           session id
     * @param serial        serial number
     * @param resultHandler result Handler holding a JSON representation of the longops
     * @return resultHandler result Handler holding a JSON representation of the longops
     */
    @Override
    public OracleDatabaseService getSessionLongOps(Integer sid, Integer serial, Handler<AsyncResult<JsonObject>> resultHandler) {
        getConnection()
                .flatMap(conn -> conn.rxQueryWithParams(statementDictionary.getSessionLongopsSql(), new JsonArray().add(sid).add(serial)))
                .map(result -> new JsonObject().put("sessionLongOps", result.getRows()))
                .subscribe(SingleHelper.toObserver(resultHandler));
        return this;
    }

    /**
     * Gets current sessions from database and puts them to the local session cache. Used by internal timer
     * only.
     */
    private void refreshSessionsCache() {
        getSessionsFromDatabase(sessionsResultHandler -> {
            if (sessionsResultHandler.succeeded()) {
                sessionsCache = sessionsResultHandler.result();
            } else {
                // clear cache, so its noticeable that there are errors
                sessionsCache = new JsonObject();
                logger.error(sessionsResultHandler.cause());
            }
        });
    }

    /**
     * returns a single that will run a main query with up to n results and several detail queries on the database.
     * Each detail query is run for each main query result
     *
     * @param connection    reference to connection pool Single used for getting a connection
     * @param masterQuery   master query that is run first and contains parameter values for detail queries
     * @param detailQueries list of detail queries, depending on available connections they might be run in parallel
     * @return
     */
    private Single<JsonObject> getStatementSingleMultiRecord(Single<SQLConnection> connection, MasterStatement masterQuery, ArrayList<DetailStatement> detailQueries) {

        return connection
                .flatMap(conn -> conn.rxQueryWithParams(masterQuery.getStatement(), masterQuery.getParameters()))
                .map(ResultSet::getRows)
                .flatMapPublisher(Flowable::fromIterable)
                .concatMap(resultRow ->
                            Flowable
                                    .fromIterable(detailQueries)
                                    .doOnNext(logger::debug)
                                    .concatMapSingle(detailStatement -> connection
                                            .flatMap(conn -> conn.rxQueryWithParams(detailStatement.getStatement(), detailStatement.getParameters(resultRow)))
                                            .map(resultSet -> {
                                                if (resultSet.getNumRows() > 0) {
                                                    return resultRow.put("SQT#OBJECT", resultSet.getRows().get(0));
                                                }
                                                return resultRow;
                                            }))
                )
                .doOnNext(logger::debug)
                .reduce(new JsonObject().put(genericResultSet, new JsonArray()), (result, current) -> {
                    result.getJsonArray(genericResultSet).add(current);
                    return result;
                });
    }

    /**
     * returns a single that will run a main query and several detail queries on the database
     *
     * @param connection    reference to connection pool Single used for getting a connection
     * @param masterQuery   master query that is run first and contains parameter values for detail queries
     * @param detailQueries list of detail queries, depending on available connections they might be run in parallel
     * @return
     */
    private Single<JsonObject> getStatementSingle(Single<SQLConnection> connection, MasterStatement masterQuery, ArrayList<DetailStatement> detailQueries) {
        JsonObject masterQueryResultCache = new JsonObject();

        return Observable
                .just(masterQuery)
                .doOnNext(logger::debug)
                .concatMapSingle(masterStatement -> connection
                        .flatMap(conn -> conn.rxQueryWithParams(masterStatement.getStatement(), masterQuery.getParameters()))
                        .map(resultSet -> {
                            if (resultSet.getNumRows() > 0) {
                                masterQueryResultCache.put("sessionCache", resultSet.getRows().get(0));
                                return new JsonObject().put("key", masterStatement.getEntityName()).put("object", resultSet.getRows().get(0));
                            } else
                                throw new SQLDataException("Query did not return any values");
                        })
                )
                .concatWith(Observable
                        .fromIterable(detailQueries)
                        .doOnNext(logger::debug)
                        .concatMapSingle(detailStatement -> connection
                                .flatMap(conn -> conn.rxQueryWithParams(detailStatement.getStatement(), detailStatement.getParameters(masterQueryResultCache.getJsonObject("sessionCache"))))
                                .map(resultSet -> {
                                    JsonObject resultJson = new JsonObject().put("key", detailStatement.getEntityName()).put("object", new JsonObject());
                                    if (resultSet.getNumRows() > 0) {
                                        return resultJson.put("object", resultSet.getRows().get(0));
                                    }
                                    return resultJson;
                                }))
                )
                .doOnNext(logger::debug)
                .reduce(new JsonObject(), (result, current) -> {
                    String key = current.getString("key");
                    JsonObject object = current.getJsonObject("object");
                    if (!object.isEmpty()) result.put(key, object);
                    result.remove("key");
                    result.remove("object");
                    return result;
                });
    }

    /**
     * Map additional lock object information for session locks
     *
     * @param unmappedJson unmmapped JSON how it comes from the database queries
     * @return JsonObject containing only a sessionLock object carrying additional fields
     */
    private JsonObject getMappedSessionLocks(JsonObject unmappedJson) {
        JsonObject mappedJson = new JsonObject();
        mappedJson.put(entitySessionLocks, new JsonArray());

        // in case of error, just return
        if (!unmappedJson.containsKey(genericResultSet)) {
            return unmappedJson;
        }

        JsonArray sessionLocks = unmappedJson.getJsonArray(genericResultSet);
        sessionLocks.stream().forEach(singleLockObj -> {
            JsonObject singleLock = (JsonObject) singleLockObj;

            if (singleLock.containsKey("SQT#OBJECT")) {
                JsonObject lockObject = singleLock.getJsonObject("SQT#OBJECT");
                singleLock.remove("SQT#OBJECT");
                singleLock.put("SQT#LOCK_OBJECT_TYPE", lockObject.getString("OBJECT_TYPE"));
                singleLock.put("SQT#LOCK_OBJECT_OWNER", lockObject.getString("OWNER"));
                singleLock.put("SQT#LOCK_OBJECT_NAME", lockObject.getString("OBJECT_NAME"));
            } else {
                singleLock.put("SQT#LOCK_OBJECT_TYPE", "");
                singleLock.put("SQT#LOCK_OBJECT_OWNER", "");
                singleLock.put("SQT#LOCK_OBJECT_NAME", "");
            }

            mappedJson.getJsonArray(entitySessionLocks).add(singleLock);
        });

        return mappedJson;
    }

    /**
     * Map additional objects like currentPlsql, currentSql etc. to the session object
     *
     * @param unmappedJson unmmapped JSON how it comes from the database queries
     * @return JsonObject containing only a session object carrying additional fields
     */
    private JsonObject getMappedSessionDetails(JsonObject unmappedJson) {
        JsonObject mappedJson = new JsonObject();

        // in case of error, just return
        if (!unmappedJson.containsKey(entitySession)) {
            return unmappedJson;
        }
        mappedJson.put(entitySession, unmappedJson.getJsonObject(entitySession));

        if (unmappedJson.containsKey(entityRowWaitObj)) {
            mappedJson.getJsonObject(entitySession).put("SQT#ROW_OBJECT_OWNER", unmappedJson.getJsonObject(entityRowWaitObj).getValue("OWNER"));
            mappedJson.getJsonObject(entitySession).put("SQT#ROW_OBJECT_NAME", unmappedJson.getJsonObject(entityRowWaitObj).getValue("OBJECT_NAME"));
            mappedJson.getJsonObject(entitySession).put("SQT#ROW_OBJECT_TYPE", unmappedJson.getJsonObject(entityRowWaitObj).getValue("OBJECT_TYPE"));
        } else {
            mappedJson.getJsonObject(entitySession).put("SQT#ROW_OBJECT_OWNER", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#ROW_OBJECT_NAME", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#ROW_OBJECT_TYPE", (String)null);
        }

        if (unmappedJson.containsKey(entityCurrSql)) {
            mappedJson.getJsonObject(entitySession).put("SQT#SQL_FULLTEXT", unmappedJson.getJsonObject(entityCurrSql).getValue("SQL_FULLTEXT"));
        } else {
            mappedJson.getJsonObject(entitySession).put("SQT#SQL_FULLTEXT", (String)null);
        }

        if (unmappedJson.containsKey(entityPrevSql)) {
            mappedJson.getJsonObject(entitySession).put("SQT#PREV_SQL_FULLTEXT", unmappedJson.getJsonObject(entityPrevSql).getValue("SQL_FULLTEXT"));
        } else {
            mappedJson.getJsonObject(entitySession).put("SQT#PREV_SQL_FULLTEXT", (String)null);
        }

        if (unmappedJson.containsKey(entityCurrPlsql)) {
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_OWNER", unmappedJson.getJsonObject(entityCurrPlsql).getValue("OWNER"));
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_OBJECT_NAME", unmappedJson.getJsonObject(entityCurrPlsql).getValue("OBJECT_NAME"));
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_PROCEDURE", unmappedJson.getJsonObject(entityCurrPlsql).getValue("PROCEDURE_NAME"));
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_OBJECT_TYPE", unmappedJson.getJsonObject(entityCurrPlsql).getValue("OBJECT_TYPE"));
        } else {
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_OWNER", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_OBJECT_NAME", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_PROCEDURE", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_OBJECT_TYPE", (String)null);
        }

        if (unmappedJson.containsKey(entityEntryPlsql)) {
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_OWNER", unmappedJson.getJsonObject(entityEntryPlsql).getValue("OWNER"));
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_OBJECT_NAME", unmappedJson.getJsonObject(entityEntryPlsql).getValue("OBJECT_NAME"));
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_PROCEDURE", unmappedJson.getJsonObject(entityEntryPlsql).getValue("PROCEDURE_NAME"));
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_OBJECT_TYPE", unmappedJson.getJsonObject(entityEntryPlsql).getValue("OBJECT_TYPE"));
        } else {
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_OWNER", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_OBJECT_NAME", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_PROCEDURE", (String)null);
            mappedJson.getJsonObject(entitySession).put("SQT#PLSQL_ENTRY_OBJECT_TYPE", (String)null);
        }

        return mappedJson;
    }
}

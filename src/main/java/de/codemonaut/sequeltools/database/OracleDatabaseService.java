package de.codemonaut.sequeltools.database;

import de.codemonaut.sequeltools.configuration.DatabaseConfiguration;
import io.vertx.codegen.annotations.Fluent;
import io.vertx.codegen.annotations.GenIgnore;
import io.vertx.codegen.annotations.ProxyGen;
import io.vertx.codegen.annotations.VertxGen;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;

@ProxyGen
@VertxGen
public interface OracleDatabaseService {

    @GenIgnore
    static OracleDatabaseService create(JDBCClient jdbcClient, DatabaseConfiguration configuration, Handler<AsyncResult<OracleDatabaseService>> readyHandler) {
        return new OracleDatabaseServiceImpl(jdbcClient, configuration, readyHandler);
    }

    @GenIgnore
    static de.codemonaut.sequeltools.database.reactivex.OracleDatabaseService createProxy(Vertx vertx, String address) {
        return new de.codemonaut.sequeltools.database.reactivex.OracleDatabaseService(new OracleDatabaseServiceVertxEBProxy(vertx, address));
    }

    @Fluent
    OracleDatabaseService getSessions(Handler<AsyncResult<JsonObject>> resultHandler);

    @Fluent
    OracleDatabaseService getSessionDetails(Integer sid, Handler<AsyncResult<JsonObject>> resultHandler);

    @Fluent
    OracleDatabaseService getSessionLongOps(Integer sid, Integer serial, Handler<AsyncResult<JsonObject>> resultHandler);

    @Fluent
    OracleDatabaseService getSessionLocks(Integer sid, Handler<AsyncResult<JsonObject>> resultHandler);

    void setSessionAttributesFilter(String sessionAttributesFilter);
}

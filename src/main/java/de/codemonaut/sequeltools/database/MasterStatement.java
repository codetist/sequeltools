package de.codemonaut.sequeltools.database;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

class MasterStatement {

    private JsonObject statement;

    MasterStatement(String entityName, String sqlStatement, Object parameterValue) {
        this.statement = constructMasterSql(entityName, sqlStatement, parameterValue);
    }

    private JsonObject constructMasterSql(String entityName, String sqlStatement, Object parameterValue) {
        JsonArray parameters = new JsonArray().add(parameterValue);
        return new JsonObject()
                .put("key", entityName)
                .put("statement", sqlStatement)
                .put("parameters", parameters);
    }

    String getEntityName() {
        return statement.getString("key");
    }

    String getStatement() {
        return statement.getString("statement");
    }

    JsonArray getParameters() {
        return statement.getJsonArray("parameters");
    }

    public String toString() {
        return "MasterStatement: " + statement.toString();
    }

}

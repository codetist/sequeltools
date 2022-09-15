package de.codemonaut.sequeltools.database;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

public class DetailStatement {

    private JsonObject statement;

    DetailStatement(String entityName, String sqlStatement, String parameterName) {
        statement = constructDetailSql(entityName, sqlStatement, parameterName);
    }

    DetailStatement(String entityName, String sqlStatement, String parameterName1, String parameterName2) {
        statement = constructDetailSql(entityName, sqlStatement, parameterName1, parameterName2);
    }

    private JsonObject constructDetailSql(String entityName, String sqlStatement, String parameterName) {
        JsonArray parameters = new JsonArray();
        parameters.add(new JsonObject().put("parameterName", parameterName));

        return new JsonObject()
                .put("key", entityName)
                .put("statement", sqlStatement)
                .put("parameters", parameters);
    }

    private JsonObject constructDetailSql(String entityName, String sqlStatement, String parameterName1, String parameterName2) {
        JsonArray parameters = new JsonArray();
        parameters
                .add(new JsonObject().put("parameterName", parameterName1))
                .add(new JsonObject().put("parameterName", parameterName2));

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

    JsonArray getParameters(JsonObject masterResult) {
        JsonArray parameterValues = new JsonArray();
        JsonArray parameters = statement.getJsonArray("parameters");
        parameters.forEach(parameterObject -> {
            JsonObject parameter = (JsonObject) parameterObject;
            String parameterName = parameter.getString("parameterName");

            if (masterResult.containsKey(parameterName)) {
                parameterValues.add(masterResult.getValue(parameterName));
            } else {
                parameterValues.add("");
            }
        });
        return parameterValues;
    }

    public String toString() {
        return "DetailStatement: " + statement.toString();
    }
}

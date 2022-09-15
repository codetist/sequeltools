package de.codemonaut.sequeltools.configuration;

import io.vertx.core.json.JsonObject;

public class DatabaseTableConfiguration extends AbstractConfiguration{

    private static final String longOpsTable = "v$session_longops";
    private static final String sessionsTable = "v$session";
    private static final String sqlStatementsTable = "v$sqlarea";
    private static final String proceduresTable = "dba_procedures";
    private static final String commandsTable = "v$sqlcommand";
    private static final String objectsTable = "dba_objects";
    private static final String sessionLocksTable = "v$locked_object";

    /**
     * default constructor
     */
    DatabaseTableConfiguration() {
    }

    /**
     * constrcutor, sets configJson and created a DatabaseTableConfiguration object
     * @param configJson configJson
     */
    DatabaseTableConfiguration(JsonObject configJson) {
        this.configJson = configJson;
    }

    public boolean hasDebugConfiguration() {
        if (configJson != null)
            return true;
        return false;
    }

    /**
     * returns session table or default
     * @return session table
     */
    public String getSessionsTable() {
        if (hasDebugConfiguration())
            return getStringValue("sessionsTable", sessionsTable);
        return sessionsTable;
    }

    /**
     * returns sql table or default
     * @return sql table
     */
    public String getSqlTable() {
        if (hasDebugConfiguration())
            return getStringValue("sqlTable", sqlStatementsTable);
        return sqlStatementsTable;
    }

    /**
     * returns procedures table or default
     * @return procedures table
     */
    public String getProceduresTable() {
        if (hasDebugConfiguration())
            return getStringValue("proceduresTable", proceduresTable);
        return proceduresTable;
    }

    /**
     * returns sql table or default
     * @return sql table
     */
    public String getSqlCommandsTable() {
        if (hasDebugConfiguration())
            return getStringValue("sqlCommandsTable", commandsTable);
        return commandsTable;
    }

    /**
     * returns objects table or default
     * @return objects table
     */
    public String getObjectsTable() {
        if (hasDebugConfiguration())
            return getStringValue("objectsTable", objectsTable);
        return objectsTable;
    }

    /**
     * returns longOps table or default
     * @return longOps table
     */
    public String getSessionLongOpsTable() {
        if (hasDebugConfiguration())
            return getStringValue("sessionLongOpsTable", longOpsTable);
        return longOpsTable;
    }

    /**
     * returns sessionLocks table or default
     * @return sessionLocks table
     */
    public String getSessionLocksTable() {
        if (hasDebugConfiguration())
            return getStringValue("sessionLocksTable", sessionLocksTable);
        return sessionLocksTable;
    }

}

package de.codemonaut.sequeltools.database;

import de.codemonaut.sequeltools.configuration.DatabaseTableConfiguration;

/**
 * This class contains all SQL statements required by sequelTools. In cases where table names are changeable
 * for debug purposes this is also handled by this class.
 */
class StatementDictionary {

    private DatabaseTableConfiguration configuration;

    // Tables to use when querying Oracle database
    StatementDictionary(DatabaseTableConfiguration configuration) {
        this.configuration = configuration;
    }

    String getSessionSql() {
        return "SELECT s.*, c.command_name sqt#command_name FROM " + configuration.getSessionsTable() + " s LEFT OUTER JOIN " + configuration.getSqlCommandsTable() + " c ON s.command = c.command_type WHERE sid=?";
    }

    String getObjectSql() {
        return "SELECT object_id, owner, object_name, object_type FROM " + configuration.getObjectsTable() + " WHERE object_id=?";
    }

    String getProcedureSql() {
        return "SELECT owner, object_name, object_type, procedure_name FROM " + configuration.getProceduresTable() + " WHERE object_id=? AND subprogram_id=?";
    }

    String getStatementSql() {
        return "SELECT sql_id, sql_fulltext FROM " + configuration.getSqlTable() + " WHERE sql_id=? and rownum=1";
    }

    String getSessionsSql() {
        return "WITH sessions AS (SELECT * FROM " +
                configuration.getSessionsTable() +
                "),\n" +
                "blocking_sessions\n" +
                "AS (SELECT DISTINCT blocking_session\n" +
                "FROM sessions\n" +
                "WHERE blocking_session IS NOT NULL)\n" +
                "SELECT s.SID, s.SERIAL#, s.TYPE, s.USERNAME, s.SCHEMANAME, s.STATUS, s.OSUSER, s.MACHINE, s.PROGRAM, s.TERMINAL, s.MODULE, s.ACTION, s.CLIENT_INFO, s.CLIENT_IDENTIFIER, s.LOGON_TIME, s.BLOCKING_SESSION, \n" +
                "TRIM (\n" +
                "DECODE (s.blocking_session, NULL, NULL, 'BLOCKED')\n" +
                "|| ' '\n" +
                "|| DECODE (b.blocking_session, NULL, NULL, 'BLOCKING'))\n" +
                "BLOCK_STATUS\n" +
                "FROM sessions s\n" +
                "LEFT OUTER JOIN blocking_sessions b ON s.sid = b.blocking_session " +
                "order by sid";
    }

    String getSessionLongopsSql() {
        return "SELECT l.*, "
                + "(select sql_fulltext from " + configuration.getSqlTable() + " where sql_id = l.sql_id) sqt#sql_fulltext "
                + "FROM " + configuration.getSessionLongOpsTable() + " l"
                + " WHERE l.sid=? and l.serial#=?"
                + " ORDER BY decode(nvl(l.time_remaining,0), 0, 2, 1) asc, nvl(l.time_remaining,0)*-1 desc, start_time asc";
    }

    String getSessionLocksSql() {
        return "SELECT l.object_id, "
                + "locked_mode, "
                + "decode(l.locked_mode,"
                + "          0, 'No Lock',"
                + "          1, 'Null Lock (NL)',"
                + "          2, 'Sub-Share (SS) / Row-Share (RS)',"
                + "          3, 'Sub-Exclusive (SX) / Row-Exclusive (RX)',"
                + "          4, 'Share',"
                + "          5, 'Share Sub Exclusive (SSX) / Share Row Exclusive (SRX)',"
                + "          6, 'Exclusive (X)',"
                + "          'Unknown') locked_mode_description"
                + " FROM " + configuration.getSessionLocksTable() + " l"
                + " WHERE l.session_id=?"
                + " ORDER BY l.object_id";
    }
}

package de.codemonaut.sequeltools.database;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

public class SessionCollector {

    private JsonArray sessions;
    private int totalSessionsCount = 0;
    private int activeSessionsCount = 0;
    private int inactiveSessionsCount = 0;
    private int killedSessionsCount = 0;
    private int blockedSessionsCount = 0;
    private int otherSessionsCount = 0;
    private int userSessionsCount = 0;
    private int backgroundSessionCount = 0;
    private HashSet<Integer> blockingSessions = new HashSet<>();

    /**
     * Constructor to create an empty SessionCollector without attribute filtering
     */
    SessionCollector() {
        sessions = new JsonArray();
    }

    /**
     * Calculate number of sessions by current state
     *
     * @param session current database session representation
     */
    private void countSessionStates(JsonObject session) {

        if (session.containsKey("STATUS")) {
            switch (session.getString("STATUS")) {
                case "ACTIVE":
                    activeSessionsCount++;
                    break;
                case "INACTIVE":
                    inactiveSessionsCount++;
                    break;
                case "KILLED":
                    killedSessionsCount++;
                    break;
                default:
                    otherSessionsCount++;
            }

            switch (session.getString("TYPE")) {
                case "USER":
                    userSessionsCount++;
                    break;
                case "BACKGROUND":
                    backgroundSessionCount++;
                    break;
                default:
            }
        }
    }

    /**
     * Calculate number of blocked sessions
     *
     * @param session current database session representation
     */
    private void countBlockedSessions(JsonObject session) {

        if (session.containsKey("BLOCKING_SESSION") &&
                session.getInteger("BLOCKING_SESSION") != null) {
            blockedSessionsCount++;
        }
    }

    /**
     * Calculate number of blocking sessions and store distinct sessionids
     *
     * @param session current database session representation
     */
    private void countAndCollectBlockingSessions(JsonObject session) {
        // TODO: Needs implementation :)
    }


    /**
     * Collects a list of unique blocking session ids
     *
     * @param session current database session representation
     */
    private void collectBlockingSessions(JsonObject session) {
        if (session.containsKey("BLOCKING_SESSION") &&
                session.getInteger("BLOCKING_SESSION") != null) {
            blockingSessions.add(session.getInteger("BLOCKING_SESSION"));
        }
    }

    /**
     * Adds a new session to the session collector and updates the session statistics
     *
     * @param session current database session representation
     */
    public void add(JsonObject session) {

        totalSessionsCount++;
        countSessionStates(session);
        countBlockedSessions(session);
        collectBlockingSessions(session);
        countAndCollectBlockingSessions(session);

        sessions.add(session);
    }

    /**
     * filter sessions to return only the attributes that are requested by the user. Used
     * for dynamic selection of visible attributes. Its built this way, to remove the risk of SQL injection
     * that probably would occur in case the attribute list would be concatenated to a SQL statement
     *
     * @param fullSessionObject the complete session object that is going to be filtered
     * @return JsonObject filter session
     */
    private JsonObject filterSessionAttributes(List<String> attributesToCollect, JsonObject fullSessionObject) {

        if (attributesToCollect == null || attributesToCollect.isEmpty())
            return fullSessionObject;

        JsonObject filteredSession = new JsonObject();
        attributesToCollect.stream()
                .map(attribute -> filteredSession.put(attribute, fullSessionObject.getValue(attribute)))
                .count();
        return filteredSession;
    }

    /**
     * Serialize sessions and statistics to a single JSON object. Provides filtering of session attributes to
     * reduce the amount of data that is returned (huge session lists with all default attributes might result
     * in very huge JSONs).
     *
     * @param attributesToCollect comma-separated list of session attributes to be returned, if empty
     *                            all session attributes will be returned
     * @return JSON object containing sessions and statistical metadata
     */
    public JsonObject serialize(String attributesToCollect) {

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        List<String> attributesToCollectList;

        if (attributesToCollect != null && !attributesToCollect.isEmpty()) {
            attributesToCollectList = Arrays.asList(attributesToCollect.split("\\s*,\\s*"));
        } else {
            attributesToCollectList = new ArrayList<>();
        }

        JsonArray sessionsToReturn = sessions;

        if (!attributesToCollectList.isEmpty()) {
            sessionsToReturn = new JsonArray(sessions.stream()
                    .map(fullSession -> filterSessionAttributes(attributesToCollectList, (JsonObject) fullSession))
                    .collect(Collectors.toList()));
        }

        return new JsonObject()
                .put("sessions", sessionsToReturn)
                .put("statistics", new JsonObject()
                        .put("total", totalSessionsCount)
                        .put("active", activeSessionsCount)
                        .put("inactive", inactiveSessionsCount)
                        .put("killed", killedSessionsCount)
                        .put("blocked", blockedSessionsCount)
                        .put("blocking", blockingSessions.size())
                        .put("other", otherSessionsCount)
                        .put("user", userSessionsCount)
                        .put("background", backgroundSessionCount)
                        .put("queryTime", LocalDateTime.now().format(formatter))
                );
    }
}

package de.codemonaut.sequeltools.util;

import java.io.PrintWriter;
import java.io.StringWriter;

public abstract class ExceptionTools {

    public static String getStackTraceAsString(Throwable throwable) {
        StringWriter stringWriter  = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        throwable.printStackTrace(printWriter);
        return stringWriter.toString();
    }

    public static String getRootCause(Throwable throwable) {
        Throwable cause = throwable;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage().replace("\n", "");
    }
}

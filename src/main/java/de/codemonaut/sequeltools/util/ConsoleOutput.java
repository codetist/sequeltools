package de.codemonaut.sequeltools.util;

public abstract class ConsoleOutput {

    /**
     * sequelTools console output banner
     */
    public static void printBanner() {
        System.out.println(
            "_____________________________________________________ \n" +
            "                          _ _____         _           \n" +
            "      ___ ___ ___ _ _ ___| |_   _|___ ___| |___       \n" +
            "     |_ -| -_| . | | | -_| | | | | . | . | |_ -|      \n" +
            "     |___|___|_  |___|___|_| |_| |___|___|_|___|      \n" +
            "               |_|          2019 by Marco Dehmel      \n" +
            "         https://github.com/codetist/sequeltools      \n" +
            "_____________________________________________________ \n"
        );
    }

    /**
     * Print message to console
     * @param message message to display
     */
    public static void print(String message) {
        System.out.println(message);
    }

}

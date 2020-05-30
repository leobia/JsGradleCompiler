package com.leobia.gradle.utils;

import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

public class ResourceUtils {

    private ResourceUtils() {}

    public static final String JS = "js";

    /**
     *
     * @param file input file
     * @return true if file exists and has js extension
     */
    public static boolean isJsFile(File file) {
        boolean isJs = false;

        if (file != null && file.isFile()) {
            String fileName = file.getName();
            isJs = hasJsExtension(fileName);
        }

        return isJs;
    }

    /**
     * Checks the last extension of {@code fileName}
     * @param fileName name of the file
     * @return true if the the last extension is .js
     */
    public static boolean hasJsExtension(String fileName) {
        boolean isJs = false;
        if (fileName.contains(".")) {
            String extension = fileName.substring(fileName.lastIndexOf('.') + 1);
            isJs = JS.equalsIgnoreCase(extension);
        }
        return isJs;
    }

    public static String addToPath(String path, String toAdd) {
        String output = path;
        String lastChar = output.substring(output.length() - 1);

        if (File.separator.equals(lastChar)) {
            output += toAdd;
        } else {
            output += File.separator + toAdd;
        }

        return output;
    }

    /**
     * Write data to file. Throws exception if file does not exists
     * @param file file in which data will be written
     * @param data that will be written
     * @param logger logger passed from calling class
     */
    public static void write(File file, String data, Logger logger) {
        try (OutputStream stream = new FileOutputStream(file, false)) {
            stream.write(data.getBytes());
        } catch (IOException e) {
            logger.error("Error writing file: " + file.getName(), e);
            throw new GradleException(e.getMessage());
        }
    }

    public static String minifiedName(String name) {
        String minName;

        if (hasJsExtension(name)) {
            minName = name.substring(0, name.length() - JS.length()) + "min.js";
        } else {
            minName = name;
        }
        return minName;
    }
}

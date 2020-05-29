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

    public static boolean isJsFile(File file) {
        boolean isJs = false;

        if (file != null && file.isFile()) {
            String fileName = file.getName();
            isJs = hasJsExtension(fileName);
        }

        return isJs;
    }

    public static boolean hasJsExtension(String fileName) {
        boolean isJs = false;
        if (fileName.contains(".")) {
            String extension = fileName.substring(fileName.lastIndexOf('.') + 1);
            isJs = JS.equalsIgnoreCase(extension);
        }
        return isJs;
    }

    public static File getOutputFile(String destinationPath, String sourcePath, Logger logger) {
        File outputFile;

        destinationPath = retrieveDestinationPath(destinationPath, sourcePath, logger);

        outputFile = new File(destinationPath);
        try {
            boolean newFile = outputFile.createNewFile();
            if (!newFile) {
                logger.debug("File not created " + destinationPath);
            }
        } catch (IOException e) {
            throw new GradleException("Cannot create new file " + destinationPath);
        }

        return outputFile;
    }

    /**
     * Checks on destination path, if it is null it will create a new dir and new file under source path
     *
     * @param destinationPath destination path declared by the user
     * @param sourcePath      used as a backup if destination path is not passed
     * @return output file
     */
    public static String retrieveDestinationPath(String destinationPath, String sourcePath, Logger logger) {
        File destPathFile;
        if (destinationPath == null || destinationPath.isEmpty()) {
            logger.warn("desitanationPath is not passed, saving files in /minified under source path");
            File sourceFile = new File(sourcePath);
            if (sourceFile.isFile()) {
                destinationPath = addToPath(sourceFile.getParent(), "minified");
            } else {
                destinationPath = addToPath(sourcePath, "minified");
            }
            destPathFile = new File(destinationPath);
            destPathFile.mkdirs();
            destinationPath = addToPath(destinationPath, "script.min.js");
        } else {
            destPathFile = new File(destinationPath);
            if (!destPathFile.isFile() && !ResourceUtils.hasJsExtension(destinationPath)) {
                destPathFile.mkdirs();
                destinationPath = addToPath(destinationPath, "script.min.js");
            } else {
                File parentDir = destPathFile.getParentFile();
                parentDir.mkdirs();
            }
        }

        return destinationPath;
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

    public static void write(File file, String data, Logger logger) {
        file.getParentFile().mkdirs();
        try (OutputStream stream = new FileOutputStream(file, false)) {
            stream.write(data.getBytes());
        } catch (IOException e) {
            logger.error("Error writing file: " + file.getName(), e);
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

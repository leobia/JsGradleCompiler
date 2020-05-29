package com.leobia.gradle.compilers;

import com.leobia.gradle.utils.ResourceUtils;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.io.IOException;

public abstract class AbstractCompiler {

    private Logger logger;

    protected AbstractCompiler(Logger logger) {
        this.logger = logger;
    }

    public abstract void compile();

    /**
     * Create, if it does not already exists, a java.io.File.
     *
     * @param dest   destination of output file, if it is a dir it will make a new js file with a default name
     * @param source used to check the validity of dest
     * @return java.io.File
     */
    public File createOutputFile(String dest, String source) {
        File outputFile = new File(computeDestPath(dest, source));

        try {
            boolean newFile = outputFile.createNewFile();
            if (!newFile) {
                logger.debug("File not created " + dest);
            }

        } catch (IOException e) {
            throw new GradleException("Error during creation of destination file " + dest);
        }

        return outputFile;
    }

    private String computeDestPath(String dest, String source) {

        if (dest == null || dest.trim().isEmpty()) {
            // Destination path not provided
            dest = destFromSource(source);
        } else {

            File destFile = new File(dest);

            if (destFile.isFile() && ResourceUtils.hasJsExtension(dest)) {
                destFile.getParentFile().mkdirs();
            } else if (destFile.isFile() && !ResourceUtils.hasJsExtension(dest)) {
                // destination is a file but has no js extension
                destFile.getParentFile().mkdirs();
                dest += ".js";
            } else {
                // destination is a dir
                destFile.mkdirs();
                dest = ResourceUtils.addToPath(dest, "script.min.js");
            }

        }

        return dest;
    }

    private String destFromSource(String source) {
        logger.warn("outputPath is empty... saving files in inputhPath/minified");
        String dest = "";
        File sourceFile = new File(source);

        if (sourceFile.isFile()) {
            dest = ResourceUtils.addToPath(sourceFile.getParent(), "minified");
        } else {
            dest = ResourceUtils.addToPath(source, "minified");
        }

        File destFile = new File(dest);
        destFile.mkdirs();
        dest = ResourceUtils.addToPath(dest, "script.min.js");

        return dest;
    }

    public Logger getLogger() {
        return logger;
    }

    public void setLogger(Logger logger) {
        this.logger = logger;
    }
}

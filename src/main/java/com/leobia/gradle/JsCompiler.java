package com.leobia.gradle;

import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.*;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

import static com.google.javascript.jscomp.CompilerOptions.Environment.BROWSER;

public class JsCompiler {

    private static final String JS = "js";
    private final Logger logger;

    public JsCompiler(Logger logger) {
        this.logger = logger;
    }

    public void compile(JsCompilerExtension extension) {

        CompilerOptions options = optionsFromExtension(extension);
        WarningLevel level = WarningLevel.valueOf(extension.getWarningLevel().toUpperCase());
        level.setOptionsForWarningLevel(options);
        List<SourceFile> externs;
        try {
            externs = CommandLineRunner.getBuiltinExterns(BROWSER);
        } catch (IOException e) {
            throw new GradleException("Error during getBuiltinExterns");
        }

        List<SourceFile> inputs = getSourceInputFiles(extension);

        Compiler compiler = new Compiler();

        File output = getOutputFile(extension.getOutputPath(), extension.getInputPath());

        Result result = compiler.compile(externs, inputs, options);

        if (result.success) {
            write(output, compiler.toSource());
        } else {
            logger.warn("Result of compilation was false");
        }

    }

    private CompilerOptions optionsFromExtension(JsCompilerExtension extension) {
        CompilerOptions options = new CompilerOptions();
        CompilationLevel.valueOf(extension.getCompilationLevel()).setOptionsForCompilationLevel(options);

        if (extension.getJsVersionIn() != null && !extension.getJsVersionIn().isEmpty()) {
            options.setLanguageIn(CompilerOptions.LanguageMode.valueOf(extension.getJsVersionIn()));
        }

        if (extension.getJsVersionOut() != null && !extension.getJsVersionOut().isEmpty()) {
            options.setLanguageOut(CompilerOptions.LanguageMode.valueOf(extension.getJsVersionOut()));
        }

        return options;
    }

    private List<SourceFile> getSourceInputFiles(JsCompilerExtension extension) {
        String sourcePath = extension.getInputPath();
        List<SourceFile> jsSourceFiles = new ArrayList<>();

        File inputFile = new File(sourcePath);
        if (inputFile.exists()) {
            if (isJsFile(inputFile)) {
                jsSourceFiles.add(SourceFile.fromFile(inputFile.getPath()));
            } else if (inputFile.isDirectory()) {
                File[] files = inputFile.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (isJsFile(file)) {
                            jsSourceFiles.add(SourceFile.fromFile(file.getPath()));
                        }
                    }
                }
            } else {
                throw new GradleException("Input path not valid or does not exists!");
            }
        } else {
            throw new GradleException("Input path not valid or does not exists!");
        }


        return jsSourceFiles;
    }

    private boolean isJsFile(File file) {
        boolean isJs = false;

        if (file != null && file.isFile()) {
            String fileName = file.getName();
            isJs = hasJsExtension(fileName);
        }

        return isJs;
    }

    private boolean hasJsExtension(String fileName) {
        boolean isJs = false;
        if (fileName.contains(".")) {
            String extension = fileName.substring(fileName.lastIndexOf(".") + 1);
            isJs = JS.equals(extension.toLowerCase());
        }
        return isJs;
    }

    private File getOutputFile(String destinationPath, String sourcePath) {
        File outputFile;

        destinationPath = retrieveDestinationPath(destinationPath, sourcePath);

        outputFile = new File(destinationPath);
        try {
            outputFile.createNewFile();
        } catch (IOException e) {
            throw new GradleException("Cannot create new file");
        }

        return outputFile;
    }

    /**
     * Checks on destination path, if it is null it will create a new dir and new file under source path
     * @param destinationPath destination path declared by the user
     * @param sourcePath used as a backup if destination path is not passed
     * @return output file
     */
    private String retrieveDestinationPath(String destinationPath, String sourcePath) {
        if (destinationPath == null || destinationPath.isEmpty()) {
            logger.warn("desitanationPath is not passed, saving files in /minified under source path");
            File sourceFile = new File(sourcePath);
            if (sourceFile.isFile()) {
                destinationPath = addToPath(sourceFile.getParent(), "minified");
            } else {
                destinationPath = addToPath(sourcePath, "minified");
            }
            File minDir = new File(destinationPath);
            minDir.mkdir();
            destinationPath = addToPath(destinationPath, "output.js");
        } else {
            File destPathFile = new File(destinationPath);
            if (destPathFile.isDirectory()) {
                destinationPath = addToPath(destinationPath, "output.js");
            }
        }
        return destinationPath;
    }

    private void write(File file, String data) {
        file.getParentFile().mkdirs();
        try (OutputStream stream = new FileOutputStream(file, false)) {
            stream.write(data.getBytes());
        } catch (IOException e) {
            logger.error("Error writing file: " + file.getName(), e);
        }
    }

    private String addToPath(String path, String toAdd) {
        String output = path;
        String lastChar = output.substring(output.length() - 1);

        if (File.separator.equals(lastChar)) {
            output += toAdd;
        } else {
            output += File.separator + toAdd;
        }

        return output;
    }
}

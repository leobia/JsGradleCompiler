package com.leobia.gradle;

import com.google.javascript.jscomp.CompilationLevel;
import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.Result;
import com.google.javascript.jscomp.SourceFile;
import com.google.javascript.jscomp.WarningLevel;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static com.google.javascript.jscomp.AbstractCommandLineRunner.getBuiltinExterns;
import static com.google.javascript.jscomp.CompilerOptions.Environment.BROWSER;

public class JsCompiler {


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
            externs = getBuiltinExterns(BROWSER);
        } catch (IOException e) {
            throw new GradleException("Error during getBuiltinExterns");
        }

        List<SourceFile> inputs = getSourceInputFiles(extension);


        if (extension.isCombineAllFiles()) {
            compileIntoSingleFile(extension, options, externs, inputs);
        } else {
            compileIntoSplittedFiles(extension, options, externs, inputs);
        }

    }

    private void compileIntoSplittedFiles(JsCompilerExtension extension, CompilerOptions options, List<SourceFile> externs, List<SourceFile> inputs) {

        if (extension.getOutputPath() == null || extension.getOutputPath().isEmpty()) {
            throw new GradleException("Output path is mandatory if combineAllFiles is false");
        }
        String destination = checkOutputPath(extension.getOutputPath());
        
        for (SourceFile input : inputs) {
            Compiler compiler = new Compiler();
            File inputFile = new File(input.getName());
            String path;
            if (extension.isKeepSameName()) {
                path = ResourceUtils.addToPath(destination, inputFile.getName());
            } else {
                path = ResourceUtils.addToPath(destination, ResourceUtils.minifiedName(inputFile.getName()));
            }
            File output = ResourceUtils.getOutputFile(path, extension.getInputPath(), logger);
            Result result = compiler.compile(externs, Collections.singletonList(input), options);
            if (result.success) {
                ResourceUtils.write(output, compiler.toSource(), logger);
            } else {
                logger.warn("Result of compilation was false");
            }
        }

    }

    /**
     * Check if the provided outputh is a file or a directory. If it is a file takes the parent directory and if it doesn't exists it creates a new one.
     * @param outputPath from extension
     * @return the directory path
     */
    private String checkOutputPath(String outputPath) {
        File destFile = new File(outputPath);

        // If it is a file I should take the parent directory
        if (destFile.isFile() || ResourceUtils.hasJsExtension(outputPath)) {
            outputPath = destFile.getParent();
        }
        
        destFile = new File(outputPath);
        
        if (!destFile.exists()) {
            destFile.mkdirs();
        }

        return outputPath;
    }

    private void compileIntoSingleFile(JsCompilerExtension extension, CompilerOptions options, List<SourceFile> externs, List<SourceFile> inputs) {
        Compiler compiler = new Compiler();

        File output = ResourceUtils.getOutputFile(extension.getOutputPath(), extension.getInputPath(), logger);

        Result result = compiler.compile(externs, inputs, options);

        if (result.success) {
            ResourceUtils.write(output, compiler.toSource(), logger);
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
            if (ResourceUtils.isJsFile(inputFile)) {
                jsSourceFiles.add(SourceFile.fromFile(inputFile.getPath()));
            } else if (inputFile.isDirectory()) {
                File[] files = inputFile.listFiles();
                if (files != null) {
                    for (File file : files) {
                        if (ResourceUtils.isJsFile(file)) {
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

}

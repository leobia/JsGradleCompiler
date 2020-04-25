package com.leobia.gradle;

import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.*;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

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
            externs = CommandLineRunner.getBuiltinExterns(BROWSER);
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
        String destination = extension.getOutputPath();
        File destFile = new File(destination);
        if (destFile.isFile()) {
            destination = destFile.getParent();
        }
        for (SourceFile input : inputs) {
            Compiler compiler = new Compiler();
            File inputFile = new File(input.getName());
            String path = ResourceUtils.addToPath(destination, inputFile.getName());
            File output = ResourceUtils.getOutputFile(path, extension.getInputPath(), logger);
            Result result = compiler.compile(externs, Collections.singletonList(input), options);
            if (result.success) {
                ResourceUtils.write(output, compiler.toSource(), logger);
            } else {
                logger.warn("Result of compilation was false");
            }
        }

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

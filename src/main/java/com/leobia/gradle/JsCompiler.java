package com.leobia.gradle;

import com.google.javascript.jscomp.CompilationLevel;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.SourceFile;
import com.google.javascript.jscomp.WarningLevel;
import com.leobia.gradle.compilers.AbstractCompiler;
import com.leobia.gradle.compilers.SingleFileCompiler;
import com.leobia.gradle.compilers.SplittedFileCompiler;
import com.leobia.gradle.utils.ResourceUtils;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
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

        List<SourceFile> externs = getBuiltInExterns();

        List<SourceFile> inputs = getSourceInputFiles(extension);

        AbstractCompiler compiler;
        if (extension.isCombineAllFiles()) {
            compiler = new SingleFileCompiler(inputs, externs, extension, options, logger);
        } else {
            compiler = new SplittedFileCompiler(inputs, externs, extension, options, logger);
        }

        compiler.compile();
    }

    private List<SourceFile> getBuiltInExterns() {
        List<SourceFile> externs;
        try {
            externs = getBuiltinExterns(BROWSER);
        } catch (IOException e) {
            throw new GradleException("Error during getBuiltinExterns");
        }
        return externs;
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

        WarningLevel level = WarningLevel.valueOf(extension.getWarningLevel().toUpperCase());
        level.setOptionsForWarningLevel(options);
        return options;
    }


    /**
     * Retrieves js files from {@code extension.getInputPath()}.
     * <br>
     * <br>
     * <p>
     * ible cases of {@code extension.getInputPath()}:<br>
     * <ul>
     *     <li>is a js file (and exists) -> only this file will get compiled.</li>
     *     <li>
     *         is a directory -> all existing js file inside this dir will get compiled
     *         <ul>
     *             <li>
     *                 if {@code extension.isRecursiveSearchOnSource()} -> will get all js files in subfolders (except the one provided by {@code extension.getOutputPath()}
     *             </li>
     *         </ul>
     *     </li>
     *     <li>is not a dir and is not a .js file -> {@code new GradleException()}</li>
     * </ul>
     *
     * @param extension if it's a recursive search, outputPath will be excluded
     * @return list of source files retrieved from inputPath
     */
    public List<SourceFile> getSourceInputFiles(JsCompilerExtension extension) {
        String sourcePath = extension.getInputPath();
        List<SourceFile> jsSourceFiles = new ArrayList<>();

        File inputFile = new File(sourcePath);
        if (inputFile.exists()) {
            if (ResourceUtils.isJsFile(inputFile)) {
                jsSourceFiles.add(SourceFile.fromFile(inputFile.getPath()));
            } else if (inputFile.isDirectory()) {
                jsSourceFiles.addAll(retrieveJsFiles(inputFile, extension.isRecursiveSearchOnSource(), extension.getOutputPath()));
            } else {
                throw new GradleException("Input path not valid or does not exists!");
            }
        } else {
            throw new GradleException("Input path not valid or does not exists!");
        }
        return jsSourceFiles;
    }

    private Collection<? extends SourceFile> retrieveJsFiles(File inputFile, boolean recursiveSearchOnSource, String outputPath) {
        List<SourceFile> jsSourceFiles = new ArrayList<>();
        File[] files = inputFile.listFiles();
        if (files != null) {
            for (File file : files) {
                if (!file.getAbsolutePath().equals(outputPath)) {
                    if (ResourceUtils.isJsFile(file)) {
                        jsSourceFiles.add(SourceFile.fromFile(file.getPath()));
                    } else if (file.isDirectory() && recursiveSearchOnSource) {
                        jsSourceFiles.addAll(retrieveJsFiles(file, true, outputPath));
                    }
                } else {
                    logger.debug("Skipping file " + file.getAbsolutePath());
                }
            }
        }
        return jsSourceFiles;
    }

}

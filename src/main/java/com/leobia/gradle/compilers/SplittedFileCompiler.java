package com.leobia.gradle.compilers;

import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.Result;
import com.google.javascript.jscomp.SourceFile;
import com.leobia.gradle.JsCompilerExtension;
import com.leobia.gradle.utils.ResourceUtils;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.util.Collections;
import java.util.List;

public class SplittedFileCompiler extends AbstractCompiler {

    private final List<SourceFile> sourceFiles;
    private final List<SourceFile> externs;
    private final JsCompilerExtension extension;
    private final CompilerOptions options;

    public SplittedFileCompiler(List<SourceFile> sourceFiles, List<SourceFile> externs,
                                JsCompilerExtension extension,
                                CompilerOptions options, Logger logger) {
        super(logger);
        this.sourceFiles = sourceFiles;
        this.externs = externs;
        this.extension = extension;
        this.options = options;
    }

    @Override
    public void compile() {
        String outputPath = extension.getOutputPath();

        if (outputPath == null || outputPath.trim().isEmpty()) {
            throw new GradleException("Output path is mandatory if combineAllFiles is false");
        }

        String destinationDir = createDestinationDir(outputPath);

        if (sourceFiles != null) {

            for (SourceFile sourceFile : sourceFiles) {
                Compiler compiler = new Compiler();
                File file = new File(sourceFile.getName());
                String outputFileName = getOutputFileName(file.getName(), destinationDir);

                File outputFile = createOutputFile(outputFileName, extension.getInputPath());
                Result result = compiler.compile(externs, Collections.singletonList(sourceFile), options);
                if (result.success) {
                    ResourceUtils.write(outputFile, compiler.toSource(), getLogger());
                } else {
                    getLogger().warn("Result of compilation was false");
                }
            }

        } else {
            getLogger().warn("No source file found!");
        }

    }

    private String getOutputFileName(String name, String destinationDir) {
        String path;

        if (extension.isKeepSameName()) {
            path = ResourceUtils.addToPath(destinationDir, name);
        } else {
            path = ResourceUtils.addToPath(destinationDir, ResourceUtils.minifiedName(name));
        }

        return path;
    }

    private String createDestinationDir(String outputPath) {

        File destinationFile = new File(outputPath);

        if (destinationFile.isFile() || ResourceUtils.hasJsExtension(outputPath)) {
            destinationFile = new File(destinationFile.getParent());
            outputPath = destinationFile.getParent();
        }

        if (!destinationFile.exists()) {
            destinationFile.mkdirs();
        }

        return outputPath;
    }
}

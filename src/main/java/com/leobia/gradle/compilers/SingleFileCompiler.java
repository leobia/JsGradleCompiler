package com.leobia.gradle.compilers;

import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.Result;
import com.google.javascript.jscomp.SourceFile;
import com.leobia.gradle.JsCompilerExtension;
import com.leobia.gradle.utils.ResourceUtils;
import org.gradle.api.logging.Logger;

import java.io.File;
import java.util.List;

public class SingleFileCompiler extends AbstractCompiler {

    private final List<SourceFile> sourceFiles;
    private final List<SourceFile> externs;
    private final JsCompilerExtension extension;
    private final CompilerOptions options;

    public SingleFileCompiler(List<SourceFile> sourceFiles, List<SourceFile> externs,
                              JsCompilerExtension extension,
                              CompilerOptions options, Logger logger) {
        super(logger);
        this.sourceFiles = sourceFiles;
        this.externs = externs;
        this.extension = extension;
        this.options = options;
    }


    /**
     * Compile all input files and externs into a single file. The name of the file if not specified
     * in JsOptions will be "script.min.js"
     */
    public void compile() {
        Compiler closureCompiler = new Compiler();

        File compiledFile = createOutputFile(extension.getOutputPath(), extension.getInputPath());

        Result result = closureCompiler.compile(externs, sourceFiles, options);

        if (result.success) {
            ResourceUtils.write(compiledFile, closureCompiler.toSource(), getLogger());
        } else {
            getLogger().error("Result of compilation was false");
        }

    }

}

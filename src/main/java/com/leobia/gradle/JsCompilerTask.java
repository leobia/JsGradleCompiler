package com.leobia.gradle;

import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;

import javax.inject.Inject;

public class JsCompilerTask extends DefaultTask {

    private JsCompilerExtension extension;
    private JsCompiler compiler;

    @Inject
    public JsCompilerTask(JsCompilerExtension extension) {
        this.extension = extension;
    }

    @TaskAction
    public void compileJs() {
        compiler = new JsCompiler(getLogger());
        compiler.compile(extension);
    }
}

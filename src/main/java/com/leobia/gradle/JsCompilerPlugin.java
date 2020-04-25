package com.leobia.gradle;

import org.gradle.api.Plugin;
import org.gradle.api.Project;

public class JsCompilerPlugin implements Plugin<Project> {
    @Override
    public void apply(Project project) {
        JsCompilerExtension extension = project.getExtensions().create(("jsOptions"), JsCompilerExtension.class);
        project.getTasks().create("compileJs", JsCompilerTask.class, extension);
    }
}

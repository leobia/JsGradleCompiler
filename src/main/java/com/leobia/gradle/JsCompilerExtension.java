package com.leobia.gradle;

public class JsCompilerExtension {

    private String inputPath;
    private String outputPath;
    private String compilationLevel = "SIMPLE_OPTIMIZATIONS";
    private String warningLevel = "DEFAULT";
    private String jsVersionIn;
    private String jsVersionOut;
    private boolean combineAllFiles = false;
    private boolean keepSameName = true;
    private boolean recursiveSearchOnSource = false;

    public String getInputPath() {
        return inputPath;
    }

    public void setInputPath(String inputPath) {
        this.inputPath = inputPath;
    }

    public String getOutputPath() {
        return outputPath;
    }

    public void setOutputPath(String outputPath) {
        this.outputPath = outputPath;
    }

    public String getCompilationLevel() {
        return compilationLevel;
    }

    public void setCompilationLevel(String compilationLevel) {
        this.compilationLevel = compilationLevel;
    }

    public String getWarningLevel() {
        return warningLevel;
    }

    public void setWarningLevel(String warningLevel) {
        this.warningLevel = warningLevel;
    }

    public String getJsVersionIn() {
        return jsVersionIn;
    }

    public void setJsVersionIn(String jsVersionIn) {
        this.jsVersionIn = jsVersionIn;
    }

    public String getJsVersionOut() {
        return jsVersionOut;
    }

    public void setJsVersionOut(String jsVersionOut) {
        this.jsVersionOut = jsVersionOut;
    }

    public boolean isCombineAllFiles() {
        return combineAllFiles;
    }

    public void setCombineAllFiles(boolean combineAllFiles) {
        this.combineAllFiles = combineAllFiles;
    }

    public boolean isKeepSameName() {
        return keepSameName;
    }

    public void setKeepSameName(boolean keepSameName) {
        this.keepSameName = keepSameName;
    }

    public boolean isRecursiveSearchOnSource() {
        return recursiveSearchOnSource;
    }

    public void setRecursiveSearchOnSource(boolean recursiveSearchOnSource) {
        this.recursiveSearchOnSource = recursiveSearchOnSource;
    }
}

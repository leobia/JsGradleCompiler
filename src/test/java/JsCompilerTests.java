import com.google.javascript.jscomp.SourceFile;
import com.leobia.gradle.JsCompiler;
import com.leobia.gradle.JsCompilerExtension;
import org.gradle.api.logging.Logging;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class JsCompilerTests {

    @Test
    public void getSourceFilesPlain() {
        JsCompilerExtension extension = new JsCompilerExtension();
        JsCompiler jsCompiler = new JsCompiler(Logging.getLogger(JsCompilerTests.class));

        extension.setInputPath("src/test/resources");
        extension.setRecursiveSearchOnSource(false);
        extension.setOutputPath("src/test/resources/minified");
        List<SourceFile> inputFiles = jsCompiler.getSourceInputFiles(extension);

        assertEquals(4, inputFiles.size());

        List<String> possibleFiles = Arrays.asList("src/test/resources/mixins.js",
                "src/test/resources/polar_functions.js",
                "src/test/resources/writeTest.js",
                "src/test/resources/xhrRequestHandler.js");
        List<String> fileNamesFound = inputFiles.stream().map(SourceFile::getName).collect(Collectors.toList());
        assertEquals(new HashSet<>(possibleFiles), new HashSet<>(fileNamesFound));
    }

    @Test
    public void getSourceFilesRecursive() {
        // Output folder empty
        JsCompilerExtension extension = new JsCompilerExtension();
        extension.setInputPath("src/test/resources");
        extension.setRecursiveSearchOnSource(true);
        extension.setOutputPath("src/test/resources/minified");
        JsCompiler jsCompiler = new JsCompiler(Logging.getLogger(JsCompilerTests.class));
        List<SourceFile> inputFiles = jsCompiler.getSourceInputFiles(extension);
        assertEquals(7, inputFiles.size());

        List<String> possibleFiles = Arrays.asList("src/test/resources/mixins.js",
                "src/test/resources/polar_functions.js",
                "src/test/resources/writeTest.js",
                "src/test/resources/test/alasql_custom.js",
                "src/test/resources/test/custom_d3_functions.js",
                "src/test/resources/test/custom_functions.js",
                "src/test/resources/xhrRequestHandler.js");
        List<String> fileNamesFound = inputFiles.stream().map(SourceFile::getName).collect(Collectors.toList());
        assertEquals(new HashSet<>(possibleFiles), new HashSet<>(fileNamesFound));


        // Check if output folder is excluded
        extension.setInputPath("src/test/resources");
        extension.setRecursiveSearchOnSource(true);
        extension.setOutputPath("src/test/resources/test");
        inputFiles = jsCompiler.getSourceInputFiles(extension);

        assertEquals(4, inputFiles.size());

        possibleFiles = Arrays.asList("src/test/resources/mixins.js",
                "src/test/resources/polar_functions.js",
                "src/test/resources/writeTest.js",
                "src/test/resources/xhrRequestHandler.js");
        fileNamesFound = inputFiles.stream().map(SourceFile::getName).collect(Collectors.toList());
        assertEquals(new HashSet<>(possibleFiles), new HashSet<>(fileNamesFound));

    }

    @Test
    public void getSourceFilesFromEmptyFolder() {
        JsCompilerExtension extension = new JsCompilerExtension();
        extension.setInputPath("src/test/resources/emptyFolder/");

        JsCompiler jsCompiler = new JsCompiler(Logging.getLogger(JsCompilerTests.class));
        List<SourceFile> inputFiles = jsCompiler.getSourceInputFiles(extension);

        assertEquals(0, inputFiles.size());
    }

    @Test
    public void getSourceFilesFromNotJs() {
        JsCompilerExtension extension = new JsCompilerExtension();
        extension.setInputPath("src/test/resources/notJsFiles");

        JsCompiler jsCompiler = new JsCompiler(Logging.getLogger(JsCompilerTests.class));
        List<SourceFile> inputFiles = jsCompiler.getSourceInputFiles(extension);

        assertEquals(0, inputFiles.size());
    }

    @Test
    public void getSingleSourceFile() {
        JsCompilerExtension extension = new JsCompilerExtension();
        extension.setInputPath("src/test/resources/mixins.js");

        JsCompiler jsCompiler = new JsCompiler(Logging.getLogger(JsCompilerTests.class));
        List<SourceFile> inputFiles = jsCompiler.getSourceInputFiles(extension);

        assertEquals(1, inputFiles.size());
        SourceFile sourceFile = inputFiles.get(0);
        assertEquals("src/test/resources/mixins.js", sourceFile.getName());
    }
}

import com.leobia.gradle.utils.ResourceUtils;
import org.gradle.api.GradleException;
import org.gradle.api.logging.Logging;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

public class ResourceUtilsTests {

    @Test
    public void hasJsExtensionTest() {
        assertTrue(ResourceUtils.hasJsExtension("test.js"));
        assertTrue(ResourceUtils.hasJsExtension("test.min.js"));
        assertTrue(ResourceUtils.hasJsExtension("/absolute/path/to/script/test.js"));
        assertFalse(ResourceUtils.hasJsExtension(""));
        assertFalse(ResourceUtils.hasJsExtension("test.minjs"));
        assertFalse(ResourceUtils.hasJsExtension("test.ts"));
        assertFalse(ResourceUtils.hasJsExtension("test"));
        assertFalse(ResourceUtils.hasJsExtension("/directory/to/script"));
    }

    @Test
    public void isJsFileTest() {
        assertTrue(ResourceUtils.isJsFile(new File("src/test/resources/mixins.js")));
        assertTrue(ResourceUtils.isJsFile(new File("src/test/resources/polar_functions.js")));
        assertTrue(ResourceUtils.isJsFile(new File("src/test/resources/xhrRequestHandler.js")));
        assertTrue(ResourceUtils.isJsFile(new File("src/test/resources/test/alasql_custom.js")));
        assertFalse(ResourceUtils.isJsFile(new File("src/test/resources/test/")));
        assertFalse(ResourceUtils.isJsFile(new File("src/test/resources/dir")));
        assertFalse(ResourceUtils.isJsFile(new File("src/test/resources/test.md")));
        assertFalse(ResourceUtils.isJsFile(new File("src/test/resources/test.xml")));
    }

    @Test
    public void addToPathTest() {
        String sep = File.separator;
        assertEquals("src" + sep + "test" + sep + "resources", ResourceUtils.addToPath("src" + sep + "test", "resources"));
        assertEquals("src" + sep + "test" + sep + "resources", ResourceUtils.addToPath("src" + sep + "test" + sep + "", "resources"));
        assertEquals("src" + sep + "test" + sep + "resources.js", ResourceUtils.addToPath("src" + sep + "test", "resources.js"));
        assertEquals("src" + sep + "test", ResourceUtils.addToPath("src", "test"));
    }

    @Test
    public void writeTest() {
        String data = "test" + new Random();
        String sep = File.separator;
        File notExistingFile = new File("src" + sep + "test" + sep + "resources" + sep + "writeExceptionTest" + sep + "script.min.js");
        assertThrows(GradleException.class, () -> ResourceUtils.write(notExistingFile, data, Logging.getLogger(ResourceUtilsTests.class)));

        File existingFile = new File("src" + sep + "test" + sep + "resources" + sep + "writeTest.js");
        ResourceUtils.write(existingFile, data, Logging.getLogger(ResourceUtilsTests.class));

        try {
            FileReader fr = new FileReader(existingFile);
            BufferedReader br = new BufferedReader(fr);
            String line;
            StringBuilder fileData = new StringBuilder();
            while ((line = br.readLine()) != null) {
                //process the line
                fileData.append(line);
            }
            assertEquals(data, fileData.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }


    }

}




# Js Gradle Compiler :zap:

A simple Js compiler for gradle (tested only on Gradle 6.0+). Given a folder containing .js files, the plugin will compile using Google closure compiler and minify them.

## Instructions :pencil:

As stated before the plugin was tested and developed with gradle 6 so I cannot ensure functionality with older versions.

#### Install the plugin locally

As of now Gradle has not accepted the plugin so to use it you have to download the source code put it inside your project and run the task:

    uploadArchives

This task will create a folder *repo/* in your project that contains the jar of the plugin.

#### Apply the plugin
Now that you have the plugin installed inside your project you can apply it. 
To do so add these following lines to your *build.gradle*:

    buildscript {  
      repositories {  
        maven {  
          url uri("../repo") // This basically tells gradle to search plugins inside 
                             // the repo directory that we created before
        }  
      }  
      dependencies {  
        classpath "com.leobia.gradle:jsgradlecompiler:0.1.0" // this is my plugin
      }  
    }
    apply plugin: "com.leobia.gradle.jsgradlecompiler"

#### Use the plugin
The usage of the plugin it's pretty simple, first you define the options (inside the *build.gradle*):

    jsOptions {  
      inputPath = file("./resources/")  
      outputPath = file("./resources/minified/test.js")  
      compilationLevel = "SIMPLE_OPTIMIZATIONS"  
      jsVersionIn = 'ECMASCRIPT_2015'  
      jsVersionOut = 'ECMASCRIPT5'  
      combineAllFiles = true  
    }


|Option       |Type     |Description                                                                               |
|-------------|---------|------------------------------------------------------------------------------------------|
|inputPath*   |String   |It telss the plugin where to search input files (not recursive)                           |
|outputPath |String   |Path where output should be saved. Can be a directory or a single file. If it is a directory it will be used the input file name (the same behaviour is used if it is a file but the flag *combineAllFiles* is **false**)              |
|compilationLevel         |String  |[Possible values](https://developers.google.com/closure/compiler/docs/compilation_levels): WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS or ADVANCED_OPTIMIZATIONS|
|jsVersionIn  |String   |[Possible values](https://javadoc.io/doc/com.google.javascript/closure-compiler/latest/com/google/javascript/jscomp/CompilerOptions.LanguageMode.html)    |
|jsVersionOut  |String   |[Possible values](https://javadoc.io/doc/com.google.javascript/closure-compiler/latest/com/google/javascript/jscomp/CompilerOptions.LanguageMode.html)    |
|combineAllFiles  |Boolean |Tells if the output should be merged into single file or the input file name should be preserved    |

and then you can call the task:

    compileSass

## What's next  :rocket:


These are the main features that I plan to include in the project :

 - Keep same name or .min.js
 - Recursive file search
 
## Built With :hammer:

* [Gradle](https://gradle.org/) - Dependency Management
* [jsass](https://jsass.readthedocs.io/en/latest/) - Used to compile sass

## Author :boy:

* **Leonardo Bianco** - [leobia](https://github.com/leobia)

Checkout my Gradle [SassCompiler](https://github.com/leobia/SassGradleCompiler) 

## License :page_facing_up:

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details


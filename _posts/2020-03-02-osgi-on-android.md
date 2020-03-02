I recently had to do some research in running an OSGi Framework as an Android application. The reason was that hardware vendors are trending to Android instead of plain Linux. The good GUI abstraction also helps of course.

When Google designed Android they made the decision to not license a Java VM from Sun/Oracle for financial reasons. Instead, they took the Java language syntax and developed a new VM architecture: Dalvik. Any developer older than 25 can probably remember the [lawsuits](https://en.wikipedia.org/wiki/Google_v._Oracle_America) from a very unhappy Oracle.

Since Java became open source in the [OpenJDK](https://openjdk.java.net/) project a few years ago, [Dalvik](<https://en.wikipedia.org/wiki/Dalvik_(software)>) at least is now using the same Java 1.8 class library as good old Java. The biggest remaining difference left is the _class loading architecture_. Clearly, this is the area where OSGi is having most of its fun ...

## History

When Android came out in 2007 it was big news. (I was actually quite disappointed that they had ignored OSGi.) From the start, it seemed like an interesting platform for OSGi applications. Karl Pauls (Adobe) seemed to have agreed, and he quickly changed the Apache Felix Framework to support Dalvik class loaders.

Over time this support ran inevitably into bitrot. The Android platform developed further and they made some quite large chances that caused the Android support in Apache Felix to stop working. At least, that was the story that Karl told me after I'd wasted a few hours failing to get a tiny Android application with OSGi to work. Bummer.

What Karl also told me was that in the OSGi Alliance, they'd revived an [idea from 2011](https://blog.osgi.org/2011/04/osgi-lite.html) that we had worked on. This was the idea of [OSGi Connect](https://blog.osgi.org/2019/09/osgi-connect-revisited.html). This is an OSGi framework without an idea of class loading. Although this sounds as useful as a car without wheels, it actually does make sense.

The biggest contribution OSGi made to the software industry is the _service layer_ with its _microservices_. The module layer was a requirement to support dynamic loading but the service layer provides the most reliable software architecture technique that I am aware of. OSGi Connect supports the service layer on any class loading substrate if you can provide a _Module Connector_.

This is useful to integrate JPMS but more important, it turned out to be a lifesaver for my Android ambitions! After having obtained a [prototype OSGi Connect Framework](https://github.com/apache/felix-dev/tree/connect/framework) from Karl I created a fully working Proof of Concept within a few days.

## OSGi Connect

With OSGi Connect, a third party can take over class loading and resource handling from the OSGi Framework. The _Module Connector_ can intercept an install operation, the interceptor can then take over class loading and resource handling for a specific bundle. For example, classes could come from a database or a flat classpath.

The Module Connector will intercept the install operations. If the Module Connector recognizes the bundle location pattern then it can return a _Connect Module_. A Connect Module has a 1:1 relation with an OSGi Bundle. Bundles, however, can have different _revisions_. A Bundle Revision is modeled with a _Module Content_. Whenever a new revision is needed, the framework will ask the Connect Module for a new Module Content.

The Module Content can provide a special class loader and handles the resource _entries_. The Framework can ask for a list of all entries as well as the content of one specific entry.

## Executable JAR

To get an application running on Android, the most logical start for me is bnd. In bnd, a runtime specification is specified in a _bndrun_ file. This file contains all the relevant details to define what should happen in the runtime:

- Framework
- Initial Requirements
- Properties
- Execution Environment
- Extra Package & Capabilities

A `bndrun` file can be _resolved_ by an OSGi resolver. A resolver looks a the initial requirements and then finds the bundles satisfying these requirements from a set of repositories defined in its workspace. Resolving calculates the set of `-runbundles`.

A bnd _exporter_ takes this `bndrun` specification and turn it into an _Executable JAR_. An Executable JAR can be executed with `java -jar executable.jar` from the command line. These files are eminently suitable to turn into a Docker container.

## Launcher

The bnd library supports _pluggable_ [launchers](https://bnd.bndtools.org/chapters/300-launching.html). When a `bndrun` file is launched or turned into an `executable` JAR, bnd will use the `-runpath` to find a Project Launcher Plugin\_ . This Project Launcher then starts a properly setup Java VM or does the exporting. That is, you can easily insert your own launcher if so needed.

The primary bnd launcher is the `biz.aQute.launcher`.

Its export format is an executable JAR format. This JAR contains _all dependencies_, both bundles, and entries on the `-runpath`. When the JAR starts, the following happens:

- A class loader is created with the `-runpath` entries
- The Launcher class is loaded from the new class loader
- The main method is invoked. The Launcher then
  - creates a framework
  - installs all embedded bundles
  - assigns start levels

It should be obvious that this launcher needed to be adapted to support OSGi Connect. This turned out to be a very small change that should be in bnd's snapshot when you read this. The launcher looks on the `-runpath` to see if there is a `ModuleConnector` service via the Java Service Loader. If this Module Connector was present, the Framework is launched in _connect mode_. To use this, just create a JAR with a Module Connector service, place it on the `-runpath`, and it will the Module Connector will be instantiated and given to an OSGi Connect framework.

### Flatter

The changes to the launcher enabled me to work with an OSGi Connect framework. However, the next question became then how the runtime would look like on Dalvik? I ran some failed experiments with multiple class loaders. To put it mildly, class loading on Dalvik is toddler level; clearly not well supported and not as mature as Java. On the Internet, lots of people whined about compatibility issues so I decided to stay away from Dalvik class loaders.

The best solution was, therefore, to run everything in a single class loader, actually the original idea of OSGi Connect!

A _flat_ class space removes information. Clearly, it removes the possibility to use the same class in multiple versions, a unique selling point of OSGi. Although this requirement is not unimportant it was not opportune for the PoC, and I saw some solutions if it would become critical.

However, for resources the lack of duplicates is fatal. A crucial resource that is duplicated in _every_ bundle is the manifest. And the OSGi model really promotes using the JAR for things like the [extender pattern](https://blog.osgi.org/2007/02/osgi-extender-model.html) where resources are stored in fixed places.

To make it possible to handle duplicate resource names between bundles I wrote a little tool called `Flatter`. It takes an executable JAR generated by the bnd Launcher and _flattens_ it into an _output_ JAR. That means that all JARs in the executable JAR are unzipped and all classes in these JARs are stored in the root of the output JAR.

If you paid attention then you should've realized that this can cause conflicts. When different bundles contain the same class then this is a duplicate. The Flattener ignores duplicates if the classes are identical. Currently, it will print an error and use the first one. A better solution is to rename these classes.

Resources in bundles are also copied to the JAR but each bundle had its own resource area. I.e. this is the layout:

    META-INF/
       MANIFEST.MF
       services/
         ...
    BUNDLES/
      index
      bundle-0/
        index
        ...
      bundle-1/
      ...
      bundle-12/

Initially, each resource was placed in the special bundle directory. I.e. for the first bundle, a resource `foo/bar.txt` would be stored in `BUNDLES/bundle-0/foo/bar.txt`. The `BUNDLES/index` file contains a list of the original paths of the bundles in the specification. Therefore, the index of a path would be the suffix number of the bundle directory. That is, if the `jar/foo.jar` was the third entry in the `BUNDLES/index` file, then the bundle directory would be `BUNDLES/bundle-3/`.

However, during testing, it turned out that some bundles use the `getResource()` call on their Class Loader. Especially localizations that use the `java.util.BundleResource` utility tends to store language translations together with their classes. Since there is only one Class Loader, there was no way to direct the `getResource()` call to the proper bundle directory. Worse, in Android, there is not even a reliable way to override this `getResource` method on the Class Loader.

For this reason, the resources of a bundle were by default placed in the root of the output JAR. Only when the destination path was already taken, and the resources were actually different, was the duplicate resource placed in the bundle area. The manifest was _always_ placed in the bundle area since this is mainly an OSGi concept and accessed using the OSGi API.

Although this was aesthetically not a very pleasing solution (it is messy in the root of the output JAR, with all those unrelated resources) it solved the problem that some (usually non-OSGi) bundles relied on the `getResource()` calls.

Once the structure was established, the Module Connector implementation was easy to make a small JAR that held the Module Connector that could work with this structure. And although the target was Android, the same structure can also be used on a Java VM. This made it straightforward to test it in Bndtools.

## And now on Android ...

Once the code worked nicely in Java, it was time to move it to Android. I created a default project in Android Studio and added the output jar that was created by Flatter to the `libs` folder. The Gradle build of Android can pick this up. (Although for some unfathomable reason the developer is responsible to sync it with Android Studio. After Bndtools, this feels like the dark ages.)

Android Studio actually uses the Java compiler during development, there is no Dalvik compiler. Only when the application needs to be deployed for testing or production, are the _Java bytecode_ compiled into Dalvik code by the _DEX_ compiler. Interestingly, the Android build does a similar process in the build as the Flatter does. All classes and resources are flattened by the DEX compiler. However, it does not handle duplicate resources in any way.

Initially, I ran into lots of nasty problems, giving me the impression this might not be the best idea to pursue. Fortunately, this was caused by not telling Gradle to use Java 1.8 code. The DEX compiler needs to be told to _desugar_ the Java 8 code. It turns out that there are missing pieces in Dalvik that are part of Java 8. The DEX compiler converts these missing pieces into standard Dalvik code. Ugly?

## Execution Environment

OSGi has the concept of an _execution environment_ (EE). An EE is the set of packages and their classes, for example, the packages in JavaSE 1.8. The purpose is to make explicit what the _minimum_ environment is that the bundle assumes to be available in the runtime. OSGi bundles have a _requirement_ on a minimum EE, bnd will by default add a requirement for the JavaSE related to the source compile version. I.e., if compiled against Java 1.8, a default requirement will be added for EE `JavaSE;version=1.8`.

However, Dalvik is clearly not Java 1.8. Fortunately, the Framework nicely told me the missing packages. I exported the packages from the framework, and admit that I even lied for some packages that were not on the classpath (`javax.management`) assuming the bundle could live without it. (It could.) Doing this work showed how valuable the OSGi metadata is. Instead of running the application until you get a Class Not Found Exception, you have the resolver! And when it resolves, you truly know it is all there. It still amazes me how well this all works.

## Atomos

Karl Pauls and Thomas Watson (IBM) already had started a project called [atomos](https://github.com/tjwatson/atomos) that focused on this runtime aspect. I had tried to use it initially but there were some Java 9 classes in the way so I just created my own Module Connector. However, this is interesting work they are doing and I intend to work with them to get Android support in this project.

## Conclusion

The PoC clearly showed there are no major roadblocks to run OSGi on Android. I doubt that OSGi is very useful for phone or TV applications. Although I am not impressed with Android Studio in any way, it is hard to compete with an environment that is made for a target.

However, Android platforms are sold in the billions. This means that a lot of companies are working hard to create hardware and software. Although Linux is a very popular abstraction, it does look like the market is converging on the Android distribution.

Using OSGi Connect on Android will allow developers to use the unsurpassed Bndtools to build their applications. I know I am biased but I the interactive fluidity of Bndtools development is IMHO unsurpassed, it combines the best of a compiler, builder, and a [REPL development mode](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop). I often see that people are blown away when I demonstrate how to use Bndtools the proper way. (If you're curious, I recently developed a set of [videos and an OSGi Starter](https://bndtools.org/workspace.html).)

Anyway, let me know if you see a use for this work or think that I wasted my time.

    [Peter Kriens](https://twitter.com/pkriens)

---
title: Principles of OSGi
description: Discussion of the principles behind OSGi
layout: post
---

# Principles of OSGi

This is the more theoretical section that only the 1% will read. You can safely skip it and belong to the 99%, it is just a section where the ideas behind the classic OSGi enRoute, and largely behind OSGi, are given some more footing so that that minority that actually wants to know where things come from are also satisfied.

## Principles

With the Internet today it is no problem to find a solution to almost any detailed question. It is therefore hard to understand how we worked only a decade ago without Google, Bing, and Stack Overflow at our finger tips. Across my desk there are hundreds of books explaining CVS, XML, XSLT, LDAP, and other old technologies, silently testifying about this BG (Before Google) era. However, there are also books in that bookshelf that do not prescribe a solution to a detailed problem but that attempt to go deeper into the mysteries of the software development process. Books that discuss the _principles_ of the software development process without reverting to ephemeral screen shots.

So why are principles important? Principles are important because they _guide us_ towards solutions to problems we are not always directly aware of. Software is a frighteningly complex endeavor that forces its practitioners to make hundreds to thousands of decisions each day; decisions that can actually have quite far reaching consequences. Though each of these decisions has a local optimum, it is not that local optimum that creates great systems. You cannot look at the millions of parts in a 747 airplane and point out a single part that makes it fly. Flying is the combined result of all those millions of parts _interacting_. To make these parts work, they need to be _designed_. To make these designs work together, we need an _architecture_ that defines the rules and constraints of the designs. To define an architecture we need principles that guide us in developing the _right_ architecture.

This chapter therefore outlines the principles in software development that are used in OSGi.

## Caveat

In software a situation is rarely black and white. In almost all cases there are many forces at play that make some solutions more desirable than others. In the upcoming chapters the different aspects of software development are discussed. Not with the intent to provide black and white rules but only with the hope that the forces for that aspect are understood and recognized.

This chapter is about the grey and there will be many cases of 'on the other hand'. There are actually a number of contradictions in this text because they do require trade offs that must be understood.

## Time

Trying to explain our industry to lay people is hard. It is hard because what we software developers are doing has remarkably little to do with the concrete world; cyberspace is truly a different area. We use words like _build_, _object_, and _framework_ that are defined in a concrete world but have much more ephemeral semantics in our virtual world. You build a house from concrete, stones, and wood, a far cry from flipping bits on a hard disk in what we call the build process. Objects are, yeah, what are objects actually? And where a real framework is touchable, our frameworks are intangible. No wonder that many of our partners are at a loss when we try to describe what it is that we do. We tend to utterly confuse them with these inadequate metaphors.

Out of this all, the hardest aspect to explain of our work is the _volatility_. The baker bakes bread, and the bricklayer builds buildings. They deliver a concrete result to their customers and the next day they bake or build something brand new, unrelated to yesterday's work. Software engineers 'build' their 'software' several times a day, but they seem to deliver largely the same thing over and over to their customers. We seem to be working on something that is continuously evolving but is still called the same. The closest metaphor is maybe a city. A city is a continuously evolving entity that never stands still, still we continue to call it the same name. Julius Ceasar would not recognize Rome today, yet it is still the same city that he once knew.

It is interesting to see how we lack proper terminology in our industry. In [maven][4] we talk about an artifact but it is not clear if it refers to the bits on disk (the JAR file), or the project that builds it, or maybe even something else? To use precise terminology in this document, we use the term _program_ for the what is the combination of _groupId_ and _artifactId_ in maven and _revision_ when a specific _version_ is added. The term _project_ defines the concept of a set of programs that can be used to _build_ a revision.

The difficulty of describing these core development processes clarifies why explaining to uninitiated what you do day in and out is hard. The core of our business is a long lasting process of reshuffling bits so that when they are combined with computers and users we achieve the results we promised. We call this process 'maintenance' but it has very little to do with the maintenance in the real world. In the real world, products deteriorate. A car needs an oil change or certain parts are designed to wear out over time and need to be replaced before they pass a breaking point, causing great damage. Bizarrely, in software we theoretically do not have wear and tear since a bit is a bit and they do not chance happenstance. A revision is immutable for all time. What we call 'maintenance' is actually a different process. In this process we:

- Fix bugs.
- Add features.

Though bugs can just be stupidities, quite often they are caused by the coder's assumptions of the environment. And when this environment changes, the assumptions are no longer met and the code fails. This is also sometimes called _bitrot_. It is the weird effect that, over time, programs that are not maintained will start to fail.

It should therefore be clear that a large part of our work is addressing the effects of time. The context changes, which requires us to change the software, which changes the context for others. When we develop software we should be aware at any time that we are not really building anything but that we are in a continuous re-shaping process. It is crucial to be aware that any real world system lives in an ever evolving context where our own changes contribute to this changing context. And where we must adapt to this changing context.

There are many practices in our industry that would be perfectly OK if change was not continuous. However, in world that never stops changing there will be unexpected consequences.

### Aggregations

A surprising example is _aggregating_, putting parts together in a greater whole. For example, you repackage a number of JARs in a single JAR. Every time you aggregate a set of parts, you create an additional responsibility because the underlying artifacts, the dependencies, will each change over time at their own rate. Each of these changes will add maintenance costs to rebuild the aggregate. Also, you will have to make the aggregation evolve at the rate of its fastest evolving part or the clients of the fastest moving part will be upset. Therefore, by aggregating you simplify the build but at the same time you increase the entropy.

Last but not least, you now also constrain the revisions of the constituents as they are in the aggregate. Clients, that need a different set of the constituents are out of luck.

The problems around aggregation are highlighted by the concept of _profiles_. A profile is a set of API artifacts aggregated together so that end users can have a single JAR to compile against. In the Java world there are a number of J2ME profiles, and of course Java SE and Java EE can also be seen as profiles when squinting the eyes a bit. Developers in general love them because it seems to simplify their lives considerably. That is, until they find out there is a newer version of a profile's constituent that they absolutely need or when it is time to add new parts and they find that the process of maintaining the profile is highly politicized since there are now many different interests to take into account. In the 90's Ericsson and HP had TMOS, a Telecom Management Operating System, that imploded because they found it impossible to release a revision that satisfied the needs of all their users.

Though an aggregate or repackaging can have benefits, see [Modularity], the drawbacks of increasing the rate of evolution and the additional constraints between the parts do have a cost caused when the aggregate is used in a continuously changing world. These costs are often ignored because they occur in the future after the initial aggregation decision. These future costs should be more consciously taken into account. We should reflect on our way of working not only with an eye towards processes in the real world, but be acutely aware of the effect of a continuous changing world for our software.

With respect to time, we should then take the following principles into account:

- Versioning – Ensure that independent parts are versioned so that we (and the computer) know exactly of what revision we are talking about.
- Prepare for change – Ensure that the code base is always optimal for additional changes since they will happen.
- Minimize the cost of change – Since things will change, ensure that when change happens the impact, and thus the cost, is minimal.

## Roles

In the coming sections we will look in detail into the different aspects of software development. In these descriptions we use different roles that are played by the actors in a development process. This does not imply that all these roles are different people, the same person likely plays all roles for small systems. However, it is useful to recognize that the roles are quite different.

- _Customer_ – Pays for the development of the system and thus sets the minimum requirements.
- _Architect_ – Responsible for the overall system design.
- _Designer_ – Creates designs for components and their APIs of the system
- _Coder_ – Codes components, and unit tests them.
- _Developer_ – Architect, Designer, or Coder
- _Assembler_ – Assembles a set of components into an application so it can be deployed.
- _Quality Assurance_ – Tests that the application meets the minimum requirements
- _Deployer_ – Takes an application and deploys it in a runtime system.
- _User_ – The people and systems using a system.

## Less is More

The [mathematical theory of complexity][6] is surprisingly, ehh, complex. Worse, it seems utterly useless for understanding or explaining software complexity. It seems that the best measure of software complexity is the good old simple _size_, although with some caveats. Officially called _lex parsimoniae_, or poetically phrased: 'Less is more'. In general a solution with fewer parts should be preferred over an equally valuable solution that uses more parts. This is [Ockham's razor][7] revisited for software.

The caveats are also poetically described, attributed to [Einstein][8], that 'Everything should be as simple as possible, but not simpler'. Or as the witticism: 'Every complex solution has a simple solution, that is plain wrong'. It is hard to describe where the balance is but in general it is best to err on the side of _conciseness_. This does not mean that shorter variable names are better or [packing ten statements in one line][9] will decrease the complexity of the software. However, given two equivalent functions but one larger than the other, then the smaller should have preference all things equal.

A tool to keep things small is to [Do Not Repeat Yourself]. Ensure that each concept, fact, item, function, is only defined once and use a reference in other places. If several functions can share a common block, factor out this commonality. If you can reuse classes with small tweaks, do it. Your later readers and maintainers will have an easier life (although they might not be aware of your gift).

If the same thing can be expressed more concisely, then the difference is _cruft_. Cruft is the extra text around the stuff that really matters. Some languages, XML is a key example, are often more than 90% redundant. You can verify this by compressing a large XML file. Though a certain amount of redundancy can help understanding, it quickly becomes distracting because we humans have limited cognitive capabilities.

An important part why size is so relevant for complexity is our eyes and our mind. We humans have a limited cognition, it is assume we can handle about [7±2 'things'][10]. Actually, it is likely that this is 3 groups of 3 things. That is, up to about 3 or 4 'things' do not require counting. If you drop some matches on a table you immediately see that there are one, two or three matches, you do not need to count such low numbers. More than 3 matches tend to be grouped by us automatically, so 9 matches would be seen as 3 groups of 3 matches. This effect is called _subitizing_.

Over the 7±2 limit we need to _chunk_. Chunking means combining 'things' in higher level groups. In general we are good in working with large sets of things. For example, we all know the western alphabets that have between 25 and 30 characters. By chunking together letters we can words that can convey highly complicated material.

Our numbers have comma separators for thousands so we can more easily recognize the chunks. That is, 10000000 is hard to recognize as ten million but for 10,000,000 it does not require any effort. Looking at the Japanese and Chinese alphabets that have between a few thousands to 80.000 characters it is clear that humans can handle very large sets despite their limitation of working with 7±2 set members simultaneously.

A good example is the American telephone number system. Since it consists of ten digits it falls outside the range of what we humans are comfortable with. By breaking the number up in the area code (3 digits), exchange (3 digits), and line number (4 digits) we can remember it much easier.

In our industry we have been chunking since we left the switches on the first computers. Octal and Hexadecimal numbers took initially advantage of chunking. Assembly and higher level languages also chunked lower level concepts (microcode) into higher level concepts so they became easier to work with. Objects, and packages are higher level concepts that group underlying code. All with the effect that it becomes easier to reason about a software system. And why some code bases are really hard, they usually have many more than nine bundles, or nine packages per bundle, or nine objects per package. This is often inevitable but it should be realized that keeping the number of things low is a significant factor in simplifying.

It should now be obvious from this discussion why Modularity is so crucial. Modularity can limit the number of simultaneous concepts that need to be considered before a change can be made. Modularity is the primary chunking mechanism of software.

With respect to size, we should therefore take the following into account:

- Less is more, in general at least.
- Optimize for readability, small is beautiful, reduce cruft.
- Use chunking to keep the number of chunks that one needs to have in mind understanding a part to less than ten. This is in general why we have functions, objects, packages, and bundles.

## Modules

Modularity is the technique software developers have used since the beginning of time to keep complexity under control. A module provides a fence around its constituents and thereby chunks these constituents in a new concept. One can argue that a function is a module, it chunks a number of lines of code, and maybe some variables and parameters, into a uniquely named entity. After we chunked the lines this way, we can forget the inner details and only remember its function.

During the era of structured programming (1965-1985) grouping functions in a module was common. These concepts were explicit in some languages (Modula) or implicit by being in the same file. These modules provided some hiding but it was [Parnas][15] who wrote an essay in 1972 about the "On the Criteria To Be Used in Decomposing Systems into Modules" that decomposing systems into modules could significantly _simplify_ the overall system. Then again, improperly modularized systems can _complexify_ a system. Though there are many subtle issues at stake, decomposing a system into modules tries to optimize the impact of expected changes. A good modularization requires changes to only a small percentage of the modules, a badly modularized system affects a much larger percentage. The Dependencies, Cohesion, and other sections dive deeper into issues around the decomposition into modules.

### Objects

Alan Kay picked up on modules when he discovered _objects_ during the development of Smalltalk. Classes can be seen as modules that can be instantiated multiple times. This created a paradigm shift from _Structured Programming_ to _Object Oriented Programming_. In the eighties and early nineties the industry started to reluctantly embrace objects and classes; today they are mainstream.

When James Gosling developed Java in the early nineties he did not only embrace objects, he actually added another layer of modularity: packages. Package encapsulated classes, interfaces, and resources. It is clear that modularity is a process that has been applied multiple times in our industry.

Modules have multiple benefits. As Parnas discovered, a good decompositions simplifies an overall system and a bad decompositions complexifies it. However, modules also provide chunking which make them easier to use in large systems. A module provides a chunk that abstracts the underlying details. By only exposing a small part of the internal details, other developers are confronted with only a fraction of the parts that are hidden behind the module fence. Module developers, on the other side of the fence can limit what they expose to the outside world (export) and are limited in what they can take from the outside world (import). Therefore a module/component developer sees its module's internal (let's not call it private) parts and any imported parts. These are significantly fewer parts than will be in the overall system. Since complexity has a tendency to increase exponentially with the number of parts, as discussed in chunking, we can simplify the system by reducing the number of parts visible to other modules.

However, this hiding of parts provides another advantage. Parts that are not exported are _not known to anybody outside the module_. The consequence is that these parts can be changed at will. A change not visible outside the module can by definition not affect that other module. Any developer that has maintained software knows how scary it is to make changes to a code base because the scope of changes is so often hard to oversee. Properly modularized systems minimize this scope and therefore make it easier to adapt them to new needs. For example, changing a private method only affects its owning class. Your IDE actually helps you by giving a warning when a private field or method is not used; the IDE can only calculate this because the _scope_ is known. The IDE could even warn about package private fields/members that are not used but the IDEs are unfortunately not that clever yet.

Functions, modules, classes, and packages are all modules. It can be argued that the JAR file is also some form of module, it aggregates a set of packages. However, when [James Gosling][18] designed Java he did not provide any access controls on the JARs. He also almost completely discarded the boundaries of the JARs once they were deployed on the class path. The boundaries are still visible in a call like `ClassLoader.getResources()`, that returns resources with the same name but from different JARs, but that is about all; there are no visibility rules before Java 9.

Today, there is need for the next level of modularity. When systems grow, and the amount of software is doubled every 7 years, we are reaching a level where we need an additional level of modularity because the current JAR abstraction falls short. We need a module that provides proper encapsulation of our packages.

In 1998 a couple of companies, among which IBM, Ericsson, Nokia, Deutsche Telekom, Software AG, Oracle, Sun, and many others joined together to develop a software standard for residential gateways. Out of this effort grew the OSGi Alliance with its Core Framework and Service specifications. The OSGi Alliance started with the JAR file and provided a standard that made this JAR file a proper module: the Bundle. It gave the bundle an identity, it allowed packages to be exported, and packages to be imported. It extended Java in the most natural way by exporting and importing _packages_, not classes.

This choice is regarded as wrong by some people, for them classes would have been more natural. There is quite some disrespect for Java packages in our industry, which is quite wrong. First, packages are first class modules in Java since they have access rules, it is possible to make package private fields, methods, and classes. The reason people disrespect them is because there are no warnings in classic Java when you have JARs that contain the same packages on the class path, i.e. the so called _split packages_. Since class loaders provide the access rules domain you can get some hard to diagnose errors using split packages. Despite this grave concern, some developers find that being able to merge packages provides value. This is the same argument raised during the advent of object oriented programming when some of the boundaries were deemed to harsh and people tried to alleviate it by breaking through the abstractions. It is a sad truth that every generation somehow has to learn the same lessons.

One of the primary advantages of modules is that they provide _local scope_. If packages can be merged at run-time then there is no local scope since other JARs could have packages that, being merged, would have full accessibility. These merged packages would be broken if seemingly local changes were made. To preserve the benefits of modularity we must respect the boundaries of the previous modularity level. A Java class can export its members (fields, constructors, and methods) it can, however, not export a single line of code. A package can allow access to a class but it must respect the accessibility of the class' members. Therefore, a JAR should respect the package boundaries and not impose an additional access controls on it's classes. That is, as it should be, the responsibility of the class.

These arguments should make it clear why OSGi Bundles respect the package boundaries and use the package as the granularity for import and export.

The advantages of modularization can therefore be summarized:

- Decomposition – A properly decomposed system minimizes the number of modules that must be touched for a change request
- Chunking – Modules are chunks that are easier to conceptually manipulate then their combined constituents
- Fewer parts – Developers are seeing many fewer parts in a modularized system since they only see the parts of their own module and any imported parts. They are oblivious of the rest.
- Local Scope – The impact of a module local change can be easily reviewed since all parts that are aware of the change are locally available.

## Components

There is often confusion about modules, _components_, and bundles. In this section we define more accurately what a component is and how this concept relates to bundles/JARs since these different concepts are often used rather loosely.

A bundle can actually contain multiple components. The reason that this is not a 1:1 relation is that this would conflate the physical module (the JAR/Bundle) that delivers the code and resources and the logical module (the component) that represents the functionality in the system. Even though these concepts often overlap it would be an unnecessary constraint if they had to be the same. One of the rules of good design is not to conflate different concepts for convenience. The fact that the underlying responsibilities are different for bundles and components warrants different reifications. Most importantly, components packaged in the same bundle can keep more parts invisible to the outside world by privately sharing these parts.

For an example, in an application you can often find a set of highly cohesive components that share very similar dependencies. Forcing each of these components to be delivered as a separate JAR would make the overall system more complex without a fundamental reason. Obviously, it requires careful consideration to place components together since they will aggregate their dependencies. Only highly coupled components that have cohesion and share similar dependencies should be bundled together.

Not all components are created equally. There are a number of components that can be recognized. These are discussed in the following sections.

### Libraries

The most common component is a _library_. A library is a piece of code with no internal state and a public API. A library can be used by many different components; these client components should not be aware of of each other through this library. Good libraries should not use statics (global variables!) for this reason.

A library combines its public API with the implementation. That is, a pure library will not require a factory to create instances since implementation and public API fall together. Examples of libraries are ASM, the byte code analyzer and weaving library, Jackson the JSON (de)serializer library, and many others. Libraries usually have a very wide interface and cannot be substituted without a significant code change of its clients.

Libraries are logically part of the application. The reason they are separated from the application is because this minimizes memory consumption; both persistently as well as internal memory.

The history of library dependencies is quite interesting. [Maurice Wilkes][19], a developer of the EDSAC, is credited with the idea of macros and subroutine libraries, being one of the first software developers. This originally was a cabinet of archives with standard code that could be included by hand. Later linkers, programs that linked multiple modules together, could select procedures from libraries and link these into the application binary.

Dynamic linking, where the dependencies were kept in a separate file, became popular in the eighties because applications grew and memory was expensive. Clearly at the time this trade off was worth it. This, however, was at the root of the DLL hell problem in Windows. Sharing these dynamic libraries turned out harder than expected since they had to share a rather simple namespace in Windows. Installing a program could often corrupt other programs because the replacement was not backward compatible. Since memory cost has gone down the tide is turning again. In MacOS 10, it is no longer possible to share dependencies except from the operating system. The same is true for the iPad, it is impossible to share dependencies with other applications; each application must be stand-alone.

This makes a lot of sense since sharing opens up for many problems, being able to deliver a unit with all its dependencies prevents a lot of problems. Since memory has become so cheap that the cost has become negligible it makes sense to prevent these problems by letting an application carry its own dependencies. This is the primary reasons where even on a mobile phone download sizes measure in the tens of megabytes (or larger) for what seems simple applications.

In Java, a language that grew up in a period where static linking did not really exist anymore, dynamic linking is at the core. Very few environments provide the capability to static link applications, [bnd][16] is one of the few exceptions.

### Stateful Components

There are functions that provide a system wide function, shared by all other components. A good example is a configuration service; such a service will have to maintain a database of configuration objects. Though another component might be aware of the implementation class, it would have no use since it is important for this function that all components share the same _instance_.

In classic Java, stateful components are often constructed statically, which inevitably requires statics. Statics are evil since they are global variables. They tend to create singletons, often significantly constraining the solution space.

### Abstracted Components

An abstracted component separates its API from its implementation. They provide a shared function but abstract away the actual way it is implemented. Implementations might differ in their non-functional characteristics but it is also possible that they are optimized for different environments.

Abstracted components are selected based on their API, allowing the selection to be deferred to the assembler. Since the APIs are separated from the implementation, they can be specified by different persons/organizations. This allows for independent implementations of the components.

### Extender Components

Extender components utilize the reified modules (e.g. bundles) and their life cycle to act on behalf of other components. The purpose of the extender component is to simplify the implementation of other components by taking care of boilerplate code, allowing the other components to become smaller and more concise. For example, OSGi Declarative Services removes a myriad of dependency handling and configuration details from a component by inspecting an XML file in its bundle. Since the component code has no traces of these aspects, it becomes more readable and more predictable.

## Dependencies

The advantages of depending on another component are quite clear:

- Memory – Less memory usage since a component is only stored once and used many times.
- State – Sharing of state. Dependencies that provide an abstraction of a state must, by definition be shared.
- Abstraction

Using dependencies requires a balance between the cost of a dependency and the benefit. Let us first discuss some of the unexpected problems that arise due to dependencies.

Dependencies are the Jekyll & Hyde of software. The good Dr. Jekyll gives us the advantages of reuse, of not reinventing the wheel, and using less memory because we can share our dependencies. The bad Mr. Hyde then downloads the Internet behind our back because our direct dependencies also loved Dr. Jekyll and thus thought it was also a good idea to depend on other stuff. To make life worse, Mr. Hyde creates hidden constraints behind our backs on what we can actually combine and that bites us at unexpected times. Dependencies are problematic in monolithic applications but can become extremely complex when systems are build out of independent components, still the holy grail of software. There is a reason why the word 'Hell' has been associated with Mr. Hyde in this context so many times: DLL hell, JAR Hell, Dependency hell.

Most developers create software where dependencies are _implicit_, the original coder assumes that somewhere down the line there is an _assembler_ that puts all the dependencies together. The assembler is the role that takes a set of JARs, puts them on the class path and the tries to run the code. When one of the coder's assumptions are violated we see Class Not Found and other Exceptions, in some cases nothing happens, or the database is silently corrupted. Classic Java lacks a mechanism to declare dependencies and the result is that it often takes numerous attempts to find a working combination, usually by adding more JARs. A working combination that can still hide lots of problems because nobody knows what assumptions could potentially be violated. Even when Java introduced modules in Java 9 it was done in such a bad way that we still rely on manual verification or just praying.

This situation is often described as _JAR Hell_ (which comes from DLL hell, which arguably makes Microsoft look better, at least in the rhyming). JAR hell is the situation where you end up with incompatible versions of the same library on the class path. This problem comes down to the fact that two different JARs both depend on the same program but in a different revisions. In classic Java this problem is unsolvable because Java will always return the first class for a given name it finds, it cannot distinguish between classes from different revisions. It should be clear that adding additional JARs on your class path can seriously degrade the situation since these additional JARs carry additional dependencies that can potentially conflict.

[Maven][13] was a major step towards handling dependencies. Maven's dependency mechanism based on the JAR file, it gave the program an identity (the group Id the artifact Id) and added a version so it could handle multiple revisions, which in general are JAR files. Each program file had a `pom.xml` file that expressed the metadata and dependencies on other revisions. Since revisions had unique identities, they could now be stored in a repository, i.e. Maven Central.

Maven dependencies are _transitive_. That is, if you depend on another program you will get all its dependencies, and the dependencies of all those dependencies, ad nauseum. Transitive dependencies quickly add up and a common complaint at Maven is that it 'downloads the Internet'. That is not fair, Maven does not download the Internet, people download the Internet. It is the liberal use of dependencies that developers add to their programs, combined with the transitivity that causes the excessive downloads.

Dependencies forces us to consider the fundamental problems of sharing. It is not only about living with the behavior of the people that we depend on, which is not that hard because we are directly acquainted with them, but also how to live with the behavior of who they bring to the table. How can we control who will sit at that table? How do we know there are no conflicts? How do we verify that all our transitive dependencies get along? For example, what happens if two dependencies downstream require different revisions of the same program?

It should be clear that dependencies are a mixed bag. The benefits of sharing must be balanced against the problems of transitive dependencies. Lots of developers do not want to be bothered by this problem in any way. They keep adding JARs regardless of the cost. Since this clearly does not work in the long run, when the amount of written software will double once again over the next 7 years, how can we minimize the problems?

The most fundamental, and rather simple, solution to this problem is to just _minimize_ the number of dependencies. In general it is better to reuse what is out there then to write it yourself but the cost of the dependency (and its transitive dependencies!) should also be taken into account. Sometimes it is better to rewrite 16 lines of code instead of dragging in 36 Mb of extra JAR files (an actual case). The first rule is to become aware of what you actually depend on. If you use Maven, traverse the transitive dependencies to understand what will be put on your classpath. Unfortunately, IDEs provide very little feedback in general about the cost of adding a dependency.

The second technique to reduce dependency hell is to separate an Application Programmer Interfaces (API) from the implementation, even if there will only be a single implementation for this API ever. An explicit API decouples the implementation that _provides_ an implementation of an API from the implementation that _consumes_ this API. For example, [Equinox][1] is an implementation of the [OSGi Core Framework Specification][2], that is, it is a _provider_ of the OSGi Framework API. A bundle that uses the framework API is called a _consumer_.

One should look at APIs as a _contract_ between the consumer and the provider. The contract defines a number of roles that are played by either a consumer or a provider, outlining the responsibilities and guarantees.

A common confusion is that a provider always implements an interface, however this is not always true, a provider can also use interfaces that must be implemented by the _consumer_. For example, in the OSGi Framework API the `BundleActivator` interface is implemented by the consumer, not the provider. We must make sure not to confuse the provider with the implementer of an interface and the consumer with the user of an interface. Both providers and consumers can both use and implement interfaces.

Separating the API from an implementation fundamentally changes the dependency model. Instead of two parties (the [dependee][14] and dependent) we now have three entities: the party consuming the API, the API itself, and the provider of the API. The beauty of this model is that we've broken the transitive dependency chain. Neither the consumer nor the provider have a dependency on each other, they depend on the API only. Since the API has less dependencies by definition than an implementation, the consumer is significantly less inconvenienced with transitive dependencies incurred by the implementation. This is beneficial because it makes the component much lighter in weight, makes testing of a component easier since the API can be mocked, and it makes it impossible for a consumer to depend on implementation details of a provider. Best of all, it allows for different providers. Providers can come from different vendors that are in competition or implement the same functionality in different ways.

During the OSGi development the vision was always to create a market for reusable components that implemented common APIs. Now 20 years later and looking at the market share that vision has not come true. On the contrary, today Equinox (the Eclipse OSGi implementation) actually uses the Apache Felix OSGi Resolver because there was no business reason to develop a second implementation of this OSGi specification. After an initial flurry of competing open source groups and business in the noughties the environment consolidated into a disappointingly meager number of implementations. It was underestimated that making an implementations carried significant costs that few (open source) developers felt worthwhile. Part of this is the inevitable short time reasoning prevalient in the industry. However, many developers ran into situations where the specified API was deemed to lack necessary functionality. In many cases the expedient solution was seen to make something similar but not strictly compatible. Based on these experiences it is highly unlikely a component market will develop except for the most basic components.

Although accepting this behavior of developers was disappointing, it turned out that the API model is very useful for origanizations. Separating APIs from implementation provides a large number of advantages in the development process.

Obviously, APIS do not make the dependencies go away, we've only made the consumers independent of the provider's transitive dependencies. However, in the end, during run-time, we will actually need those dependencies to provide the desired functionality.

The best practice here is to combine all those dependencies in an _application component_. The application component is the component that selects the providers and consumer components and thereby establishes a class path. Since this makes the application component very heavy weight, it carries all the transitive dependencies, it should never be a dependency of other components, it should only be a leaf in the dependency graph. Adding extra dependencies to such leaf nodes add relatively little cost.

The emerging picture here is that virtually all developers work on components that depend on as little as possible. If they depend on anything they should depend on APIs and never on implementations. If there are no standard API then the development organization should establish an architecture board that maintains the organization's APIs. Each application component then chooses from the available components and provides the capabilities that match their requirements. Since these application components will be highly coupled they should not contain anything that other components could reuse. In practice, they are quite often empty and only specify requirements on other components.

This model is not common practice. Quite often organizations express the requirement that the developers should see the identical environment that is used in production. This is called _fidelity_. The Eclipse Plugin Development Environment (PDE) even goes out of its way to make the target development environment seem identical to the runtime even though it isn't. Fidelity is also engrained in maven and likely others; remains of a bygone world when applications were less complex.

So fidelity might sound like an attractive idea but in fact it is plain wrong.

Fidelity is a siren song because components will live for a long time; successful components will even become used in different applications. This makes it a certainty that even if an initial environment is identical to the developer's view, over time the production moves on; requiring all the components to be adapted. The importance of not knowing, that is, not being dependent upon, cannot be overstated. Any fact known to a developer about the production system will become, however subtly, engraved in the code and will fail when that fact changes somewhere in the future, which is inevitable. Working in an environment that (usually falsely) promises fidelity creates a huge dependency graph that is rarely if ever managed.

A developer's view of the world is already fundamentally different than the production view because it must use test harnesses and other tools to construct its components. Requiring fidelity is like requiring that your car was built in your parking lot. It is obvious why we build them in a plant, there a similar reasons why this is also true for software components.

A developer should focus on developing robust, API coupled components, that are usable in any context that matches _their_ requirements. This does not advocate developing only reusable components, it is well understood that developing reusable components is expensive and it is very hard to organize the right incentives in a development organization. Reusable components can grow out of this model but it is not the goal. The goal is make sure components have as little knowledge of the context as feasible so they are not affected when that context changes, which it will inevitably do.

Focusing on loosely coupled components does not us to run a sloppy set of things that are resolved in a production system. We should recognize that a deployment phase is where components are assembled and this is the place where fidelity between what the quality assurance team gets and what ends up in production becomes crucial.

This section only advocates for the development of components without encumbering them with unnecessary dependencies so they are resilient to changes in the production environment by being blissfully unaware of, and thus not affected by, those changes. Unfortunately this puts an extra burden on the developer because it means that just adding one more JAR on the class path becomes a liability. Instead, sometimes it is necessary to move functions to another module or duplicate code.

Asking developers to restrict themselves often runs against developers instincts. It often seems as if enterprise development is just another word for nothing left to add. However, the cost of a bug exponentially increases the later it is found in the process. However cumbersome it may feel for a developer to work around an unwanted dependency, this cost is handsomely paid back by a reduction in problems later down the production line. For the developers the incentive is less tedious maintenance work and the aesthetic pleasure of making elegant uncoupled components.

### Expressing Dependencies

Even if dependencies are minimized, they will not go away. This brings up the problem of how to refer to dependencies? In the Java world maven has set the standard with their naming scheme for JARs (group id, artifact id, and version). Having a repository then allows us to assemble a class path using a concise set of names. The huge advantage of this model is that it is simple, predictable, and well supported.

However, and you knew a however was coming, depending on JARs is not optimal. A dependency graph based on revisions tends to become large and brittle. The graph becomes large due to the aggregation of transitive dependencies. It becomes brittle because any change of a module requires all modules that transitively depend on it to be changed. Even small changes tend to ripple through the whole tree because the graph is rigid because the dependencies use unique identifies for a JAR. Even a bit change in JAR requires a new identity, usually a new version, even if that change did not _really_ affect any of its dependees. However, regardless of the impact, we must create new revisions of all these dependees.

There are the following issues at stake here. We should minimize the impact of a required dependency and we need some lubricant that can reduce the ripple effect of small changes.

The solution to these issues is to express the dependencies only for actual things that are used: the classes. When a JAR is needed, then look it up in a class-to-JAR index.

For many classic Java developers this is a brutal, unnecessary, and uncalled for complexification of the development process. They have nightmares of having to list thousands of class names in the project's descriptor, e.g. the pom. They also detest the idea of having anything more than a file system between them and the repository. And to a certain extent they are right (although the picture is not nearly as dire as they sketch it). Why would one complexify a situation that works? Well, many large projects have become entangled balls of mud; they've reached the limits of the simplistic model can handle. In the long run we just do not have a choice.

First let's address the listing of classes, would that create extra work? Well, it turns out developers are already listing those classes in their project. Every Java source file is explicitly importing packages or classes and these imports are encoded in the class files. It is quite trivial to make a tool that extracts these dependencies automatically, in fact that [has been done][16]. We even can reduce the sheer amount by using packages instead of classes. This is a better choice anyway since a class cannot be used in isolation since it is part of a package. Unfortunately, lots of classic Java developers do not see the package as a module but it really was the intention of James Gosling, and the Java Language Specification even mentions them as such. A package has visibility and encapsulation rules. The reason packages are often not seen as modules is that JARs did not enforce their modularity. Many developers therefore used packages without respecting their boundaries.

So packages are the natural choice for JARs to express their dependencies on.

Second, we need to address the indirection that is caused by not having a name for revision. Though it is often not realized, looking up a group id, artifact id, and version for a revision is also an indirection since it requires a repository. The same revision can actually live in different places. So looking up the dependency by the packages it provides is not a major deal. It is actually also a blessing in disguise since this same indirection can be used to address the lubrication issue and the dependencies on multiple versions problem.

The indirection allows us to have a separate process that does not mechanically constructs a class path but that can actually look at the overall set of requirements. Both the lubrication and version problem cannot be solved by looking at the parts, it requires us to take the constrains of other parts into account. For example, if one part requires version 1.3 of module X, and the other part requires version 1.5 of X, then we could decide that 1.5 is backward compatible and should be used in preference over 1.3 since it therefore satisfies the requirement of both dependees. Such a process hugely minimizes ripple effects in the dependency graph. This process is called _resolving_.

Though OSGi Frameworks have used resolving since 2003 the indirection is not without contention in the industry. There is a fear that resolving is a constraint solving process which is an NP complete problem and therefore can take too much time. The other fear is that it is indeterministic. Experience has shown that the NP-completeness is not even a remote problem in practice since the set of possible components should be limited. That is, you should not resolve against Maven central with its millions of JARs but that would be a grave mistake anyway. Any mature software organization will have software governance in place and limit the allowed dependencies. Though Maven central must keep all JARs forever, any development organization should have a current set of dependencies that can be used in production.

Though indeterminism is an interesting problem. First it is possible to ensure that what goes to quality assurance is identical to what goes to production so that there is no indeterminism. In this way, the resolving is used by the assembler to create an application out of a set of modules. The resolver will help him find the missing parts. However, one should realize that any large system is almost by definition indeterministic. Hard disks fail, networks are disrupted, modules throw Null Pointer Exceptions. Though we desperately try to avoid worrying about these things they do have effect on the environment the code runs in. Though we can completely lock down the production environment a case can be made that allowing a resolver to take the actual context into a account can seriously improve the robustness of a system.

### Generic Requirement Capabilities

In the previous sections we discussed dependencies with the assumption that they were code dependencies. However, the world is much richer than that. Developers that are coding are engraving many assumptions into their code. For example the version of the Java runtime. Each revision of Java brings new version of the class file format, making it impossible to run new code on an old VM. However, this important aspect is not recorded anywhere but the class file. The error is only detected when the code is run and throws an Incompatible Class Format Error when one of its classes is loaded, which can be many hours after the program was started.

Another module assumes that it runs on a machine that has more than 8GB of memory. Yet another module provides a certificate to the environment but there is no good way in classic Java to require that such a certificate is actually present.

Since these requirements and capabilities are not recorded anywhere, we have to revert to out of band (too often missing) documentation or in the end trial and error to make a set of modules work reliably together. It should be clear by now that one of the core principles of OSGi is that we have developers create loosely coupled components that are then assembled by an assembler into an application. Automating this assembly process, or making life easier for the assembler, is the primary goal. Having to revert to trial and error does not fit this goal.

It was with the goal to create systems that can be assembled out of components in mind that caused the OSGi Alliance to add a generic model for handling requirements and capabilities. Since the work got started in 1998 all requirements had been expressed in very detailed special headers. However, in [developing a repository model in 2006][16] it became clear that these myriad of headers had the same underlying principles. Each header either provided a _capability_ or expressed a _requirement_. For example, an exported package provides a capability (the package) to the environment. An imported package create a requirement on such an exported package. After analysis we found the following model could satisfy all needs:

- _Namespace_ – We found that it was necessary to define capabilities and requirements in a namespace. That is, every requirement belongs to a namespace and it can only require capabilities in that namespace.
- _Capability_ – It was sufficient to define capabilities as a set of key/value pairs, called attributes. The keys and the value types would be defined in the namespace.
- _Requirement_ – To require a capability it would have been sufficient to make a requirement the same as a capability and interpret the attributes as assertions. However, in this model only equality could have been asserted. Similar models in other projects like Jini had demonstrated that that idea is flawed; in the real world it is necessary to allow more complex assertions consisting of comparisons, negations, and sub-expressions. Since the OSGi already had a very suitable filter language in the core, based on LDAP filters, the choice for these filters to represent a requirement on a capability was a logical small step.
- _Directives_ – Though the Requirements & Capability model is very powerful it missed the features to completely match the richness of the earlier OSGi specifications. For this reason, a namespace can define directives that control the finer details of the OSGi specifications.

After a few years of gestation this repository model of generic Requirements and Capabilities (R&C) was adopted by the core framework in release 4.3 wiring model and became fully generic in release 5. This made custom R&C namespaces on par with the core model, they could all be resolved by the framework. In release 5 a resolver and repository API was added to use the powerful generic OSGi resolver also outside the framework. A primary purpose was to allow assemblers to assemble applications.

Expressing all dependencies in a formal language like the OSGi R&C model is a necessity to automate many of the error prone task in developing software.

### Tooling

The previous sections defined a comprehensive model to handle dependencies but it had one disadvantage, it required tooling to analyze the byte codes in the class files and to resolve the requirements and capabilities. Since builds are often horribly complicated beasts the enterprise software world generally dislikes touching the build system. And to a certain extent they are right. Though a build tool like maven made it easier to share (sub) build tools with its plugin model, creating a plugin is significantly more work than with good old make.

However, time has moved on. In software, we first started using hex, then assemblers, then compilers, and now often generators. The complexity of our software grows, and the number of parts explodes, our brains are fairly constant in how much we can handle. In 1980 a program of a 10.000 lines was considered large, today a phone can contain up to 20-40 million of lines of code. Since most applications are built out of smaller parts it seems logical that we develop tools that manage those dependencies for us when they become so numerous that they become a blur to us.

The resistance in our world against tools is kind of ironic. All day we work to provide user friendly tools that simplify the lives of our customers. We add databases, graphic user interfaces, etc. We would never propose our users to provide their information in an XML file (at least, hopefully so) but when it comes to our work we seem to be happy to accept such an unbelievably simplistic user interface.

## Standards

Why do standards work in theory? Standards are primarily beneficial because they _decouple_ the components based on the specifications. Each component is aware of the middle man (the standard) but can be oblivious of other components that leverage the same standard. Components can therefore be brought together by the _assembler_. This clearly minimizes communications between parties and thereby reduces errors. Instead of having everybody talk to everybody (which is exponential) the amount of communications is reduced to everybody talking to the standards body (which is linear).

The reason we need these different terms, provider and consumer, because even though they rely on the same specification there roles are quite different. If the specification changes, the provider must always be changed to match the new features; a provider has very little to no backward compatibility with respect to a specification. For example, every release the OSGi Alliance has for the OSGi Framework requires Equinox and [Felix][3] to adapt their code bases to provide the new features. In contrast, a consumer usually gets extensive backward compatibility; specification bodies tend to go out of their way to keep new releases of software backward compatible for the API consumers. For example, a bundle written for OSGi Release 1 likely still works after 16 years and 8 releases later since most of the APIs have been evolved in a backward compatible way for consumers. The [Semantic Versioning](https://www.osgi.org/wp-content/uploads/SemanticVersioning.pdf) principles outline the use of versioning, that is, how to manage an evolving code base.

However, there are a number of other _theoretical_ advantages of well designed specifications:

- Testability – A standard API must be decoupled from implementation details. This makes them easier to test since the APIs should be uncoupled. This will keep the required mocking of test objects low.
- Robustness – Since there are more implementations, the changes are that the API is more heavily used and thereby tested.
- Quality – Competition, enabled by multiple implementations, should help to increase the quality.
- Documented – The specification provides documentation for the implementations. Documentation is often a weak part of many implementations.
- Eyes – A specification will get many eyes, this increases the quality of the API.
- Stability – Specifications tend to evolve at a slower rate than implementations. This makes the development process more stable.

Not all these advantages are always met since not all specification processes are created equal. In the Java world we mainly have the [Java Community Process (JCP)][5]. In theory this should be Java's greatest asset but in practice the process provides too much leeway to the vendors (euphemistically called specification leads) to follow their own interests. The process deliberately does not specify the deliverables, creating a hodge-podge of specifications of varying quality. Though vendors are important in this process because only they can provide the resources to develop good specification; users of the specifications can rarely afford this kind of involvement.

Clearly, standards have the promise of many benefits but bad standards can be very costly. When selecting a specification, pay close attention to the following aspects:

- A specification document documenting the non-syntactic aspects of the API
- A set of Java classes and interfaces that can be used by developers. These API classes should be delivered in binary readable form (generally a JAR) so that the compiler can be used to verify the syntactic constructs of the API. To prevent pollution from implementation details, these JARs should **not** contain the reference implementation, which is common in the JCP.
- Javadoc to help with the usage of the API and provide information about non-syntactic aspects.
- A reference implementation to prove that the specification is implementable
- A thorough test suite that treats the API as a black box and can be used to verify the specified behavior
- A community so that developers can ask questions

## Open Source

The holy grail of software has always been reusability: building systems out of reusable components. From a certain perspective this grail has been achieved today, there is an amazing amount of gratis software freely available. Maven Central is growing at about 5% a month and was already at more than 521.000 JARs at January 2014. In this repository you can find perfect gems as well as a boatload of crap.

Open source has the following advantages:

- Gratis – In general open source code is freely available. At least there is no fee to obtain it. This makes it easy to bypass management or procurement.
- Handling – Since the software can be freely downloaded it is possible to check it out without requiring permission. In general this significantly simplifies evaluation.
- Eyes – Popular open source projects have multiple people looking at the code. This increases the confidence one can have about the quality.
- Longevity – Open source software is likely to stay, or at least linger, around forever. One of the reason Airbus is using open source, and provides software as open source, is because they have requirements lasting 80 years. Open software is one of the few areas that can provide such an availability guarantee.
- Community – If there is a community around an open source project than it is easier to find knowledgeable people; this makes it easier to find answer to problems on StackOverflow or other places. Any issues will also quickly become clear due to discussions on the Internet about this. If things go badly, it is also less painful to be in company.
- Debugging - The source code is often directly available in the IDE when a library is used. So it is possible to debug into the open source code to understand what is going on.
- Fix problems yourself - If the community does not fix a bug, fork the project, fix the bug and build a private release.
- Avoid maintenance by giving back - When doing private fixes they have to be merged into any new release. By giving them back to the community the next release will include the fix.

That said, open source software is not without cost and disadvantages:

- Indeterminate Quality – Though there are many open source projects that provide solid quality control, there are many more that have no controls. It is up to all users of the open source projects to decide what the quality is, and if this is sufficient.
- Governance – Using open source software can be a black art if it comes to licensing issues. Some software is very liberal, other software has stringent requirements that can affect the visibility of your own code (GPL) that relies on this software. Patents in the software can also affect your bottom line. Understanding the implications is hard. Several companies like [Sonatype][12] and [Blackduck][13] have sprung up to help you with the implications of open source. However, the cost for these companies changes the gratis picture of open source.
- Responsibility – Popular open source projects often have numerous committers and really popular projects have dedicated companies providing patches to existing projects for special needs. However, this can be very expensive. For dying projects it is sometimes necessary to clone a repository and take over the maintenance. This is obviously an unwanted situation since it combines the worst of both worlds by giving you the responsibility of a foreign code base.

[1]: http://www.eclipse.org/equinox/
[2]: http://www.osgi.org/Specifications/HomePage
[3]: http://felix.apache.org/
[4]: http://maven.apache.org/
[5]: https://www.jcp.org/en/home/index
[6]: http://en.wikipedia.org/wiki/Kolmogorov_complexity
[7]: http://en.wikipedia.org/wiki/Occam's_razor
[8]: http://quoteinvestigator.com/2011/05/13/einstein-simple/
[9]: http://www.ioccc.org/
[10]: http://en.wikipedia.org/wiki/The_Magical_Number_Seven,_Plus_or_Minus_Two
[12]: http://www.sonatype.com/
[13]: http://www.blackducksoftware.com/
[14]: http://en.wiktionary.org/wiki/dependee
[15]: http://www.cs.umd.edu/class/spring2003/cmsc838p/Design/criteria.pdf
[16]: http://aqute.biz/Code/Bnd
[18]: http://en.wikipedia.org/wiki/James_Gosling
[19]: http://en.wikipedia.org/wiki/Maurice_Wilkes

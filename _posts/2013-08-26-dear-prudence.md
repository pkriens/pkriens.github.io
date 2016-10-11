---
title: "Dear Prudence: Cant we achieve the modularity through normal jars?"
layout: post
description: The more (open) source code I see the more I realize that so many developers do not understand the implications of class loaders and ...
comments: true
---

# Dear Prudence

> Dear Prudence,

> I've some doubts related to osgi I am new to OSGI framework. I was going 
through the sites and read about OSGI framework. Frankly speaking I did not 
understand anything. Following are my doubts.
  
> * OSGi is supposed to provide modularity. Cant we achieve the modularity through normal jars?
* What does it mean that OSGi has a dynamic component model?
* Bundles can be installed,started,stopped,updated,etc. Why do we want to install the bundles? 
  Why cant we access directly like what we access other normal jars?

> I am totally confused. Can somebody answer me ? If it is possible to give some examples also?

> Confused

Dear Confused,

Your question first puzzled me a bit since there is so much documentation on the 
Internet today and there are plenty of books that take you from minute detail to 
broad overview. Not to talk about the hundreds of 'hello world' tutorial blogs. 
Then it dawned on me that many of these tutorials seem to start with explaining 
why the author felt compelled to make this tutorial because OSGi was so much easier 
and more powerful than those other 99 blogs that were read before OSGi was 
understood ... Maybe there is something in OSGi that makes it really hard to 
understand before you know it.

I guess everybody has a bubble of knowledge that makes it hard to learn/understand 
anything outside that bubble. I know first hand, last year I really learned 
Javascript and found myself balking at seemingly bizarre and complex patterns 
until they became obvious. Your question seems to indicate that your knowledge 
bubble does not intersect with the bubbles of people advocating OSGi. So lets design 
a module system based on normal JARs.

I guess we should start with defining what a module is and why we need it. A 
software module is characterized by having a public API that provides access 
to a private implementation. By separating the API from the implementation we 
can simplify the usage of our module since an API is conceptually smaller than 
the API + implementation and therefore easier to understand. However, the greatest 
benefit of modules comes when we have to release a new revision. Since we know that 
no other module can depend on private implementation code we are free to change 
the private code at will. Modules restrict changes from rippling through the system, 
the same way as firewalls restrict fires.

Lets make a framework that can use a JAR as a module. Best practice in our industry 
is to make code private by default, that is no other module can access the inside.
This is the standard Java default, without the public keyword fields, methods, and 
classes revert to being only locally accessible.

However, if nobody outside the JAR can see anything of the inside then this code 
can never be called. Like Java, we could look for a class with a public static 
`main(String args[])` method in this module to start the module. Since we do not 
want to search all classes in a module to find this main class (which also 
means we could end up finding multiple) we need a way to designate the JAR's 
main class. Such a mechanism is already defined by Java in the JAR specification: 
the `Main-Class header` in the JAR's manifest (a text file with information about 
the JAR). So we could call such a designated main method in each module to start 
the module, it can then run its private code. However, the main method does not 
allow us to stop the module. So let's create a new header for this purpose and 
call it Module-Activator. The class named in the Module-Activator header must 
then implement the `ModuleActivator` interface. This interface has a start and 
stop method, allowing the framework to start and stop each module.

If the private code executes it will likely need other classes that are not in 
the JAR. Our framework could search the other modules for this referred class 
if we knew which part of a module was private and which part was public. Since 
Java already has a namespace/accessibility/encapsulation hierarchy, we should 
try stay close to these concepts. This Java hierarchy is field/method, class, 
package and the package is therefore the best candidate to designate private or 
public. Since there is currently no Java keyword defined to make a package 
private or public we could use annotations on a package. However, annotations 
mean that we need to parse the JAR before we can run it, this is in general a really 
bad idea for performance and other reasons. Since we already defined a header for 
the activation, why not define another header: Module-Export? This header would 
enumerate the packages in the JAR that provide the public API.

This minimalistic module system (only two headers) is very attractive but there 
is a catch that becomes apparent when you build larger systems.

What happens when you have multiple modules in your framework that both provide 
a given class but their revision differs? The standard Java approach is to do a 
linear search of the modules and the first module that declares a class wins. O
bviously you should never design a system that has multiple revisions of the same 
class. However, larger systems tend to run into this problem because dependencies 
are transitive. JARs depend on other JARs, that depend on further JARs, ad nauseum. 
If, for example, many of these JARs depend on Log4j it is easy to see that not all 
these JARs will use the same version of Log4j. For a simple library as Log4j that 
is generally backward compatible you want to have the latest revision but for other 
libraries there is no guarantee that revisions are backward compatible.

Basically ignoring this erroneous situation like Java (and Maven) does is not very 
Java-ish. We can't have a system that fails in mysterious ways long after it was 
started; in Java we generally like to see our errors as early as possible.  For 
example, the Java compiler is really good in telling you about name clashes, why 
should we settle for less on the class path?

Since we already export the packages that are shared with the Module-Export manifest 
header, why not also specify the imported packages in the manifest with a Module-Import 
header? If the import and export headers also define a version for the package then 
the framework can check a-priori if the modules are compatible with each other before 
any module is started, giving us an early error when things are not compatible. You 
could do even better. We could also make sure that each module can only see its 
required version of a package, allowing multiple revisions of the same module in 
one system (this is generally considered the holy grail against JAR hell).

So dear Confused, we've just designed a simple module system based on plain JARs 
and three manifest headers to describe the module. Fortunately we do not have to 
struggle to mature this simple design for lots and lots of very subtle and complex 
use cases because such a module system already exists: its actually called OSGi.

Let me answer your dynamics questions next week,

Peter Kriens

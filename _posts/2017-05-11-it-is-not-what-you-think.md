# Modules Without a Cause


## TL;DR

Module to module dependencies cause long transitive implementation dependencies that make it hard to develop reusable components. The long chains create conflicts, unnecessary paralysing constraints, and a class path with lots of code that is never executed but can cause problems. Using a dependency model that depends on _roles_ makes it possible to assemble applications from reusable components that are used in many different scenarios. In OSGi, the role is defined by one or more _packages_. This is similar as what an interface does for a class.

## Frustration

My biggest frustration of the past 18 years is how the the core concept of OSGi remains utterly misunderstood by the larger industry. With clockwise regularity bloggers declare OSGi too complex or stupid because they do fail to immediately recognise its dependency model. Since these bloggers are so smart (hey, they work for Google!) there can only be one reason why they do not recognise it, it must be stupid! Therefore, a last, likely futile, attempt to describe OSGi dependencies for those that are not dummies.

## ‘Simple’ Dependencies

The standard dependency model used in most of the world is module-to-module dependencies. Each model has a name (and in decent systems a version) that is used to express a chain of dependencies. If module A depends on module B, and module B on module C and D then the _transitive_ dependency chain is A -> B, C, D.

If you take an object oriented program then one instance of this dependency model is the transitive dependencies of a _class_. After all, a class _is a_ module. In object oriented software we took some time in the eighties and early nineties to learn that transitive dependencies, well, eh, suck. Natural gasses would be duly impressed if they could notice how quickly a software systems increases entropy. Any, likely not so proud, owner of a monolith can testify of the amazing speed of software diffusion. From greenfield to a [big ball of mud][1] in only a few years. 

The _fan out_ of dependencies in software is so large because we, unnecessarily, depend our components on the transitive _implementation_ dependencies. When I use a module A I do not care at all about how it is implemented since it performs only  a certain _role_ for me. However, if I use module A I am forced to include all its dependencies. How it logs, what database it uses, etc. And this is recursive, for each of those dependencies I need to again include all their dependencies, ad nauseam. Anybody that wanted to excavate a part of a monolith knows that sucking feeling when you have to include module after module because everything seems entangled. Software tends to get much worse in stickiness than chewing gum in your hair!

Today the size problem is diminished because memory is cheap. However, these long transitive dependency chains tend to have a lot of collateral damage in the code that is dragged in but never used. Developers rarely have an idea what all the JARs on their class path are doing and where they came from. In my experience, too many developers keep trying until it (seems to) work.

We generally have no good way what part of what JARs are actually going to be executed. Many popular open source components can interact with frameworks and therefore depend on those framework's API. For example, a lot of components depended on the Ant API so they could function as an Ant plugin. 

Analysing today's class paths of popular systems or WARs is a terrifying way to spent time. Huge chunks of code would blow up if they ever were reached by the processor. It never ceases to amaze me that we accept a rather mediocre language like java because it has a very strong type system but when finally the rubber of our applications hit the road, we seem to no longer care about any of that safety. Hey it runs!

## Java Interfaces?

Fortunately, with Java in 1996 we got an amazing tool to better handle transitive dependencies: _interfaces_. Interfaces allowed us to decouple the _role_ of an object from the _implementation_ of that role. Since we no longer depend on an actual implementation we no longer depend on its transitive dependency chain. The buck does indeed stop at an interface. Interfaces allow us to specify a dependency on a _role_ instead of an _actor_. You know, this trick is actually very popular in the real world. When I order a plumber I totally objectify the guy (gender intended) and could not care less about his identity. I just want him to be a _plumber_ and fix my overflowing toilet. If he would require a huge truck that could ruin my lawn I'd look for another plumber with less severe requirements. 

Interfaces are a great example of how our industry actually learned from past mistakes. I can't recall when it was the last time I saw Java software that did not leverage interfaces in some way.

That makes it all the more puzzling that when we get to other modules than classes we totally ignore those lessons. This is the part where people usually start to glaze and yell: "What have interfaces got to do with modules? They are completely different things! This guy is insane!" For those who can shut down their noisy intuition for a moment I'll try to make it clear why interfaces teach us a lesson about modularity in general.

In Maven we can print out our transitive dependencies and we see a list that closely resembles the transitive chains of a pre-interface object oriented programs. Module to Module _dependencies_ are identical to Object to Object _dependencies_! You get the same tangled mess because a Class _is a_ module. In Java we tend to think of something like a JAR as the module but this confuses the _type_ with an _instance_. A module is a named entity with a private part, a public part,  and a set of dependencies. A method, a class, a package, a bundle, a WAR, a Docker container, they all fit this definition of a module. This is exactly the reason why we called the OSGi module holding the code a _bundle_ instead of a module. Yes, a bundle is a module but there are many types of modules. You can argue if the name 'bundle' is not a bit corny but using the word module for a bundle is extremely vague. 

So from now on in this article the JPMS module, JBoss module, or OSGi bundle are referred to as _bundles_. Where a bundle is defined as a _module_ that consists of a set of Java _packages_.

The million dollar question is now how to express dependencies from one to another bundle? The simple, but wrong, level would be to use the name of the bundle, i.e. Require-Bundle in OSGi parlance. I hope you picked enough of the previous text to agree now that that would be a hopeless idea. But what is the _interface_ of a bundle? 

We could have used the Java interface name as the dependency. This is a common technique in Dependency Injection (DI), a class tells that a field needs a Foo and the container arranges that a proper Foo instance gets injected. This could work but is not a very natural model. In practice, an API is rarely specified with only a single interface. In every API I created there are interfaces to be implemented by the consumer of the API (e.g. a Listener), interfaces to be implemented by the provider of the API (i.e. an Admin), and there are helper objects (i.e. an Event). Though you could stretch it by putting all these classes/interfaces in a single class a more natural layout for all these types is the Java package, in itself a proper module. Using the package as the dependency anchor was a jump in the dark many years ago. However, 18 years of experience have shown that it was a brilliant move. 

## Resolvers

However, this raised a very serious roadblock. A huge advantage of a legacy module system is that determining the transitive dependency chain is trivial. Once you break the 1:1 link between bundles there is no longer a single solution, multiple bundles may export the same package. Though this is exactly what you need for a reusable model because there will be many different runtimes if your component is popular. However, now you need a _resolver_ that selects a set of matching bundles. Clearly this is an additional step that does not make life easier. However, since our primary goal in OSGi is to provide a reusable component system using identity dependencies is just unworkable. So we took the plunge and made the resolver an integral part of OSGi.

Since we had to support Require-Bundle and Import-Package dependencies we quickly realised that the resolver could handle _any_ type of dependency as well as any type of 'module'. Just think about it, when you assemble a runtime for a complex application, the bundles are not your only concern. There are lots of requirements that do not snugly fit in Require-Bundle. What JVM version is required? Are specific web resources like Angular needed? How do you make sure certificates are in the runtime? Taking a step back, the dependency problem is just a lot bigger than Java code alone.

In 2006 we proposed a completely generic dependency model that I regard as the most valuable kept secret of our industry. We modelled a bundle as a _Resource_. A Resource was defined as having _Capabilities_ and _Requirements_. A Capability has a _Namespace_, which is similar to a type; it defines the meaning of a set of properties. The Requirements also belongs to a Namespace and has a _filter_ expression. Over time, we translated every OSGi concept into Namespaces. It turned out that the filter expression language (derived from LDAP) made it possible to express very complex requirements that would have been impossible to automate in any other reasonable way. So today we can handle all the legacy OSGi dependency types like Require-Bundle, Fragment-Host, and Import-Package with an amazingly simple completely symmetric model that is open for any kind of dependency relation.

## Conclusion

Sigh. Today is 11th of May 2017. After having worked in the area of modularity for almost 2 decades I see a very mature reusable component stack in OSGi that truly works under the condition that you do not try to fight it. I also see a Java population that is basically stuck in thinking that modularity is just a transitive list of modules, let's get it over with. I realise that simple solutions are good, except when they are also wrong. I invariably can explain and convince people in person that OSGi is as simple as it gets but that solid Software engineering is just not simple as the myriad of monoliths in our industry testify on a daily basis.

Peter Kriens

[1]: http://www.laputan.org/mud/




















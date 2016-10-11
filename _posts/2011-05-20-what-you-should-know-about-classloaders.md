---
layout: post
title: What You Should Know about Class Loaders
description: The more (open) source code I see the more I realize that so many developers do not understand the implications of class loaders and ...
comments: true
---

# What You Should Know about Class Loaders 

The more (open) source code I see the more I realize that so many developers do 
not understand the implications of class loaders and just try different things 
until it seems to work. Not that the Class Loader API is that hard but the 
implications of Class loaders are often not understood. In a modular environment, 
class loader code wreaks havoc.

Unfortunately, Class Loaders have become popular as the Java extension mechanism. 
Developers love the idea that you can take a String and turn it into a Class, 
there are so many hacks you can do with this! However, what is often not realized 
that in a modular world this just cannot work. The implicit assumption is that 
each Class object can be identified with a unique name. It should not take much 
more than 2 seconds to realize that in a modular world we also require the name 
of the module because the Class name is no longer unique.  That is, class unique.X 
can actually occur in multiple modules. So given the string "unique.X" there is no way 
to identify from which module to load this class. In a modular world there are multiple 
class name spaces!

## Multiple Class Spaces

What is the advantage of having multiple class name spaces? Well, it solves a huge 
problem in larger applications that are built from many parts that come from different 
sources. Think open source. Take an example of logging. Logging is so popular that 
everybody does it, unfortunately with different libraries. In practice, it becomes 
hard to ensure that all your dependencies use the same logging library. In a modular 
world you can connect each library to its correct logging module. In a non modular 
world, the first one wins because libraries are placed on a linear search path; you 
often have no clue who won until you get an error. Obviously this problem is not 
limited to logging. It is actually kind of flabbergasting that a weak mechanism 
like the class path is acceptable for professional applications.

So why are developers using strings so often to get a class? Well, the core reason 
is that Java does not have an extension mechanism. No, the Service Loader is not 
an extension mechanism, it is encoding of a bad convention leaking its 
implementation out of all its methods. Extensions through class loading are 
highly popular, very often in Factory patterns. Sadly, extensions are exactly 
the place where you want to cross module boundaries. What is the use of an extension 
that happens to be in your own module? So these strings often contain the name of 
an implementation class that implements a collaboration interface. The three most 
important rules of modularity are: Hide, Hide, and Hide. Do you really want to 
expose the implementation class from a module? Isn't that the antithesis of modularity?

In spite of these problems, the pattern to use class loaders for extension mechanisms 
has become highly popular. Today we even have generations that actually do not realize 
how bad it is to use global variables (class names) to access context through static 
variables. My programming teacher in 1979 would have set me back a class when I would 
have proposed such a solution. However, as you know, you go to war with the army you 
have, not the army you might want or wish to have at a later time. So the class loading 
hack has become highly popular in lieu of an alternative. So popular that it is used 
in places where it is not even needed. Worse, it will bite you whenever you move 
your code base to a modular world.

## Guidelines 

So here are number of rules/hints you can use to prepare your software for a modular 
world (and simplify your life at the same time).

* _Do not use class loaders_ - If you feel the urge to use a class loader think again. 
  And again. Class loaders are highly complex beasts and your view of the world might 
  not match the world your code is actually used in.
* _Do not use class loaders yet_ - Only for the experts.
* _Extensions_ - If you have to connect to other modules use a Inter Module 
  Communication (IMC) mechanism. A good IMC provides access to instances and not 
  classes. If you do not have one, just make one yourself it is that not much code. 
  Even better, use the OSGi service registry. Best is a real OSGi framework 
  but if you're not yet ready for that step use something like PojoSR from Karl Pauls.
* _Class.forName is Evil_ - `Class.forName` will pin classes in memory forever 
  (almost, but long enough to cause problems). If you're forced to do dynamic 
  class loading use ClassLoader.loadClass instead. All variations of the 
  `Class.forName suffer from the same problem. See [BJ Hargrave's blog][1] about this.
* _Understand the Context_ - I've just debugged GWT code that was unnecessarily 
  mucking around with class loaders when it needs to deserialize the request. The 
  first token was a GWT class but the remainder of the request was the interface 
  and parameters related to the delegate (the object implementing the RPC method.) 
  However, for some reason they used the Thread Context Class Loader (you're 
  in deep s**t if that one becomes necessary), and `Class.forName`. Completely 
  unnecessary because they had access to the delegate object and thus its class 
  loader. The class loader of this object must have access the RPC interface as 
  well as all its parameters. There is a similar situation for Hibernate. 
  You can name the classes in an XML file or you can give Hibernate the class 
  objects for the entity classes. If you give it the class objects Hibernate 
  works fine in a modular world. Give it XML and it chokes because in a modular 
  world there is no 1:1 relation ship to class name and `Class` object. Reasoning 
  about the context in which a class is loaded can prevent problems.
* _Centralize_ - If you really need class loaders centralize and isolate your 
  code in a different package. Make sure your class loading strategies are not 
  visible in your application code. Module systems will provide an API that 
  allows you to correctly load classes from the appropriate module. So when 
  you move to a module system you only have to port one piece of code and not 
  change your whole code base.
* _Never assume that a class name identifies one class_ - The relation between 
  class name and Class object is 1:n, not 1:1. You might desperately want it to 
  be true but in a modular world this does not make it true.
* _DynamicImport-Package and buddy class loading are not an alternative_ - If you 
  browse the web you find lots of well meaning people pointing to  these "solutions". 
  Unfortunately, these "solutions" move you right back all the problems of the class path.

## Conclusion

The trick to modularity is to make modules that assume as little as possible of the 
outside world and communicate through well defined interfaces. If you do not know 
something, you cannot be wrong about it. The pesky factories in Java that use dynamic 
class loading to get an implementation class just do not fit well in this world. If 
you're not ready for OSGi yet but want to prepare your code for the future then 
following the previous rules will make your code more portable and easier to maintain.

_This article was first published on the [OSGi Website in 2011][2]._

[BJ Hargrave's blog]: http://blog.bjhargrave.com/2007/09/classforname-caches-defined-class-in.html
[2]: http://blog.osgi.org/2011/05/what-you-should-know-about-class.html
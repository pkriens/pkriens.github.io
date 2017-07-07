---
layout: post
title: JPMS: The Module Path
description: The JPMS Module path is the replacement for the venerable -classpath and solve all its problems. 
comments: true
---

* JPMS Modulepath

I originally focused on the internal parts of JPMS and not so much its interaction with the outside world. This left the module path out of focus and I, admittedly, had the wrong impression. After my last article it became clear that this rather important part of the specification was neither in the JLS draft nor in the JPMS design document but in the [Javadoc of the `java.lang.module` package][1]. That was not the only mistake I made, I also started with the compiler view. Since then I realised that the compiler view has an oddity. During compilation, the module compilation unit can access annotation types from other modules. However, at that time you do not know yet what other modules are observable. Just like the complete separate grammar for a Java source file and the module definition it is an another indication that class files are not really suitable. It therefore seems simpler to focus on the runtime first.

The following class diagram provides an overview of the JPMS design as I understand it. 

![image](https://user-images.githubusercontent.com/200494/27959164-ac65e892-6326-11e7-8a87-4fcd90643633.png)

The Module and ModuleLayer class are the runtime artefacts. The Configuration is a resolution of a set of root module names using two Module Finders and  parent configurations. The configuration is then used to create a Module Layer with modules. 

A Configuration takes a number of roots, a parent configuration, and two module finders. It locates the modules by name, from (in order):

	for each _before_ Module Finder
	  for each Directory in Module Finder
	    names map = empty
	    for each file in Directory
	      create module descriptor
	      if the name is in the map, fail
	        else add name, descriptor to the map
		
	    if the map contains the searched module, 
	      return the Module Descriptor

	for each parent in order
	  search the parent for the requested module recursively
	  if found, return the found Module Descriptor

	for each _after_ Module Finder
	  for each Directory in Module Finder
	    names map = empty
	    for each file in Directory
	      create module descriptor
	      if the name is in the map, fail
	        else add name, descriptor to the map
		
	    if the map contains the searched module, 
	      return the Module Descriptor

This clearly resembles the infamous but well known `-classpath` and other _chain of responsibility_ patterns. They are so easy to use! The developer can tweak the resolution by adding directories ahead of the chain and in that way overriding modules later in the chain. 

However, there are quite a number constraints on the Configuration: 

Ensure that the correct module is, at least, first in the search path
No name clashes between modules
No module can read itself indirectly
All modules read their required modules
All imports for a module are available in the module or exported to it by one of its read modules
No overlapping packages between the modules 

That is quite a number of constraint to leave up to such a fragile search strategy. In practice, it is really hard to see that anything but a simple ‘Hello World’ program requires strict curation of the module path. It also seems extremely unlikely that you can share directories on your module path, after all, what you then have is DLL Hell. An update of one application can destroy another application. The inevtiable consequence is that each application will require its own container with a set of strictly curated members. (e.g. a directory with a set of JARs.) 

Realise that the core problem is the lack of versions in the module. A module name, unless it embodies a version or GUID, is not a unique identifier for a module. This makes it impossible to 'find' a module in a repository, there is just not enough information in the query to the Module Finder.

I therefore see no way around tooling that for a given application provides a directory (or some container) with the JARs that are part of that application? Clearly, this is not optimal because it will create a huge redundancy of directories with many will have the same JARs. Yes, you can be clever with file links and surely people will get this to work. But one wonders if there is not a much simpler solution.

> Peter Kriens

[1]: http://download.java.net/java/jdk9/docs/api/java/lang/module/package-summary.html

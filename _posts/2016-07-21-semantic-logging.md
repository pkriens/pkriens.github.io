---
title: Semantic Logging
layout: post
description: Semantic logging is promoted by Microsoft to add structure to logs. Let's see how we can add semantic logging to Java. 
comments: true
---

# Semantic Logging

Recently a customer asked me about _semantic logging_. This is a concept
promoted by Microsoft. It is a concept promoted by Microsoft to put more
structure in logging. Generally, people log by creating an unstructured
message. In semantic logging, the messages have a clear structure so
that later they can be processed by tools. Clearly an attractive goal
looking at the overload of logging that most applications exhibit. (I do believe
that there is such a thing as over-logging.)

Processing by tools requires an accuracy for which we mere mortals have very 
little talent. I am always full of awe for Javascript and Python developers 
that can survive without completion, refactoring, or in general something
more intelligent than me watching my fingers. However, logging in Java
consists of writing strings ... 

Coincidentally, a few years ago I added a feature to bnd that could provide
very  useful. It defined the log messages in an interface. A proxy that 
implemented that interface was then used to construct the log message.

For example:

	interface DeviceCatalog extends Catalog {
		TRACE measurement(String sensor, int temperature);
		INFO comparing(String sensor, int temperature, int maxTemperature);
		WARN tempTooHigh(String sensor, int temperature);
		ERROR fire(String sensor, String location);
	}
	
Observant readers will probably say: "What the hack?" before they realize that
using the return type is a very elegant way of marking the message level. Yes, 
it is a bit of a hack but its readability is hard to deny.

So how could we use this?

	final static DeviceCatalog catalog = CatalogLogger.catalog(DeviceCatalog.class);
 
 	...
		catalog.measurement("room", 25);
		catalog.comparing("room", 25, 23);
		catalog.tempTooHigh("room", 25);
		catalog.measurement("room", 54);
		catalog.comparing("room", 54, 23);
		catalog.fire("room", "Floor 4,\toffice 45\n");
 	

The `CatalogLogger` class creates a proxy and uses SLF4J for logging. In Java 7 and
later you can access the name of the parameters which allows us to log the information
automatically:

	[main] INFO DeviceCatalog1 - comparing sensor=room temperature=25 maxTemperature=23
	[main] WARN DeviceCatalog - tempTooHigh sensor=room temperature=25
	[main] INFO DeviceCatalog - comparing sensor=room temperature=54 maxTemperature=23
	[main] ERROR DeviceCatalog - fire sensor=room location="Floor 4,\toffice 45\n"


## Links

You can find the software on [https://github.com/aQute-os/biz.aQute/biz.aQute.semantic-logging](https://github.com/aQute-os/biz.aQute/tree/master/biz.aQute.semantic-logging)


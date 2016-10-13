---
title: Select Service Implementation from Command Line Arguments
description: How do you create an OSGi application where the user can specify via the command line what service to pick. 
layout: post
---

# Implementation Selection Through Command Line

A recent mailing list post asked a question about how to select a service based
on a command line argument:

> I have an Interface (API) and several different implementations which I want 
  the user to be able to select by using command line parameters or other methods 
  of configuration.

> Is it possible to force OSGi to inject one or another implementation depending 
  on a user setting?
  
Yes. The principle in OSGi is to make dependencies explicit through the use of
services. So we need to create a service that reflects the command line properties
and then for each implementation we provide the requested service but make the
implementation depend on the value of a service property.

This example is implemented in a Git repo using Maven: [https://github.com/aQute-os/biz.aQute.implementation-selection](https://github.com/aQute-os/biz.aQute.implementation-selection).

## Problem Definition

* `UserInterface` – Interface or API for the UI
* `SwingUserInterface` – Implementation that renders a Swing based UI
* `ConsoleUserInterface` – Implementation that renders a plain text console based UI
* `HTMLUserInterface` – Implementation designed to work from a browser

> So what I'm trying to achieve is that if the user starts the app using the parameter 
`-mode:console` and that OSGi should inject the ConsoleUserInterface. Otherwise 
it should stick to `SwingUserInterface` if no mode parameter is specified.

## Solution

### Interface

For demo purposes, lets define our interface as follows:

	public interface UserInterface {
		void print(String s);
	}


### Command Line Access

The first roadblock is access to the command line. This depends on the launcher.
The most popular [launcher is bnd][1]. This launcher registers a service that has the
the `launcher.arguments` service property, which is the list of command line values as passed
to the `main(String[])` method.

### Depending on an Argument

If we make a simplification that the string  `-mode:console` is unique in the
argument list than we can use the launching service directly since we can make a service
depend on a service property value. In this case the key is `launcher.arguments` and
each implementation component can match it by depending on an Object service
with the `target` filter set to the desired mode. For example, for the console
the filter can look like:

	(launcher.arguments=-mode:console)

## Console Implementation

This gives us the following implementation:

	@Component
	public class ConsoleUserInterface implements UserInterface {
	
		@Reference(target="(launcher.arguments=-mode:console)")
		Object launcher;
		
		@Activate
		void activate() {
			System.out.println("Selected console");
		}
		
		@Override
		public void print(String s) {
			System.out.println(s);
		}
	
	}

## Swing Implementation

The Swing interface is slightly more complex since we want it to also be used
as default. This makes the filter a tad more complex. We should run either
when no mode is set or when the mode is set to console. Naively this looks like:

	(|
		(!
			(launcher.arguments=-mode:*)
		)
		(launcher.arguments=-mode:swing)
	)

However, as I quickly found out, this matched another service that did not have
the `launcher.arguments` property but was registered under Object. That is, the
`!` operator made it match ANY service that did not have the `launcher.arguments` 
property. So we need to require that the matched server has at least one value 
for the arguments.

	(|
		(&
			(launcher.arguments=*)
			(!
				(launcher.arguments=-mode:*)
			)
		)
		(launcher.arguments=-mode:swing)
	)

This gives us the following swing implementation:

	@Component(immediate=true)
	public class SwingUserInterface implements UserInterface {
		@Reference(target=
				"(|(&(launcher.arguments=*)(!(launcher.arguments=-mode:*)))(launcher.arguments=-mode:swing))")
		Object launcher;
		private JFrame frame;
		private JTextArea text;
		
		@Activate
		void activate() {
			this.frame = new JFrame("TextDemo");
			frame.setVisible(true);
			this.text = new JTextArea(10,20);
			this.frame.add( this.text );
			this.frame.pack();
		}
	
		@Deactivate
		void deactivate() {
			frame.dispose();
		}
		
		@Override
		public void print(String s) {
			text.append(s+"\n");
		}
	}	

## HTML Implementation

The HTML provider follows the same pattern and is not shown here. You can find
the code that prints to the browser in the [Github repository][1].

## Running the Example

If you build the example from the repository's top directory you create an
executable JAR in the bndrun directory called run. You can execute this jar
directly from the command line:

	biz.aQute.implementation-selection $ mvn clean install
	biz.aQute.implementation-selection $ java -jar bndrun/run.jar -mode:console
	...
	
	   ___ _ __ |  _ \ ___  _   _| |_ ___ 
	  / _ \ '_ \| |_) / _ \| | | | __/ _ \
	 |  __/ | | |  _ < (_) | |_| | |_  __/
	  \___|_| |_|_| \_\___/ \__,_|\__\___|
	              http://enroute.osgi.org/

	G! print bar
	Selected console
	bar
	G! 

	 

## Links

* [https://github.com/aQute-os/biz.aQute.implementation-selection](https://github.com/aQute-os/biz.aQute.implementation-selection)


[1]: https://github.com/aQute-os/biz.aQute.implementation-selection










[1]: http://bnd.bndtools.org/chapters/300-launching.html
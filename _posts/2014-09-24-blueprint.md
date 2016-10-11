---
layout: post
comments: true
title: How should I use Blueprint?
description: "Someone asked me over mail how to use Guice (or any other injector) inside my bundle? The short answer is: don't. The slightly ..."
---

# Blueprint

Someone asked me over mail:

> How should I use Guice (or any other injector) inside my bundle?

The short answer is: *don't*.

The slightly longer answer follows hereafter.

Injectors like Spring and Guice were invented because around 2000 large monolithic 
applications were brought down to their knees because of their internal coupling. 
Even though a lot of code was written as POJOs, the instantiation and configuration 
of those POJOs caused massive coupling, making the app brittle and hard, sometimes 
even impossible, to evolve. Injectors were created to concentrate that coupling (and 
the related initialization ordering) in one place so the rest of the code base had 
significantly reduced coupling. Since coupling and complexity have an exponential 
relation this massively reduced complexity in the application code. A reduction in 
complexity that more than offset the accidental complexity of the injectors (XML!). 

However. In a proper OSGi application, _the problem of a big monolithic app just 
does not exist!_ A bundle that would really need Guice or Spring is almost by 
definition not a proper bundle. The reason is that a proper bundle is cohesive, 
it only contains related parts. Because it is cohesive, most of its coupling is 
inside and a proper bundle only exposes a tiny part of its internals with well 
defined OSGi µservices, either registering them or depending on them.

The consequence of this cohesion is that the complexity landscape changes. In this 
landscape, the accidental cost of an injector no longer weighs up to a reduction 
in overall complexity as it did for monoliths. This means that good old Java with 
the new operator works surprisingly well, inside a cohesive bundle it lost a lot 
of its bad side effects. So plain old Java, as James G. intended it, is actually 
the best for code inside a bundle. With plain old Java, the IDE is your friend 
again! You can navigate and refactor at will since Eclipse is aware of your complete 
type tree inside a bundle, nothing is hidden behind the injector. As long as an 
implementation class is inside your bundle, you can use it since your IDE knows 
all its dependencies. That is, if you want to delete it or rename it, go ahead, 
since all possible dependencies are inside your bundle. Therefore, an injector 
just creates extra boiler plate, unnecessary barriers, and isolates the type 
tree while no longer providing an actual benefit.

So if you feel that you need an injector inside a bundle, you should probably redesign 
that bundle, it is highly likely you cram unrelated parts in it.

Now, so far this was about the bundle internals. The next story is of course the 
external dependencies. A proper bundle consists of a set of (DS) components. 
Each component is configured by DS from Configuration Admin, it has its own life 
cycle based on its configuration and (optionally configured) dependencies. With 
the annotations, the overhead of using this is quite minimal. The following is a 
complete component that registers one service when its two service dependencies are met.

	 @Component
	 public class FooComponent implements Foo {
	  private Bar bar;
	 
	  @Activate
	  void activate( Map map) { ... }
	
	  void foo() {
	   bar.bar();
	  }
	
	
	  @Reference
	  void setLog( LogService log) { }
	
	  @Reference
	  void setBar( BarService bar) { this.bar = bar; }
	
	 }

The magic of these components is, is that suddenly you can make any object an _active_ 
component. Once it is a component, you get configuration data for free (you can even 
instantiate multiple in of them under Configuration Admin control), you get full 
dynamic dependency management, and also service registration is for free. These 
OSGi service components are as fundamental a shift in computing as objects were 
in the nineties. Ok, maybe we could reduce this tiny amount of boilerplate (and 
we are working on some additional simplifications) but surely not by much.

So to summarize. I think the accidental complexity of an injector inside a cohesive 
bundle is not balanced by reduced overall complexity. The DS specification strikes a 
fine balance by using injection for the external (dynamic) dependencies but assuming 
normal off the shelf Java for internal code. So, for a change, try unadulterated Java 
inside your DS components, the new operator is actually quite handy!

Peter Kriens


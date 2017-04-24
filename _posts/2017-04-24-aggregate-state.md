---
title: OSGi Has No Start Ordering
layout: post
description:  A post that introduces an Aggregate State service that efficiently addresses the problem when a service should begin in a dynamic environment.
comments: true
---

# OSGi has no Start Ordering

One of the most perplexing problems for newbies in a larger OSGi system is the issue start ordering. Many, if not all developers start trying to to control the bundle start level when they run in timing dependencies. However, this is never a solution because in a dynamic system any dependency can come and disappear at any time. The fact that you get rid of the startup problem is no guarantee that it is not going to bite you at a very different occaision. And as Murphy knew all too well, likely at the worst possible time. Defining bundle start ordering is a band aid that seems to hide the symbol but it does not address the real problem.

In OSGi there is no ordering. Get over it.

This means that any requirement like (start) ordering must be translated to (service) dependencies. Once something is a service dependency, an (DS) component can defer its activation until the dependency is there. Since this is a proper dependency, an unregistration will automatically deactivate any components that depend on this service. Once something is mapped to a service it leverages the awesome DS runtime to handle the highly complex ordering issues between different components. And since DS is so easy to use with the annotations it does not cost much source code real estate. Really, spend the effort to properly handle your dependencies. Your successor will love you for it.

In general, service dependencies work quite intuitive since DS makes it so easy. Fully service oriented systems tend to automatically initialize in the correct order. The hard part comes when you integrate code that does not use services. In that case it is sometimes necessary create a dummy service. For example, if you really need to start after a specific bundle has been started then you can write a bundle that uses a Bundle Tracker to delay registering a service that represents the availability of that service.

To many a developer this sounds insane, why register a service when you could just as easily handle the delay in the component that depends on that bundle?

Well, it is all a small matter of cohesion. If you pollute your actual worker component with these issues then you tend to make it a lot more complex and harder to maintain. You make it also a lot harder to use it in other contexts. The core idea of OSGi is simple components that can be combined in many ways.

## Target Option

A crucial tool to control service dependencies is the DS Reference's `target` option. This option allows you to select what service should be available before your component starts. For example:

	@Reference( target="(db=master)")
	DB	db;

The target option specifies a filter expression that is asserted on every applicable service. It is based on the [LDAP filter expressions][1] and is an intrinsic part of OSGi. They can assert properties but it is also possible to concatenate complex sub expressions with or, and, and negate.

The target option is very powerful. Especially since it can be overridden (or set) from Configuration Admin. If you set the property `db.target` for the component's PID in Configuration Admin then that field will be used as the target filter. This means that the _deployer_ of the system can select specific services.

The deployer is the person that is responsible for the actual system. Developers should in general provide simple defaults that make a system work out of the box but there are always (edge) cases where a deployer needs tools to make the system work in the situation it finds itself in. In many scenarios the deployer is the developer but it is always a good idea to allow for the case that someone else wants to use your system.

## Specific Listeners

Translating ordering dependencies to service dependencies is normally quite straightforward to do. However, not always. The DS model works extremely well for services but it falls short when you need to depend on a more system wide state. For example, let's say you use the whiteboard pattern. The beauty of the whiteboard pattern is that you do not have to do anything special to participate, it tends to work out of the box. However, in certain cases the deployer wants to ensure that one or more specific whiteboard listeners are registered before the the whiteboard server is started. For example, you have a subsystem that dispatches events to listeners. Though the dispatching code is identical, the overall system requirement is that there should be at least a listener registered that stores the event on disk and one that sends the event to a remote system. What we would like is to express this as a filter. Something like:

	@Reference( target = "(&(listener=DISK)(listener=REMOTE))") // WRONG
	volatile List<Listener> l;

This simple construction is very elegant and wrong. It does not work because there is no single service that has `listener=A` and `listener=B`, it will therefore never match.

## The Aggregate State Service

What we would like is a single service that aggregates the state of many other services. Different services should be able to contribute service properties to the Aggregate State service with little or no effort. For example, the `DISK` listener and the `REMOTE` listener could register a service property `aggregate.state` that identifies a _state_. The state is an identifier that groups related things together. In the previous example we called it `listener` so let's use that as the state id. We can also register a value for the `state` by registering a property with the state as the key. For example:

	Remote Service:
		aggregate.state=listener
		listener=REMOTE
	Disk Service:
		aggregate.state=listener
		listener=DISK

The Aggregate State service now actively tracks any service that has the `aggregate.state` service property and uses the learned information to modify its own service properties. So for the previous example, the Aggregate State service would have the following aggregated service properties:

	listener=[DISK,REMOTE]
	#listener=2
	%listener=2

This property can now be asserted with the previous target filter:

	@Reference( target = "(&(listener=DISK)(listener=REMOTE))")
	AggregateState state;

	@Reference
	volatile List<Listener> listeners;

## Cardinality

The Aggregate State service also registers the cardinality that it detected for each state. It will prefix the state id with a hash (`#`) and register the total number of values that it found on other services. The `%` prefix register the total number of _unique_ values. This makes it possible to wait until there are a given number of services available. For example, in a cluster it can be necessary to wait until there are at least n siblings up and running. If these siblings are registered as services then we can assert interesting things with the target filter. For example, we want to be sure there are at least 2 regions and at least 3 siblings registered before we start:

	Sibling A
		aggregate.state=[sibling,region]
		sibling=A
		region=WEST
	Sibling B
		aggregate.state=[sibling,region]
		sibling=B
		region=WEST
	Sibling C
		aggregate.state=[sibling,region]
		sibling=C
		region=WEST

The Aggregate State now looks like:

	sibling=[A,B,C]
	#sibling=3
	%sibling=3
	region=[WEST,WEST,WEST]
	#region=3
	%region=1

This allows us to wait for at least 3 siblings and more than one region:

	@Reference( target="(&(#siblings>=3)(%region>=1))")
	AggregateState state;

Clearly, we need Sibling D before this component will be started:

	Sibling D
		aggregate.state=[sibling,region]
		sibling=D
		region=EAST

## Watchdog

A not always obvious consequence is that you can also wait for negative conditions. Assume that we need to take action when a certain condition does _not_ happen within a specific time. Since the filter can easily be negated we can make a component that does something if the desired state is not reached within a certain time:

	class Watchdog {

		@Reference( target="(!(&(#siblings>=3)(%region>=1)))")
		AggregateState state;

		@Reference Scheduler scheduler;

		CancellablePromise timer;

		@Activate void activate() {
			this.timer = scheduler.after( this::alarm, Duration.ofSeconds(10)  );
		}
		@Deactivate void deactivate() {
			this.timer.cancel();
		}

		void alarm() {
			....
		}
	}


## Conclusion

The Aggregate State service is a solution that has been slumbering in my head for many years. Recently the need became acute and this resulted in an implementation that seemed to work quite well. I am looking for feedback on these ideas. How interesting would it be to standardize this service in OSGi? Should I add this service to OSGi enRoute?

[1]: https://www.ldap.com/ldap-filters
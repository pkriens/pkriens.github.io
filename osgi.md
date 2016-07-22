---
layout: default
---
<div>
	<img src="/img/osgi-logo-512.png" style="
		display:inline-block;
		width:30%;
	"><img src="/img/layering-osgi.png" style="
		display:inline-block;
		width:70%;
	">
</div>

# OSGi

OSGi is a software specification developed by the OSGi Alliance since 1998 for, initially, service gateways. Supported
by numerous fortune 500 companies around the world it has been used in a very large number of systems, from the very 
small embedded to the large cloud based systems. 

A misconception is that OSGi is an application server like Java EE. This is wrong, OSGi is a reusable component model 
for developing applications that range from small to extremely large. OSGi addresses the key problems in this kind of 
development. In today's world with
almost 1.5 million components on Maven Central it is easy, and cheap, to find suitable components. However, the independent
uncontrolled life cycle of these components can make managing these numerous transitive dependencies a problem in itself. 
The complexity of managing the evolution of larger systems can easily outgrow the complexity of the domain itself.

The primary aspect of OSGi to address, not as many expect the modularity layer, but its _service model_. This model makes it
possible to loosely couple modules via the _api's_ they provide and consume instead of their implementation. This is the 
first comprehensive implementation of _programming by contract_. It makes for much more mantainable and supportable
software. An added benefit of the loose coupling, especially for IoT scenarios, are the dynamics that are enabled. Though
this enables the nice to have feature of dynamic updates of bundles, its most important benefit is that the service primitive 
maps extremely well to many common software patterns. It is a similar step in software engineering as object oriented
software was in the late eighties. Micro-services share many of the underlying concepts but the advantages of having 
a software primitive that is extremely well supported by the environment is tremendous. Sadly, service share the
same problem objects had when they were new, the were hard to understand until you understood them.

## OSGi enRoute

If you're new (or even if the technology is familiar) we highly recommend to use the OSGi enRoute site
to educate yourself. For new comers this provides the site with the current best practices. For people that
use or have used the technology looking at OSGi enRoute might provide numerous surprises of how simple
OSGi is today with the proper toolchain and setup. OSGi enRoute then provides a seamless transition to
the numerous frameworks and distributions like Karaf, Liferay, Adone Experience Manager, Paremus, Websphere, and others 
or use the learned knowledge to create a proprietary deployment, which is surprisingly easy to do.

## aQute

The history of the OSGi and aQute have been closely intertwined since the inception of the OSGi Alliance.
Peter Kriens, the founder of aQute, was the Ericsson representative the expert group that developed
the first specifications. In 2001 aQute was asked to take on the editing and production of the 
specifications, now consisting of over 1500 pages. As an evangelist he promoted OSGi on a myriad
of conferences and workshops all over the worlds. In 2013 the OSGi Alliance hired aQute to
execute the OSGi enRoute project, arguably the easiest way to learn OSGi. 

Peter Kriens is one of the five OSGi Fellows.

## Assistance

If you are looking for assistance with OSGi then you can contact [Contact](contact) us to talk. We can provide
a wide palette of [services](services). We want to help you master the technologies your teams are unfamiliar with.



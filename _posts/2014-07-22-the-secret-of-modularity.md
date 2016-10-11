---
layout: post
comments: true
title: The Secret of Modularity
description: Everybody I talk to seems to agree that modularity reduces complexity but the group of people that can actually articulate why modularity works is significantly smaller. How does the magic work?
---

# The Secret of Modularity

Everybody I talk to seems to agree that modularity reduces complexity but the group of people that can actually articulate why modularity works is significantly smaller. How does the magic work?

Modularity works because it reduces the number of connections in your software. This does not sound like a big deal until you realize that for a linear increase in size you get exponentially more connections. Experience shows that increasing the size of a system with 25% creates a doubling in complexity (Robert Glass' Law). So a system that has 10x more functions is 1000x times more complex!

Since we cannot control the required functionality our system must provide we have only one option: We must minimize the impact of the connections in our software. Modularity does not diminish the overall number of connections, they are related to the desired functionality, it does allow us to separate connections into an inside and an outside. Inside connections cannot be observed from the outside, they are hidden. Modularity influences the complexity equation because a module can now only observe a part of the total number of connections in the system. Since complexity is derived from an exponential function, small changes can have very large effects.

This explanation should make it clear that modularity is not just about wrapping a bunch of classes in a JAR. The benefits are only achieved when we actively design the content of that JAR to minimize the outside connections. The maven approach, automatically creating a classpath with all the transitive dependencies, may be an easy way to get started but it does little to reduce the overall complexity and you will therefore pay a price later. Reading David Parnas' seminal paper is so interesting because it so clearly shows that moving functionality from one module to another can have an incredible impact on the overall complexity. The magic is not the packing, the magic is all on how you pack it.

The OSGi model is all based on minimizing the outside connections; the µservice model plays a crucial role in this. And yes, you have to pay an upfront price but this price is dwarfed over time when you make anything but trivial applications.

Peter Kriens









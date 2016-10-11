---
title: Why has OSGi a dynamic model?
layout: post
description: OSGi was derived from Sun's Java Embedded Server, a product that had dynamics at its heart. It consisted of a dynamic µservice model with updatable modules. So why did we adopt this, seemingly complex ...
comments: true
---

# Why has OSGi a dynamic model?

OSGi was derived from Sun's Java Embedded Server, a product that had dynamics at its heart. It consisted of a dynamic µservice model with updatable modules. So why did we adopt this, seemingly complex, model? Well, we could, and at the time were heavily frustrated with Windows 98 that seemed to require a reboot for every third mouse move. So it seemed utterly stupid to build a static system that required a reboot to update a module or a configuration.   

What I had not realized at the time is what a powerful software primitive the µservice model actually was.  Once you accept that a service can come and go you need to make it easy to handle this. So we did with Declarative Services (DS). Once you have a primitive that models dynamic behavior you start to see how dynamic the real world actually is. You also notice that highly complex middleware is build to shield the application developer from the facts of life because they are not deemed clever enough to handle dynamics.

Bill Joy, once told us (at Ericsson Research) a very inspiring story about the development of the Internet that opened my eyes: How you can get much better quality, for a much lower price, by just accepting failure. Initially, he told us, the Internet was developed with routers that were not supposed to lose a package, ever. Despite these expensive and highly complex routers the desired quality of the network was not achieved because there were still too many failure modes. The key insight was to accept that it is ok that routers fail. This brought us TCP, the protocol to provide a reliable connection over an unreliable, much simpler, underlying network.

Once you accept that a µservice is frail, you must handle their frailty in your code. If you have DS, this is none to very little work for a component, DS acts in similar vein as TCP does. Systems build out of such resilient components are (much) simpler and thus more reliable. Read [AntiFragile][1] of Taleb if you want to see how nature uses this model pervasively.

Once you accept µservices as a primitive they can be used in an amazing number of use cases. In its most basic form it can just be a service abstracting a platform function, like for example logging, that is not likely to go away. It can represent the availability of something, e.g. a Bluetooth device in the neighborhood (of which you can have many). It can represent a configured database connection, a servlet, etc. And the cherry on top is of course that you can now remote a service since the middleware can reliably signal failures, voiding several of the arguments in the [Fallacies of Distributed Computing][2].

When it is easy to work with these dynamics, you start to see more and more use cases. After wading through a very popular open source project last week, I noticed myriad places where µservices could have saved tons of code and would have added functionality. Virtually all software I write today consists of sometimes a small and sometimes sizable module but invariably a module that provides a single service and depends on a handful of services. 

So it is cool to update a module on the fly. However, I find it much cooler how the outside world can change while your system adapts. While I am developing days can pass without reboots,  updating components and configurations all the time. Not only is this a wonderful fluid way to develop, it also ensure your software becomes highly resilient.

Therefore, for me the real innovation of OSGi is the µservices model and paradoxically accepting their low quality of service.

Peter Kriens

[1]: http://www.amazon.com/Antifragile-Things-That-Gain-Disorder/dp/1400067820
[2]: http://en.wikipedia.org/wiki/Fallacies_of_Distributed_Computing

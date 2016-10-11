---
layout: post
title: "Software mixed with marketing: micro-services"
description: A few months ago I was on the phone when the speaker on the other side mentioned micro-services. Many moons ago I'd written a blog about OSGi's µservices because people were getting confused ...
comments: true
---

A few months ago I was on the phone when the speaker on the other side mentioned micro-services. Many moons ago I'd written a blog about OSGi's µservices because people were getting confused with the term service. Though this name was unique enough in 1998, the advent of Service Oriented Architectures (SOA) had imprinted people to think about heavy weight, costly, and complex things requiring stacks and other things a developer wants to avoid. That is, everything OSGi is not. I even used the Mu symbol (µ) because it was also the symbol for friction, of which µservices have so little. I therefore kind of naturally assumed the guy was talking about our wonderful in-VM µservice oriented architecture (µsoa). Actually, I smugly told him that I coined the term, trying to impress him. This however turned the discussion from straightforward discussion about technologies into a rather confusing one, that is, until I realized that they had stolen our name again!

Looking at the discussions it seems that micro-services talk like a web-service, they walk like a web-service (that is, they don't walk, they are actually kind of static), and they quack like a web-service.  Ergo?

They could not even call it tiny-service, puny-service, or small-service (getting the alliteration for free). Oh no, they had to jump the 6 magnitudes with micro! The worst thing is that it is a terrible misnomer to call a web-service a micro-service. I get the service part, a service is clear a point to access some functionality according to a contract; all service models share this core idea. However, a REST-service and a WS-* service use the Web/REST prefix to identify the communication stack. Since the OSGi µservices have zero overhead because they are actually local calls it makes sense to call them µservices. However, this new 'micro-service' is still a web-service or a REST-service, inheriting the often sizable communications stack and overhead associated with remote procedure calls. These new incarnation of web-services are only supposed to be conceptually small.

Which is of course is quite silly, since size is not the primary factor for module decomposition (of which service design is an instance). The things that mostly counts in good design is cohesion. Cohesion measures the conceptual closeness of the service's methods in relation to the overall system, a cohesive services has a well defined single responsibility. When I read about the micro-web-services I think they actually just mean cohesive web-services.

So can someone please ask them to call their bright idea cohesive web-services? Then we all know what they are talking about, we keep the vocabulary consistent, and we can keep using the term µservices because in OSGi they actually are!

Peter Kriens




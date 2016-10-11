---
layout: post
title: The Perfect OSGi Persistence Model?
description: After having such good experiences with Mongodb last year it is a tad frustrating to have to dive into the messy and fuzzy Java persistence world. Ok, I did miss the transactions in Mongodb a lot but for the rest it was a dream. However, there are good cases ...
comments: true
---

# The Perfect OSGi Persistence Model?

After having such good experiences with Mongodb last year it is a tad frustrating to have to dive into the messy and fuzzy Java persistence world. Ok, I did miss the transactions in Mongodb a lot but for the rest it was a dream. However, there are good cases to be made for relational databases, not in the least because of their popularity and therefore widespread support. What I found so far is that virtually no implementations are as easy to use as the OSGi specifications imply. I've now got a working configuration that works but is a far cry from the pick and choose model that OSGi promises. I've created a small blog application that consist of a Web based GUI and a Blog Manager service. The Blog Manager service is then implemented in multiple ways:

* Dummy database
* JDBC based on the OSGi DataSourceFactory
* JPA
* JDO

The intention is to then have configurations for different implementations for each of the persistence standards. So far I have the dummy version running as well as an OpenJPA/H2 based one. Though H2 worked out of the box, OpenJPA was much harder. I could actually only get it to work by using a number of Aries bundles. Another struggle was to get the Transaction Manager working. After trying out different versions I selected the Jonas Transaction Manager (JOTM) but also this transaction manager designed for OSGi required glue code.

The whole purpose of specifications is that you can pick and choose and not have to spent time writing silly glue code. However, today the implementations are clearly not properly supporting the OSGi specifications, even though in most cases latent support is present. I also see that people are struggling with implementations, often doing things much more complicated than required.

So what is the ideal OSGi model? The ideal OSGi model is that an application depends on an Entity Manager service. This Entity Manager is configured by Configuration Admin service and uses an OSGi Data Source Factory service from the registry as the JDBC driver. If a Transaction Manager service is registered, then this manager must be used by the JPA and database implementations. Just selecting different bundles should allow you to experiment with different configurations. Such a model is highly decoupled and allows for a lot of flexibility.

We need a community effort to fulfill the persistence promise of OSGi: plug &amp; play. So, to move this forward, if you have a persistence configuration using JTA, JDBC, JPA, or JDO that works well under OSGi, please send this configuration to me or point me to a public project. If you're a committer (open or closed source) that implements JTA, JPA, JDO, or JDBC implementations and want to work together to make your project work out of the box in OSGi, then send me a mail and I will see how I can help. I will do reporting through this blog and twitter.

 Peter Kriens
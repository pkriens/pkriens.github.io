---
layout: post
title: The Transaction Composability Problem
description: Entering the enterprise world from an embedded background feels a bit like Alice must have felt when she entered Wonderland. Sometimes you feel very big, other times you feel awfully small ...
comments: true
---

Entering the enterprise world from an embedded background feels a bit like Alice 
must have felt when she entered Wonderland. Sometimes you feel very big, other 
times you feel awfully small. Worse, you often do not know your relative size in 
that new and wondrous world. One of these areas for me is persistence and its 
associated transaction model.

The reason I have to understand this area better is that for the enRoute project 
we will have to provide a persistence model that makes sense in a world build out 
of reusable components. If these components are closely tied to a specific database, 
JPA, and transaction manager implementations than reuse will be minimal, forfeiting 
the purpose. There are many issues to solve but analyzing this landscape one thing 
seems to pop up: the transaction composability problem. A problem quite severe 
in a reusable component model like OSGi.

Transactions provide the Atomic, Consistent, Isolated, and Durable (ACID) properties 
to a group of operations. This grouping is in general tied to a thread. A method 
starts a transaction and subsequent calls on that thread are part of the grouping 
until the transaction is either committed or rolled back. The easy solution is 
to start a transaction at the edge of the system (RMI, servlet, queue manager, 
etc.) and rollback/commit when the call into the application code returns. 

However,  transactions are related to locks in the databases (and other resource managers) 
it is therefore crucial to minimize the number of grouped operations to increase throughput 
and minimize deadlocks. Generating HTML inside a transaction can seriously reduce throughput. 
Therefore, application developers need to handle transactions in their code.

One of the issues these developers must handle is how to treat an existing transaction.
 Should they join it or suspend it? Is being called outside a transaction allowed? Since 
 methods can be called in many different orders and from many different places it is very 
 hard to make assumptions about the current transaction state in a method. For example 
 method foo() and bar() can each begin a transaction but then foo() can not call 
 bar() or vice versa.

The corresponding complexity and associated boilerplate code resulted in declarative 
transactions. Annotations provide the suspend and joining strategy and something 
outside the application takes care of the details. EJB and Spring containers 
provide this functionality by proxying the instances or weaving the classes.

Back to OSGi. Since transactions will cross cut through all components we 
need to define a single transaction model that can be shared by all, just 
like the service model.

Obviously, we will need to register a Transaction Manager service so the 
different components can at least manage transactions together. However, do 
we need to prescribe a declarative model since this seems to be the best practice? 
Do we then pick EJB or Spring annotations? Support both? Or make new? Or are we moot 
on this and allow others to provide this support with extenders? This would be similar 
to the service model, Blueprint, iPOJO, Dependency Manager, and DS are all in business 
to make life easier for code using services, a similar model could be followed for transactions?

I am very interested in hearing feedback on this.

Peter Kriens

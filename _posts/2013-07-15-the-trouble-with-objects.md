---
title: The Trouble with Objects
layout: post
description: When I discovered objects in the early '80s my mind was blown away. This was a technology that felt right, it gave me a way to think about my software that I utterly missed in structured programming. My career in the 90's ...
comments: true
---

# The Trouble With Objects

When I discovered objects in the early '80s my mind was blown away. This was a technology that felt right, it gave me a way to think about my software that I utterly missed in structured programming. My career in the 90's centered around helping companies getting started with objects. Objects had clearly won, it was a run race. Lately, however, I have been getting more and more doubts.

## Data Hiding

The unique selling points of objects is that the data can change while the behavior remains the same (or at least backward compatible) via its public interface. If the world is the process then this is a great model. However, with 10Gb ethernets and larger, larger problems, cheaper computers, the world of a program is no longer a process: You are building distributed systems.

## Distributed

Distributed systems exchange information. In Java an attempt was made to preserve the object oriented semantics by not only communicating the data, but also sending the classes. However, ensuring that each system would use the correct class version and maintaing security turned quickly into a quagmire except for the simplest of systems. And even if it does work, it excludes any non-Java participant from collaborating. It is not that the OO community did not get any warning signals. The object oriented impedance mismatch with relational databases shows, at least in retrospect, that hiding your data while persisting it is not an option. At the time, we thought this was a problem that would solve itself when object oriented databases were ready (any day now!). Alas, they largely ran into the same problem that ensuring that the classes that read/wrote the data were of the same or compatible version was hard, if not impossible in many cases.

## Conclusion

Looking at Java (and non-Java) persistence solutions I was ran into JOOQ, a library that declares peace between Java and SQL. Instead of abstracting it, it provides a type safe, fluid builder, way to use relational databases. It gave up on abstracting the database but it seems to have won a lot in simplicity and exploiting the powerful relational model. I cannot but wonder if all those abstractions to make the life of the application developer easier are in the end worth the increased complexity. Would it be worth to create a small, pet clinic like, OSGi application that would use all these different persistence models?

Peter Kriens

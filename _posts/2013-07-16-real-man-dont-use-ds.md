---
title: Real Men Don't Use DS
layout: post
description: In general watching Stackoverflow is a pleasant way to spent some spare time. Helping other people out feels good and it is nice to see how the number of OSGi questions, and thus adoption, is increasing. However, it can also hurt looking ...
comments: true
---

# Real Men Don't Use DS

In general watching Stackoverflow is a pleasant way to spent some spare time. Helping other people out feels good and it is nice to see how the number of OSGi questions, and thus adoption, is increasing. However, it can also hurt looking at how people are struggling because of their own choices. There is this idea in our industry that real men start with the command line and Bundle Activators. Bare metal! Somehow this is considered to be a better way for real men to learn a technology than using a sissy IDE. Just like real men do not learn how to drive a car until they can clean and tune the carburator! The fact that  carburators have been absent in cars since the late seventies seems irrelevant to them.

I've written forewords for numerous books about OSGi and virtually all made the same mistake that to understand the technology you should first proof your worth by struggling with a Bundle Activator and a Service Tracker. Just like cars today have electronic injection so does OSGi have dependency injection. Use it. My strong recommendation is that if you want to learn OSGi, use bndtools with a Declarative Service (DS) example project. Make sure you understand the life cycle of declarative services and their immensely powerful integration with Configuration Admin. Realize that any class can be made a service with a simple annotation and any service can be made a dependency with a another annotation. If you need something to initialize, add an activate or start method to your service. Check your imports in the content pane and adjust imports them with drag and drop to make them cohesive and simple to use modules. Visualize what and how is running with Apache Felix Webconsole and Xray. Enjoy the sub-second edit-debug cycle. That is what you should learn and fall in love with because that is what makes OSGi so powerful.

Only after your mastered this initial level start looking under the hood and find that all the goodies that real men need are really there: Continuous integration, command line stuff, low level service access, weaving, proxying, bundle activators, bundle trackers, service trackers, whatever. It is wonderful to know it is all there when you need it but it is not what OSGi is all about.

Peter Kriens

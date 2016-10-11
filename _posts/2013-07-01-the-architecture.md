---
title: The Architecture
layout: post
description: Last year when I started with jpm4j I spent quite a bit of time exploring the state-of the art technologies. Even before that start point I had decided that the world had changed, most Java web frameworks looked ...
comments: true
---

# The Architecture 

Last year when I started with jpm4j I spent quite a bit of time exploring the state-of the art technologies. Even before that start point I had decided that the world had changed, most Java web frameworks looked very outdated with the advent of the upcoming HTML5. Now, with 55 years I guess I am an old geezer so I remember time sharing (punch cards, ASR/Teletypes, ending in intelligent terminals), the swing to the PC applications that gave us 'fat clients' in the eighties and early nineties, then the pendulum going back to 'thin' browser based clients from 1995 and onwards; and now the back swing to fat Javascript based clients. For many Java developers that started in the late nineties, no longer being a rebel but being treated as an incumbent will come as a nasty surprise since most Java web frameworks like JSP, JSF, Vaadin, Struts, Spring MVC, Wicket, and hundreds of others will be relegated to the dustbin of history over the next decade.

## HTML 5

What changed? What has changed is HTML5 combined with Moore's Law. For the first time, there is a software platform that allows you to develop a single application code base that will run on virtually any user facing machine. From smartphones to high-end workstations. Though the rudiments have been available for a long time it was not until the browser vendors/organizations kicked w3c's lead and decided to go on their own in the WHATWG workgroup that we got a pretty decent, fairly wide, specification for web applications that was quickly supported by virtually all browsers. We are back running our application code on the client but this time we have no deployment problem nor having to worry about the client's Operating System.

## Consequences for Java

This is of course a game changer for Java web frameworks. In a Java web framework the UI is managed in the server. This model requires a round-trip from the browser to the server when the GUI needs an update; a slow process that not only places a heavy demand on the server but it can also feel sluggish. With HTML5, the server can focus on the data and becomes oblivious of the GUI. The client worries about the graphics and interaction. The biggest advantage is scaling, no longer is the server required to maintain the often large state of the GUI; instead it provides a REST interface or JSON RPC interface . So not only is the footprint reduced, distributing the workload is even easier since the  protocols can easily be made stateless. Another advantage is simplicity, in my experience the server code becomes considerably smaller and therefore much simpler.

So why am I so excited about HTML5 since it seems irrelevant to OSGi? As  [Emanual Rahm said: "Never let a serious crisis go to waste"][1]. I believe that HTML5 will be a disruptive change, causing a lot of web applications to be rewritten since customers will demand the responsiveness of local applications. This offers an opportunity for OSGi; an environment that in almost all aspects seems to have been designed for this paradigm shift.

Peter Kriens

[1]: http://www.brainyquote.com/quotes/quotes/r/rahmemanue409199.html

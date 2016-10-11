---
layout: post
comments: true
title:  Challenged
description: In my last whiny post I stated that we tend to solve the symptoms and not the root problem, Jaco Joubert challenged me to define what the real ...
---

In my last whiny post I stated that we tend to solve the symptoms and not the root problem, Jaco Joubert challenged me to define what the real problem is; fair enough.

The root problem is that we write fragile software that stumbles when there are unexpected changes in the environment. The simplest solution to this problem is to lash down the environment. If the environment does not move, then our software will not fall over. This is exactly what Docker does. And if a software system consisted of a single delivery then the cheapest solution is likely the best solution. 

However. My unease is caused by two fundamental issues: 

* First, we will write the same amount of software in the next 7 years as all the software written since the big bang. 
* Second, successful software systems tend to live a long time and evolve continuously. 

In such a gyrating environment the only thing constant is change. Change that Docker will allow us to largely ignore because we create a warm nest where this bad outside world does not intrude. Sloppy programming like hard coded path names and making other assumptions about our environment will not be punished. Initially this will work perfectly ok. However, over time your modules will become more and more tied to your unique environment because we have a hard time resisting a short-cut when they see one. These short-cuts will make the modules less and less reusable, which will probably make it easier to double the lines of code in the next 7 years but efficient is different. It will also make it harder to evolve your own environment because a lot of its details will be hardcoded in all the components. Expect another variation on the spaghetti model.

The root of software bugs is almost always a violated assumption in the code, therefore, not having these assumptions is the way to go, even though this can be very hard work. Not only will this reduce bugs, it will also make code more reusable because not-knowing something also reduces constraints between modules. A great way to structure this is to do contract based programming, something which reaches its (current) perfection in the OSGi service model. 

The argument is therefore that the virtual-image model (which Docker just makes more usable) will let sloppy programming go unpunished until the big bang.

Now, the picture is not black and white; I actually feel a bit uncomfortable with such an argument in other places and I clearly see the shorter term advantages of the container model. Maybe jet fighter pilot training provides some insight. Their simulators are running significantly faster than real life. The result is that when the pilots are deployed in a real fight it actually feels a tad boring. This is why during development I want an open world and as much dynamics as possible to capture our team's false assumptions early. However, when the code actually gets deployed to Q&amp;A I want a locked down environment that will be bitwise identical to the image that goes to production.

Ah well, that is why I love this industry, never a dull moment.

Peter Kriens













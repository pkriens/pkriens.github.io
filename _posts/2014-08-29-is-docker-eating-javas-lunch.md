---
layout: post
comments: true
title: Is Docker Eating Java's Lunch?
description: This weekend I played with Docker  to better understand this technology and this was quite fun. Interesting how we focus our energy on solving symptoms instead of addressing the root problem. But I deviate.
---

# Is Docker Eating Java's Lunch?

The reason I've put up with Java's deficiencies so long (ok, now with Lambda's 
it is finally starting to become a real language) is that I truly believe in 
the 'Write once, run anywhere' mantra. I've never understood why you want to 
write software that is not reusable and thus portable. Java achieved its 
portability by creating an abstract API for the interaction with the host 
Operating System (OS). I am duly impressed with Sun's engineers of how close 
they got to this goal, the Java VM is amazing piece of technology.

However, in practice, writing portable software still required effort 
from the developer. Despite the abstractions (alas, if only they had 
stayed close to POSIX), there are many subtle, and some not so subtle 
differences, that must be handled by the developer. Just like the differences 
in the configuration of an OS or the way its file system is used (i.e. hard 
coded path names).

## It Works For Me!

The dreaded 'But it works for me!' frustration drove the idea of virtualization, 
where the software runs on a standard (Linux) OS that is virtualized on each 
developer's machine, which is then bitwise identical in test & production. The 
cost of this model was that it required schlepping around large images of many 
Gigabytes whenever the tiniest detail changed. Docker is, however, removing this 
disadvantage by making it very efficient to create, manage, and deploy these 
custom images.

So it looks like that the majority of Java applications in the future will run 
on Linux even if they run on MacOS or Windows, voiding the unique selling point 
of Java: portability. From now on, Java will be on par with every other language 
in the world regarding portability.


## So what is left?

Java's greatest asset is that it allows you develop very large applications with 
sizable teams and stay sane. Though its type safety and long name feel cumbersome 
for small applications it becomes a necessity when the code base grows, which it 
inevitably will for any successful product. Type safety gives you confidence 
that all the different parts are actually compatible; the long names prevent 
conflicts. Even more important, it gives you navigability in the IDE, crucial 
when you maintain a large code base. This is of course exactly the area where 
OSGi provides it benefits: extending the type system with private Java namespaces,
a time dimension (semantic versioning), dependency model, and into the runtime. 
There is no competitor on the horizon here.

So though Java/OSGi seems still have some unique selling points, it is the 
programmer in me that is a bit sad because the Docker revolution is another 
win for the sloppy programmer. There is something fundamentally wrong in our 
software industry if our software is so brittle and fragile that we can only 
make it run in a rigidly defined bitwise identical world, it points at a 
fundamental failure in the way we develop software. Sadly, we have so far been 
unable to learn from nature. In nature, systems survive and evolve because 
they are dynamic, adaptable, and resilient, often even anti-fragile. The 
Docker revolution will actually make our systems even sloppier since now many 
bad practices will go unpunished and this will have a price tag. These now 
unpunished bad practices will make maintenance and evolution of the code 
base much harder, aggravating the situation down the line.

Then again, who cares what happens in the next quarter? This Docker development 
model will likely lower the use of the  excuse: 'But it works for me!'

Peter Kriens
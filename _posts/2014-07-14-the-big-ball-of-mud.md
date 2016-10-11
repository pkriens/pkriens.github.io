---
layout: post
comments: true
title: The Big Ball of Mud
description: I am a tad frustrated about the whole µService discussion. How carefully designed concepts and terminology gets trampled over by a crowd ...
---

# The Big Ball of Mud

I am a tad frustrated about the whole µService discussion. How carefully designed 
concepts and terminology gets trampled over by a crowd that doesn't bother to look 
around in their rush to next year's fashion. When Neil Bartlett posted a link to 
an interesting blog that discusses exactly this subject I was therefore pleasantly 
surprised. It is about how our industry tends to swing from hype to hype and does 
not even try to learn any lessons from the down-swing. That is, if those lessons 
requires more than a minimal attention span. Ok, [Simon Brown][1]  does not appear 
to be an OSGi aficionado but he hits the nail on the head that your monolithic big ball 
of mud is not going to be a tender agile application overnight by adopting 
micro-web-services. Or, how a new fashion is always more attractive than the 
grunt work of making the existing stuff right. Hey, maybe they did find the silver 
bullet this time! #not.

## Complex Systems
We actually know quite well, and for a long time, how to build large complex systems: 
contract based component designs scale very well. It just so happens that in practice 
the siren song of short cuts are much more attractive than doing it right ... that 
is, in the short run. We show beautiful layered architectures that are in reality 
camouflage nets over the actual big ball of muds. Read [Simon's blog and weep][2].

Now, although I agree with the view in this blog, I think he misses the key reason 
_why_ we always end up with that big ball of mud. Unfortunately, experience shows 
that this is not an easy story that fits the 140 character attention span, the 
cause of the big ball of mud does require some work to understand. Please shut 
off twitter and bear with me.

## Some History

In the seventies, structured programming was the then current best practice. The 
mantra's in those times were 'Low Coupling' and 'High Cohesion'. Then, in the early 
eighties, we got Objects! New! Improved! No need to bother about these old 
geezers with their coupling and cohesion muck anymore. (I never really got that 
cohesion stuff anyway.) Progress, New! We were young and innocent until time taught 
us that the old geezers had probably learned a lessons or two that we had missed. 
Embarrassingly, the anticipated reuse we had promised to our managers were much 
harder to achieve than we had thought in our youthful exuberance. What killed us 
most were the transitive dependencies that are implicit in the object programming 
models. It is wonderful to reuse another object, but the damned thing should 
then not do the same thing and depend on others, ad nauseum. Instead of picking 
and choosing reusable objects, systems quickly became [big balls of mud][3], or more 
appropriately, a different form of spaghetti coding. We had carefully avoided the 
`GOTO` statement but the result was painfully similar, just on another level.

In the nineties I had learned my lessons about coupling, cohesion, and objects. 
So when I met Java in 1996 I  immediately realized what interfaces were doing, 
they were addressing the transitive dependency problem that had caused me so much 
pain! With an interface you could program against a contract, not against an 
implementation! This did wonders for the transitive dependency problem since you 
were now bound to an interface. Interfaces were much less coupled by design than 
implementation classes. I obviously wasn't alone and interfaces became highly 
popular in Java and are pervasive today because they do provide freedoms that 
transitive dependencies kill.

## Transitive Dependencies

Alas, we then witnessed a demonstration of how little intra-generational learning 
is going on. Two things went haywire. First, interfaces raised this pesky problem 
of 'How on earth do we get the instance in runtime?` Factories were kind of awkward 
so we found the greatest ostrich solution of all software times: 'We hide it in a XML!'. 
Obviously, the fact your coupling Java analysis tools did not see these hidden 
dependency anymore did not mean they stopped hurting you over time. An implementation
class reference is a transitive dependency as much as any "new" expression is in 
your compiled code. Worse, a class referenced in text bypasses all those type 
safe-guards in Java you just spent all that money on.

The other, and surprisingly even worse, mistake was that we happily copied the 
transitive implementation dependencies model that failed so spectacularly with 
objects into our modules. And surprise, we got the same ball of mud, just now on 
a tad larger scale. Don't get me wrong, it is not maven that downloads the Internet, 
it is people that download the internet. People are addicted to solutions that look 
easy. That is, until that proverbial stuff hits the fan but then the original designers 
have then usually moved on.

Hard coding a dependency on another module will inevitably create more and bigger 
balls of mud, we learned this with structured programming, with object oriented 
programming, and now we are learning it with modular programming. The structural 
problem is identical in all these cases, so why should the result differ? (Though 
I find that a surprisingly large group of people disconnect now, 'What on earth 
has an interface to do with modules? This guy is an idiot ...'. Then again, 
their attention span probably already had made me loose them to that interesting 
tweet that just came in.)

## OSGi

Obviously, when we started designing OSGi in 1998 we did not have the clear view 
of today. However, the crew that did the early design had a lot of experience and 
provided a very elegant, µService based, model.  It solved the 'how on earth do 
I get my instance of that interface' problem in a non-ostrich way, it also 
innovatively used Java packages as the dependency model.  The Java package 
plays the same role for a module as the interface does for a class.

If you find this hard to swallow then you're not alone (which does not make you 
right btw, just more common). At JavaOne, I actually once overheard a discussion 
between three (at that time) Sun/Oracle high level executives;  they were making 
fun of package dependencies, radiating an amazing ignorance of the underlying 
issues. Even with very bright people, some that I admire a lot, I've seen that 
it takes effort to accept this structural analogy between classes and modules. 
However, even at the JCP, the Java package is already playing a large organizing 
role in most, if not all, specifications. It acts as the mediator between the 
provider (e.g. Jersey) of the specification (JAX-RS in javax.ws.rs. packages) 
and the consumer of that specification.

## µServices

The key consequence of the OSGi model is that the µservice is not an implementation 
(a module) as many people tend to talk about it, it is a contract. Modules can 
provide implementations for these service contracts and they can consume objects 
that implement these service contracts. The modularity model is thus not: module 
A depends on module B. No, module A depends on service S and module B and module 
C can provide such a service. It is this crucial indirection that I think Simon 
misses in his blog that is the only known answer against drowning in the big ball 
of mud over time. We figured this out with Java interfaces, we now only need to 
understand how we can eradicate the same transitive pest with modules as well.

## Conclusion

Yes, I know the model is not as simplistic as the module A depends on module B 
model that we know so well; it adds an additional indirection that is not free. 
The difference is that you pay that cost up-front while the long term cost of 
module dependencies is much, much higher but drawn out over time.  Though we 
like to postpone costs, we actually did learn a lot of lessons over time that 
made us take some up-front cost, Java as a type safe language is the prime 
example. So I am utterly convinced that model we learned in OSGi will prevail 
over time. Just hope that I do not have live through another hype that presents 
(parts of) these ideas as if they are something new.

Peter Kriens


[1]: http://www.codingthearchitecture.com/
[2]: http://www.codingthearchitecture.com/2014/07/06/distributed_big_balls_of_mud.html
[3]: http://www.laputan.org/mud/
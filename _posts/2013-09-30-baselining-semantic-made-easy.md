---
layout: post
title: Baselining, Semantic Versioning Made Easy
description: Versioning is one of those things where everybody has a general idea but few really understand it well, resulting in many different and sometimes bizarre practices. The semantic versioning movement put a more solid footing on the version syntax, creating a version Domain Specific Language (DSL) to ...
comments: true
---

Versioning is one of those things where everybody has a general idea but few really understand it well, resulting in many different and sometimes bizarre practices. The semantic versioning movement put a more solid footing on the version syntax, creating a version Domain Specific Language (DSL) to signal backward compatibility. It uses a 3-part version, where the first part (MAJOR) signals the breaking changes, the second part (MINOR) signals backward compatible changes, and the third part (MICRO/PATCH) signal bug fixes not visible in the public API. For example, an artifact with version 1.2.3 has the same API as 1.2.4, will be backward compatible with 1.3.0, and will break with 2.0.0. By using semantic versioning you pledge that in the future you will use this DSL to signal backward compatibility so that tools can point out breakage or select compatible components. Semantic versions are a big step in software engineering.

So any decent software engineer will agree that semantic versioning is good; being able to watch Maven central close up, I can also see that it has become widely used over the past 2 years. That said, how much work is there for a developer to maintain these versions? Developers are rightly lazy people and versions can be quite error prone and are complicated to maintain without tool support. To minimize the work, I've used the OSGi semantic version rules extensively in bnd. If you compile against an API then you are bound to a range of versions. For example, if you compile against an API with version 1.2.3 then bnd will calculate the corresponding import range: [1.2.3,2). (Actually it is a bit more subtle, see the OSGi semantic version paper.)

Though bnd has the tools to maintain your semantic versions and therefore pledged how things would be updated, it never checked if those pledges were actually kept. If you forgot to change a version after a code change then all bets were off. Since humans are really bad at versions and developers rarely know all the compatibility rules there were many errors.

Meet baselining. 

When you enable baselining, bnd will baseline the new bundle against the the last released non-snapshot bundle, a.k.a. the baseline. That is, it compares the public exported API of the new bundle with the baseline  If there are any changes it will use the OSGi semantic version rules to calculate the minimum new version. If the new bundle has a lower version, a number of errors are generated. 

The first error is on the place where the version is defined. The other errors are on the API changes that caused the version change. Since bndtools runs bnd continuously you have the uncanny effect that adding a method to an interface suddenly generates errors in different places, pointing out that you are trying to make an incompatible change. Quick fixes are then available to bump the version or to remove the offending API change. Detecting errors earlier is the hallmark of Eclipse and is a great boon to productivity. We all know how much time it saves when you find these bugs while they are being made.

Baselining teaches the actual developers a lot about backward compatibility. After enabling baselining on bnd this weekend I was actually shocked to find that some of the (expected to be) tiny changes I had made in the last three weeks since we froze 2.2 were not as compatible as I thought. (This is another way of saying I had not bumped the appropriate versions.) They were not just bug fixes but actually had API repercussions I had not foreseen, humbling.

Peter Kriens


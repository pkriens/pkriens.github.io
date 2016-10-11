---
layout: post
title: Accidental Complexity
description: I am currently writing an RFP for the increasing adoption work I will do for the OSGi Alliance. To understand the landscape, I interviewed a number of software companies. The first interview was a Spring/Maven shop, representing mainstream Java development. However, I've seen that ...
comments: true
---

I am currently writing an RFP for the increasing adoption work I will do for the OSGi Alliance. To understand the landscape, I interviewed a number of software companies. The first interview was a Spring/Maven shop, representing mainstream Java development. However, I've seen that PHP is very  popular in the lower segments of the web applications. Since I am a strong believer in the powers of Java, I always wondered why those people 'struggled' with PHP so I decided to interview a small PHP shop to find out why they used PHP.

The story they told me over lunch was quite interesting. Early 2000 they had some people go on a course at IBM to learn about Java EE. After many thousands of dollars and some weeks later they all had become utterly confused. In their eyes, Java was just way too complicated for what they wanted to do. PHP gave them a simple platform that was more than sufficient for their needs. And not only was it much easier to learn, it was also much easier to find libraries and snippets that they could use in their daily work.

When I tried to defend Java (neutrality is not my stronghold) I found that most of those really good things in Java fell on deaf ears. For example, refactoring is one of my top features in Java but they had no idea what it entailed. So I found myself desperately trying to explain refactoring in terms of a type safe search and replace but it was clear that their eyes glazed over, wondering what the big deal was (ok, the rosé might not have helped). It was clear to me that much of the accidental complexity we have in Java was not understood to have sound software engineering reasons, for them it was just painful and overly complex. PHP was so much easier to get started with. I must admit that when a friend, who is a non-technical sociology professor, built a professionally looking PHP website, including large forms and payments, I was duly impressed.

After some more Rosé my lunch partners did actually come up with problems. Problems that I think could be addressed but the problem was that they saw these 'problem' as facts of life, not something that could be addressed.

Therefore, the primary problem that we should try to address is how to cross the steep threshold that Java puts between an uninitiated developer and a web app. I think having a framework for web apps that provides a skeleton for other applications is the start point that will make a difference. However, to also attract non-Java developers we will need to minimize the accidental complexity of Java and OSGi. With DS annotations and bndtools I think OSGi's accidental complexity is ok for the powers it offers. However, after researching how to handle persistency in Java I find it hard to apply the Java EE APIs in OSGi so that they provide an out of the box experience like PHP. At the same time, I find some other libraries that are not Java EE but seem a lot easier to use. It will be interesting to find out how we will weigh the compatibility requirements against the simplicity requirements.

Peter Kriens

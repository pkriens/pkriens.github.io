---
layout: post
comments: true
title: Yet Another Maven Bundle Plugin!
description: It must have been 8 years ago that Richard S. Hall visited me here in the south of France. During these days we hacked ...
---

# Yet Another Maven Bundle Plugin!

It must have been 8 years ago that Richard S. Hall visited me here in the south of France. During these days we hacked together a rudimentary plugin for Maven so that Richard could use bnd's functionality in his maven build. This was where we laid the foundation for the "funky" XML that described the bundle. As this was our first maven plugin, we had no clue what we were doing but it seemed to work for Richard. It is now 19 releases later. Surprisingly, the Apache Felix bundle plugin is one of the most popular downloads outside the standard Sonatype maven plugins. 

That said, the plugin was showing some strains that were not easy to correct in an existing plugin for backward compatibility reasons. Therefore, last week Neil Bartlett published a new variation on this plugin in the bndtools project.  This plugin fits better in the maven model, instead of taking over the JAR process it now only outputs the contents of the JAR in the classes folder. This fitted better when you had later phases that further processed the classes directory. Neil Bartlett, the author of the plugin describes the process in detail in his blog. Since we receive a lot of pressure to be more maven like, it is not unlikely that we will add more features to this plugin and bndtools to make them interoperate more closely.

Inspired by this new maven plugin, BJ Hargrave, added similar support to the Gradle plugin, making it easier for native Gradle builds to use the standard bnd plugin. Similar support was already available in ant.

The new plugins will be part of the bndtools build so that we can release the plugins synchronized with the new features in bnd so that we can publish them timely on Maven Central.

This does not mean that the older plugin will be disbanded any time soon. Since it is so popular and has some behaviors that are different than the new plugin we will continue provide support for the Apache Felix group to keep publishing this plugin.

Peter Kriens

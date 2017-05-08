# Java's Pre Modular Syndrome

After nearly 12 years of struggling Mark Reinhold's dream of a modular Java VM seems to be finally 
come true. Eleven years after the submission of JSR 277 I withdrew my membership of the JSR because 
I had no good idea what I was doing there. Initially there was an interesting functional overlap between 
OSGi and JSR-277 but over time it became clear to me that Mark, through the lens of the OpenJDK project,
saw a very different problem then that was facing my customers.

For example, Jigsaw requires that there is a single namespace for all packages and classes in
an application. That is, the package com.example.foo can only be in a single Jigsaw module, even if it
is not exported. So a complete application consisting of hundreds of modules can have a single 
class loader. Since I don't know  any rational reason why someone wants to design with 
split packages, overlapping private  packages, and requiring different versions for the same 
class, this restriction makes a lot of sense. A company that can control their complete source code,
like the Cathedral architect could control each detail of the church, should be deeply ashamed to 
use any of these hacks because they have no excuse not to refactor. A JVM modularized that way 
will truly be an improvement.

Another problem that has plagued Mark over the past 15 years is idiots that use classes like 
`sun.misc.Unsafe`. Although these classes are clearly marked as implementation details their
unique functionality (or plain convenience) made them important dependencies so that other VMs like 
IBM's or JRocket had to include them as well. This made it impossible for Sun/Oracle to 
improve their code base because it would break existing customers. Since Jigsaw will break
almost every non-trivial project it was decided to go all the way. In Jigsaw modules are truly 
impenetrable, not even a `setAccessible()` exists to override the modularization. 



So from Mark's perspective Jigsaw is a simple solution to a complex problem. From my perspective
it is also wrong. My customers build their software out of hundreds, up to a thousand, of open 
source components. Some of these projects have not been touched for ten years,
some projects have a new release every week. Since this is not a cathedral but a bazar there is
no central control. I 


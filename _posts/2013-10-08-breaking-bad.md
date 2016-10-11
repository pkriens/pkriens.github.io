---
layout: post
title: Breaking Bad
description: "In my quest to get OSGi and JPA working together purely through services I ran head on to an API that breaking my code badly: java(x).sql. After making things work on Java 6 ..."
comments: true
---

In my quest to get OSGi and JPA working together purely through services I ran 
head on to an API that breaking my code badly: java(x).sql. After making things 
work on Java 6, BJ Hargrave (IBM) setup a continuous integration build on Cloudbees. 
Since Java 6 is end of life, he rightly picked the Java 7 JDK. Unfortunately, this 
broke my program since I was proxying the DataSource and Connection class from 
java.sql and javax.sql respectively. After inspecting it turned out that Java 
7 had added a number of methods to javax.sql.DataSource and java.sql.Connection, 
effectively killing every driver and delegating proxy in existence since they 
did not implement these methods in their implementation classes.

The problem is not breaking backward compatibility. JDBC moves on and if you 
want those features drivers will have to upgrade, fair enough. The problem is 
that decision to upgrade your database drivers is now tightly connected with 
the choice of the VM. If you want to run on Java 7, JDBC 4.1 is forced upon 
you since every previous driver will fail to run on Java 7.

It is illustrating to look at the hoops a database vendor has to jump through 
to allow its drivers to run on Java 6 and Java 7. It must compile on Java 7 
to see the new methods but generate Java 1.6 byte codes to make the code run 
on Java 6. However, the vendor must be extremely careful not to pick up any 
methods or classes in Java 7 that are not available on Java 7. An awful 
illustration of how painful a type safe language becomes when you do it wrong.

In OSGi this would all be no problem*. There would be a semantically versioned 
javax.sql package that contains the SQL API. Consumers (in general you) of this
package would get a lot of backward compatibility and providers of this package
(the database vendors) will have to provide new releases for each new API. 
Since in runtime multiple releases can coexist in the same VM, the choice for which 
VM will not unnecessarily constrain the choices for a database vendor. It is kind
of odd that Oracle, a database vendor, makes such a mess in the API to their databases ...

The java(x).sql disarray is a fine illustration of how aggregation creates constrains 
between its constituents. It is at the heart of the OSGi package dependency model. 
The siren song of one huge library that contains everything one could ever need 
(and much more) should be resisted in lieu of modularity since over the long run, 
super aggregation creates more problems than it solves.

   Peter Kriens

(*) If it was not for the nasty detail that javax.sql is badly intertwined with java.sql and java.sql can only be loaded from the VM's boot classpath because it is a java package. Sigh.
---
layout: post
title: JPMS, The Sequel
description: The long lasting demonstration why software is hard
comments: true
---

# JPMS, The Sequel

I tried to ignore JPMS but my renewed love of formal specifications got the better of me. Trying to put JPMS in [Alloy][1], a formal specification language, made me aqutely aware of how badly specified JPMS really is. There are loose ends, plain errors, confusing statements, unclear terminology. Strangely, this seem not to faze anybody as far as I can see. Java is supposed to be the language of 9 million developers and 3 billion devices, should we not expect some quality control when a new foundation is laid?

In a series of articles I want to go through the [JPMS document][1], a document describing changes to the language and the VM which was the input to the (failed) vote. However, this is only a part of the 'specification' it seems. The rather stale [State Of the Module System][3], also in Mark Reinhold's home directory, is the most up to date document I could find that discusses the more concrete aspects of Jigsaw but states it is the proposal for the JPMS. Puzzling.

This first installment is purely about the JLS. later installments will dive into the runtime aspects of the  [State Of the Module System][3]. This first installment is mostly a gentle introduction in how Alloy can be used to formally specify software like JPMS.

## About Alloy

Alloy is the first formal specification language I met that is quite readable, even for beginners, accompanied with a terrific tool to interactively explore specification models. Though it cannot provide a formal proof, it can efficiently traverse a complete state spaces for a limited number of instances to find (counter) examples of invariants or special cases. Though this is therefore not a formal proof, it is usually more than sufficient because most specification errors can be demonstrated with only a few instances. Alloy guarantees to find these instances when they are in scope. 

A good introduction of Alloy is the [Daniel Jackson's presentation to ICSE][4]. In this aricle, I will try to explain the different concepts used to make them readable for experienced Java developers.

Most important thing to remember is that Alloy (or formal specs in general) are like carving a statue. You start with the infinite state space of all possible combinations and you then put constraints to whittle down this space. That is, you can only remove because you start with the universe. That is, there is nothing more to add. As Java developers we always think in the opposite: we build things from smaller parts. For example, if a statement says `# foo = 4` then we are not _creating_ a set with 4 elements but we're throwing away all state where `foo` is not sized 4. Understanding that we're reasoning about an infinite state took me very long to internalise.

Learning to use formal specifications is quite tricky, I might be writing this series only for 3 people (hi Glyn!), including my mother. However, I do believe Alloy is an extremely valuable tool that is coming into reach for Java developers. So bear with me, give it a try!

## Span

The [JPMS document][1] provides 2 feautures:

* Service layer
* New access restrictions
  * Compile time
  * Run time

For now we ignore the service layer and focus on the access restrictions. JPMS can be boiled down to the followng predicates (function that returns `true` or `false`):

    pred isRuntimeAccessible( module : Module, package : Package ) { ... }
    pred isStaticAccessible(  module : Module, package : Package ) { ... }

To keep things simple, we first focus on the `isStaticAccessible` (compile time). This then leaves out the concept of opening up modules.

## Module Declaration

The [spec documents][1] says:

    CompilationUnit:
        [PackageDeclaration] {ImportDeclaration} {TypeDeclaration}
        {ImportDeclaration} ModuleDeclaration
 
    ModuleDeclaration:
        {Annotation} [open] module Identifier {. Identifier} { {ModuleStatement} }

    ModuleStatement:
        requires {RequiresModifier} ModuleName ;
        exports PackageName [to ModuleName {, ModuleName}] ;
        opens PackageName [to ModuleName {, ModuleName}] ;
        uses TypeName ;
        provides TypeName with TypeName {, TypeName} ;

    RequiresModifier: one of
        transitive static

    ModuleName:
        Identifier
        ModuleName . Identifier

### Issues

* `PackageDeclaration` in a module declaration seems topsy turvy and it does not compile. So ignoring this.
* The module name in the declaration uses a different production then the module name in the requires. They are identical but it is sloppy.

### Model

A `sig` in Alloy is comparable to a type. In reality it is actually a named set of _atoms_. Let's first define the Module sig:

    sig Module {
          requires            : set Module,
          static              : set Module,
          transitive          : set Module,
          unqualifiedExports  : set Package,
          qualifiedExports    : Package -> set Module,
          content             : set Package,
          dependences         : set Module
     }
 
For most Java developers this is not that hard to read, except for maybe the `->`. The `->` is a multimap in this case. In Java it would look something like `Map<Package,Set<Module>>`. It maps a package to a set of modules. Most fields directly map to their module declaration except for the `content` field. This field defines the packages that are inside the module. We need this to comply with some of the assertions later on. The `dependences` field will contain the set of transitive dependencies.

The specification has a number of rules that the module author of a module must obey. In Alloy, we can declare these rules as _facts_ in a block directly following the signature:

	{
		// model static + transitive as extra, i.e. 
		// requires contains _all_ dependencies
		transitive + static in requires

		// The requires keyword may be followed by the modifier 
		// transitive. This causes any module which depends on 
		// the current module to have an implicitly declared 
		// dependence on the module specified by the requires 
		// transitive statement. (the @ is for Alloy to know
		// it should not prefix dependences with 'this.')

		dependences = requires + transitive.@dependences


		// It is a compile-time error if the declaration of 
		// a module expresses a dependence on itself, either 
		// directly or indirectly.

		this not in dependences

		// It is a compile-time error if the package specified by exports 
		// is not declared by a compilation unit associated with the current 
		// module. (`qualifiedExports.Module` works like `Map.keySet()`)

		unqualifiedExports + qualifiedExports.Module in content

		// It is a compile-time error if more than one exports statement 
		// in a module declaration specifies the same package name. ( the &
		// is the subset operator.)

		no unqualifiedExports & qualifiedExports.Module

		// If the declaration of a module does not express a 
		// dependence on the java.base module, and the module is 
		// not itself java.base, then the module has an implicitly 
		// declared dependence on the java.base module.

		JavaBaseModule not in requires implies this = JavaBaseModule 

		// It is a compile-time error if the named module [in requires] is not 
		// observable.

		requires in Observable.scope

		// It is permitted for the to clause of an exports 
		// or opens statement to specify a module which is 
		// not observable.
		//
		// not testable and the compiler gives an error
		// when the 'to' does not exist
	}

Since we introduced a Java Base Module we need to define it:

    one sig JavaBaseModule extends Module {} {
    
      // A requires statement must not appear in the declaration 
      // of the java.base module, or a compile-time error occurs, 
      // because it is the primordial module and has no dependences. 
    
      no dependences
    }
    
And the package.
    
    sig Package {
      references          : set Package
    }

Last, need to define the `Observable` universe:

    one sig Observable {
        scope : set Module
    } {
      JavaBaseModule in scope
    }

## Accessibility

The predicate can now be:

	pred isStaticAccessible( m : Module, p : Package ) {

		// Code inside the module may access public and 
		// protected types of all packages in the module.

		p in m.content						

		// For a qualified statement, the 
		// public and protected types in the package, and their 
		// public and protected members, are accessible solely 
		// to code in the modules specified in the to clause. 

		or  p in m.dependences.qualifiedExports.m

		// For an unqualified statement, these types and 
		// their members are accessible to code in any module. 

		or  p in m.dependences.unqualifiedExports

	}


## Running

The [model we just created][4] can now be used to automatically create some examples to do a sanity check. Just add:

    run isStaticAccessible for 4
    
And goto the execute menu to execute it. This will give you a similar picture as:
    
![image](https://user-images.githubusercontent.com/200494/27127282-a23f259c-50fa-11e7-852e-09562c644253.png)

We can immediately see some interesting things. If not, you can ask for different solutions clicking the 'Next' icon.

* The `java.base` module is in the dependences of `Module$0` but via a ` requires static java.base;`. This was unexpected for me. It does not make sense to require `java.base` either transitively nor statically (optional). Since the Java Base Module is explicitly mentioned one would expect that all rules would be specified for it.
* In this example, `java.base` and a module actually have the same package as content. Though the JPMS/Jigsaw design document clearly makes this illegal, there is no rule in the JLS about this overlap. This will be handled in later versions when things get hairy.
* The `java.base` module has qualified exports to other modules. This will allow Oracle to let some other modules to be friends.

Interestingly, when checking, I found that the `to` part of an `exports` does not have to be observable but the compiler gives a warning when you specify an non-existent module. Anyway

## Next

Many oddities appear because we're missing some fundamental concepts in the JLS. For example, we can see packages without a module, this will be handled with the `UnnamedModule`. We also need the concept of scope. The JLS refers to the `Observable` compile units and the design document refers to the `ModulePath` and the `Resolution`. 

Let me know if you find this interesting enough to see a next installment.

[1]: http://alloy.mit.edu/alloy/download.html
[2]: http://cr.openjdk.java.net/~mr/jigsaw/spec/lang-vm.html
[3]: http://openjdk.java.net/projects/jigsaw/spec/sotms/
[4]: https://raw.githubusercontent.com/pkriens/pkriens.github.io/gh-pages/jpms/compile-only.als

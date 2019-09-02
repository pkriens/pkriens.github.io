---
layout: post
title: Using Native Libraries in a Bundle
description: Discusses the issues with native libraries and OSGi
comments: true
---

# Native Library Dependencies

Sometimes a bundle may contain several native libraries. One may be JNI
code and it may have dependencies on the other libraries. This article
discusses issues with dependencies between the native libraries. It is
based upon an
[email](http://www.mail-archive.com/users@felix.apache.org/msg10172.html)
from Holger Hoffstätte.

    > We are accessing native libraries from Java. This works outside of
    > OSGi and in OSGi on Windows but not on Linux probably because the dll
    > and so linking behave differently.

First off: the `Bundle-NativeCode` capabilitiy/idea is an underrated feature of OSGi. It
works well, but is naturally affected by the capabilities of the
underlying OS and Java's behavior. Naturally this area is harder since
"write once, run anywhere" does not apply any longer when you venture
outside the JVM.

If you only have a single library then just link all your JNI stubs
and other dependencies into one dll/so lribary. This works everywhere.

When you have two or more libraries with dependencies between them
the situation is more complicated. Loading of
dependencies between native libraries works differently on different
OSes, and OSGi did not standardize this model.

## Understand System.loadlibrary

Regardless of the platform-specific call the library is loaded, and -
before the call returns - the OS will notice missing symbols (e.g.
functions defined in a dependent library) and start the
platform-dependent search for dependencies to satisfies the missing
bits.

Windows will look in the current working directory of the process
(usually useless for OSGi) and then libraries on the `%PATH%` variable

Linux will inspect [LD_LIBRARY_PATH](https://blogs.oracle.com/rie/entry/tt_ld_library_path_tt) and then
consult the `ld.so` cache, usually located in `/etc/ld.so.cache`. This cache
contains a cached representation of the system-wide search paths usually
declared in `/etc/ld.so.conf`. This can be updated by e.g. an installer or
system management tool; see `man ldconfig`.

All of these mechanisms are unfortunately not too useful for OSGi, since
two or more libraries contained in a bundle are sitting
somewhere in a bundle cache - a private directory that is not on the search path for libraries.

## Windows

You can pre-load dependencies in their correct order and then load your JNI library.
Pre-loading is done by for example calling `System.loadlibrary`. The preloading can make
sure that the last loaded dependency has no missing symbols, and
the native search machinery does not kick in. This averts the problem.

## Linux

The POSIX/Unix/Linux system calls used for loading, accessing and
closing shared objects are called `dlopen()`, `dlsym()` and `dlclose()`. If
you look at `dlopen()`, it takes a filename (the library to load) and a
magic flag. The way the JVM calls `dlopen()` is the reason why preloading
does not work: the flag is by platform-default set to `RTLD_LOCAL`, which
does NOT expose loaded symbols to subsequently loaded libraries
(contrary to Windows, where loaded symbols become visible).

Manual preloading of dependencies on Linux will not work because the symbols will not be shared.
Whether this is just an unfortunate default, a bug or deliberate is a
different, complicated discussion about isolation, security, stability
etc. but ultimately does not matter since we cannot influence it.

`ld.so` - the Linux dynamic loader used for resolving library
dependencies - looks at a loaded object and obviously also needs to know
what else to load in case there are any declared dependencies. As it
turns out shared libraries can have a search path embedded and _this
path can be manipulated_.

Quote from the `ld.so` man page:

    $ORIGIN and rpath
    ld.so understands the string $ORIGIN (or equivalently
    ${ORIGIN}) in an rpath specification (DT_RPATH or DT_RUNPATH) to
    mean the directory containing the application executable.
    Thus, an application located in somedir/app could be compiled
    with gcc -Wl,-rpath,'$ORIGIN/../lib' so that it finds an
    associated shared library in somedir/lib no matter where
    somedir is located in the directory hierarchy. [..]

This implies that you can build your native libraries with
e.g. `-rpath,'\$ORIGIN'` and loading one dependency (for example your JNI
stubs) will now correctly find any dependencies from the same directory.
Win!

The [patchelf](http://nixos.org/patchelf.html) command makes it possible to patch the `elf` files. (ELF is the format used on Linux for executables and libraries.)

`patchelf` is easy to build and allows you to inspect & modify the runpath
of any library. For an example let's find a library that has
dependencies:

(readelf is part of binutils)

     $ readelf -d /usr/lib/libpcrecpp.so.0.0.0

     Dynamic section at offset 0x8dd4 contains 28 entries:
     Tag Type Name/Value
     0x00000001 (NEEDED) Shared library: [libpcre.so.0]
     0x00000001 (NEEDED) Shared library:[libstdc++.so.6]
     0x00000001 (NEEDED) Shared library: [libm.so.6]
     0x00000001 (NEEDED) Shared library: [libc.so.6]
     0x00000001 (NEEDED) Shared library: [libgcc_s.so.1]
     0x0000000e (SONAME) Library soname: [libpcrecpp.so.0]
     0x0000000c (INIT) 0x2af8

That should do: the C++ wrapper for `pcre` needs the core C `pcre` library
as dependency. Let's modify it!

    $cp /usr/lib/libpcrecpp.so.0.0.0 .
    $patchelf --set-rpath '.:$ORIGIN' libpcrecpp.so.0.0.0
    $patchelf --print-rpath libpcrecpp.so.0.0.0
    .:$ORIGIN

And indeed:

    $readelf -d libpcrecpp.so.0.0.0

    Dynamic section at offset 0xa100 contains 29 entries:
    Tag Type Name/Value
    0x0000001d (RUNPATH) Library runpath: [.:$ORIGIN]
    0x00000001 (NEEDED) Shared library: [libpcre.so.0]
    [..]

This means that loading this library would make the `ld.so` loader look
for dependencies first in the current directory of the process , and then
in the directory where the originating library is located which could
be the completely unknown and anonymous bundle cache of the OSGi
runtime.

The OSGi runtime is at liberty to unpack resources from a bundle lazily.
This means that simply loading a toplevel dependency is not enough, as
any other bundle-included dependencies may not have been unpacked yet, causing the native loader
to fail. The fix is easy: simply _\*\_pretend_\*\_ to preload all libraries
(just like on Windows), but ignore any UnsatisfiedLinkErrors - and then
load the JNI stubs.

To make this robust you should not sprinkle the `System.loadLibrary()` calls
throughout your classes; make a central `Initializer` class (bound to the
bundle's Activator or not) and refer to it. Then in that
activator you can have different loading strategies for Windows
(preloading nicely in-order), Linux (fake preloading) OSX (same as
Linux) or any other platform. It's also a good idea not to refer to the
classes in this bundle as "library" (i.e. passive code); make the native
code a service and properly track it from client bundles.

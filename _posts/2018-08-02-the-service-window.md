---
title: Keep Passing the Open Windows
layout: post
description:  "Mark Reinhold published the State of the Module System a few weeks ago as a kick off for the JSR 376 Expert Group. Since then, we've slowly started to do some discussions in this expert ..."
comments: true
---

# Keep Passing the Open Windows

In a recent thread on the [osgi-dev][8] list there was a question about the _service window_. In a dynamic environment like OSGi where services can be registered and unregistered anytime there are a number of race conditions. The key question was what to do when you do a calculation that takes a long time in a background thread but the service diseapred while you were at it. This is an extreme case where you want to call a service that in the mean has disappeared.

This article analyzes that problem in detail and shows a number of solution. This probably should be part of the classic [v2Archive OSGi enRoute App note][5] but it has been archived by the OSGi to [v2Archive OSGi enRoute web site][3]. This App note handles a lot of similar cases. There is an accompanying workspace [v2Archive OSGi enRoute osgi.enroute.examples.concurrency][7] workspace.

The key question to the given problem is: should it be solved in a 'pure' way or a 'pragmatic' way. The remainder goes through the different strategies you can follow.

## Pragmatic 

Pragmatic means there is a tiny chance you hit the window where you check if the MyService is unregistered and then use it. If you're really unlucky you just hit the unregistration after you checked it but before you can use it. It works when the unregistration of MyService is rare and the work is long. Yes, it can fail but so can anything so you should be prepared for it. 

Pragmatic works best as follows:

    @Component
    public class MyClass extends Thread {   
      @Reference MyService myService;
   
      @Activate void activate()        { start(); }
      @Deactivate void deactivate()    { interrupt(); }
   
      public void run() {
         while (!isInterrupted()) {
            try {
                MyResult result = doHardWork();
                if (!isInterrupted())
                    myService.setResult(result);
            } catch (Exception e) { /* TODO */ }
         }
      }
    }

Clearly there is a race condition. 

![Action Diagram Window](http://www.plantuml.com/plantuml/svg/RP2n2i8m48RtF4NST6WVe4Cj24M7Ka71EII71jjKxYwLlhsXMXghO-w3Z-zFGQoGVTk8QZW1zbQ3J79PNcGc4QwM6524LxXLmwvHH07epX6Zr_mcCo1WsKwU9LIQRQyOn7GAplCDGPa0nmoHfgdud69ekhr2y-pm_ezQEZW6HFzWCDlHyRl5ksXDN6LWsPNaiteIhpUBjk_D2EGRZeVD1PayrdMv4WKu4_xv1G00)


## Pure 

I once had a use case where we had whiteboard listeners that received events. The frequency and some not so good event listeners that took too much time in their callback. This created a quite long window where it could fail so it often did. For that use case I created a special highly optimized class that could delay the removal of the listener while it was being dispatched. To make it have absolutely minimal overhead was tricky. (I even made an Alloy model of it that found some design errors.) Anyway, sometimes you have pick one of the bad sides, this was one where delaying the deactivate was worth it.

So how would you make this 'purer' by delaying the deactivation until you stopped using it? Since the service is still supposed to be valid during deactivate we could make the setResult() and the deactivate() methods exclude each other. That is, we need to make sure that no interrupt can happen when we check for the isInterrupted() and call myService.setResult(). We could use heavy locks but synchronized works fine for me when you realize some of its caveats:

* Short blocks
* Ensure you cannot create deadlocks

So there must be an explicit contract that the MyService is not going to stay away for a long time nor call lots of other unknown code that could cause deadlocks. After all, we're blocking the deactivate() method which is very bad practice in general. So you will trade off one purity for another.

    @Component
    public class MyClass extends Thread {   
      @Reference MyService myService;
   
      @Activate void activate()             { start(); }
      @Deactivate synchronized void deactivate()    { interrupt(); }
   
      public void run() {
         while (!isInterrupted()) {
            try {
                MyResult result = doHardWork();
                synchronized(this) {
                    if (!isInterrupted()) {
                        myService.setResult(result);
                    }
                }
            } catch (Exception e) { /* TODO */ }
         }
      }
    }

This guarantees what you want … However (you knew this was coming!) there is a reason the service gets deactivated. Even though the _service_ is still valid at that point, there is a reason the _service object_ indicated its unwillingness to play. For example, if MyService was remoted then the connection might have been lost. In general, when you call a service you should be prepared that it fails. (That is why you should always take exceptions into account even if they're not checked.)

## Better API

The best solution is usually to turn the problem around. This clearly can only happen when you can influence the API so that is often not a choice. If you can, you can pass a Promise to the myService and calculate in the background. Clearly that means you keep churning doing the hard work. Unless the calculation is very expensive and the unregistration happens often, doing the calculation unnecessary should normally have no practical concerns. If it is, you might want to consider CompletableFuture instead of Promise since it has a cancel() method. (We rejected a cancel since it makes the Promise mutable, but admittedly it is useful. However, it has the same race issues as we discuss here.)

    @Component
    public class MyClass {
   
      @Reference MyService myService;
      @Reference PromiseFactory promiseFactory;

      @Activate void activate()             { 
        Promise<MyResult> result = promiseFactory.submit( this::doHardWork );
        myService.setResult( result );
      }
    }

This is an example where you see a very weird effect that I first noticed in the eighties during my first big OO design. At first you think the problem is now moved from MyClass to MyService? I think when you try to implement this that you find that the problem mostly _disappeared_. During one of the first large systems I designed I kept feeling we were kicking the hard problems down the road and we still run into a brick wall. However, one day we realized we were done. For some reason the hard problems were solved in the structure of the application and not in specific code. Weird. However, realizing this I often have to cry a bit when I realize how some designs are doing the opposite and make simple things complex :-(

## Multiple Results

If you have multiple results to deliver you might want to take a look at the [OSGi PushStream][1]. When I made the initial design for ASyncStreams (feels eons ago :-( ) that inspired the OSGi Push Stream specification  this was one of the use cases I had in mind. The Push Stream are intended to handle all the nasty cases and shield you from them. As a bonus, it actually works for multiple receivers as well. Push Streams provide a simple low cost backlink to handle the case where the MyService gets closed. Haven't looked at where Push Stream's ended up but as far as I know they should still be useful when your hard work delivers multiple results. Ah well, I wanted to take a look at it anyway since it has been released now. Let's see how that would look like:

    @Component
    public class ProviderImpl extends Thread {
    
        @Reference PushStreamProvider           psp;
        @Reference MyService                    myService;

        volatile SimplePushEventSource<MyResult>    dispatcher;
    
        @Activate void activate() throws Exception {
            dispatcher = psp.createSimpleEventSource(MyResult.class);
            myService.setResult(dispatcher);
            start();
        }
    
        @Deactivate void deactivate() {
            interrupt();
        }
    
        @Override
        public void run() {
            try {
                MyResult r = doHardWork();
                while (!isInterrupted()) {
                    dispatcher.publish(r);
                    r = doHardWork();
                }
            } finally {
                dispatcher.close();
            }
        }
    }

## Use of Executors

As a side note. I've been in systems where everybody was mucking around with ExecutorServices and it became a mess. In [v2Archive OSGi enRoute][3] I always provided an [Executor service][4] that is shared and does proper cleanup when the service getter goes away. (The [v2Archive OSGi enRoute Scheduler][6] was also very nice for this since it provides Cancelable Promises.) Executor Services created statically are horror in OSGi since they are completely oblivious of the OSGi dynamics. And in your case they are totally unnecessary. The only utility they provide to you is that they interrupt the threads. This is trivial to do when you create your own thread. (And messages about the expensiveness of threads are highly exaggerated.) Even if you use an Executor you can pass the thread.

    Deferred<Thread> deferred = new Deferred<>();   
    Promise<MyResult> promiseFactory.submit( () -> {
        deferred.resolve( Thread.currentThread() );

        while ( result == null && !Thread.currentThread().isInterrupted() {
                … do some hard work
                }
                return result;
    });

    // deactivate
    deferred.getPromise().getValue().interrupt();

In general, if you go this route, suggest you clearly separate the strategies from the code. I.e. make a separate class to capture the strategy of handling these things. Worst designs are where these are mixed.

## Disclaimer

Anyway, usually disclaimer: none of the code has been tested so use it at your own peril!

Enjoy ...

  Peter Kriens
  [@pkriens](https://twitter.com/pkriens)

[1]: https://osgi.org/specification/osgi.cmpn/7.0.0/util.pushstream.html
[2]: http://www.plantuml.com/plantuml/png/RP2n2i8m48RtF4NST6WVe4Cj24M7Ka71EII71jjKxYwLlhsXMXghO-w3Z-zFGQoGVTk8QZW1zbQ3J79PNcGc4QwM6524LxXLmwvHH07epX6Zr_mcCo1WsKwU9LIQRQyOn7GAplCDGPa0nmoHfgdud69ekhr2y-pm_ezQEZW6HFzWCDlHyRl5ksXDN6LWsPNaiteIhpUBjk_D2EGRZeVD1PayrdMv4WKu4_xv1G00
[3]: https://v2archive.enroute.osgi.org/
[4]: https://github.com/osgi/v2archive.osgi.enroute/tree/master/osgi.enroute.executor.simple.provider
[5]: https://v2archive.enroute.osgi.org/appnotes/concurrency.html 
[6]: https://github.com/osgi/v2archive.osgi.enroute/tree/master/osgi.enroute.scheduler.simple.provider
[7]: https://github.com/osgi/osgi.enroute.examples.concurrency
[8]: https://www.osgi.org/community/mail-lists/

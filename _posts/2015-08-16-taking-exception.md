---
layout: post
comments: true
title: Taking Exception
description: Did you ever look at how we as developers are handling our exceptions? Open source lets us see that we've developed an intriguing number of ways of handling ...
---

Did you ever look at how we as developers are handling our exceptions? Open source lets us see that we've developed an intriguing number of ways of handling exceptions. Let's take a look at the myriad ways developers handle their exceptions.

First the closeted C developer that was forced to use Java.

	  int main(String[] args, int argc) {
	    FileInputStream file_input_stream;
	    int first_char;
	    try {
	      if (argc != 0)
	        throw new IllegalArgumentException("Not enough arguments");
	    } catch (IllegalArgumentException illegal_argument) {
	      System.err.format("Exception: " + illegal_argument.getMessage());
	      return -1;
	    }
	    try {
	      file_input_stream = new FileInputStream(args[0]);
	    } catch (FileNotFoundException e) {
	      return ENOENT;
	    }
	    try {
	      first_char = file_input_stream.read();
	    } catch (IOException e) {
	      try {
	        file_input_stream.close();
	      } catch (IOException ee) {
	        return EIO;
	      }
	      return EIO;
	    }
	    if (first_char &gt; 0) {
	      System.out.format("first character is %c\n", first_char);
	      try {
	        file_input_stream.close();
	      } catch (IOException e) {
	        return EIO;
	      }
	    } else {
	      try {
	        file_input_stream.close();
	      } catch (IOException ee) {
	        return EIO;
	      }
	      return EEOF;
	    }
	    return EOK;
	  }

Then the testosterone driven developer that basically reasons that if the caller does not want its checked exceptions they better swallow Runtime Exceptions!
  
	public void main(String args[]) {
	    try (FileInputStream input = new FileInputStream(args[0]);) {
	      int c = input.read();
	      if (c &gt; 0)
	        System.out.format("first character is %c%n", c);
	    } catch (Exception e) {
	      throw new RuntimeException(e);
	    }
	  }

There are of course the persnickety developers that feel that since exceptions are good, more exception classes must be better. They wrap the exception in their own, better, exception, thereby creating a profound stack trace. Their variation looks like:

	  public void main(String args[]) throws MeTooException {
	    try (FileInputStream input = new FileInputStream(args[0]);) {
	      int c = input.read();
	      if (c &gt; 0)
	        System.out.format("first character is %c%n", c);
	    } catch (Exception e) {
	      throw new MeTooException(e);
	    }
	  }

And then we have the financial developer that figured out his productivity is measured by the lines of code he produces, regardless how mindless they are. They are especially vicious combined with the persnickety approach that wraps each exception in their own variation.

	  public void main(String args[]) throws MeTooException {
	    try (FileInputStream input = new FileInputStream(args[0]);) {
	      int c = input.read();
	      if (c &gt; 0)
	        System.out.format("first character is %c%n", c);
	    } catch (FileNotFoundException e) {
	      log("File not found Exception");
	    } catch (EOFException e) {
	      log("File EOF Exception");
	    } catch (ClosedChannelException e) {
	      log("Closed Channel Exception");
	    } catch (ConnectIOException e) {
	      log("Connect IO Exception");
	    } catch (FileSystemException e) {
	      log("File System Exception");
	    } catch (FileLockInterruptionException e) {
	      log("File Lock Interrupt Exception");
	    } catch (InterruptedIOException e) {
	      log("Interrupted IO Exception");
	    } catch (MalformedURLException e) {
	      log("Malformed URL Exception");
	    } catch (IIOException e) {
	      log("IIO Exception");
	    } catch (RemoteException e) {
	      log("Remote Exception");
	    } catch (ProtocolException e) {
	      log("Protocol Exception");
	    } catch (SocketException e) {
	      log("Socket Exception");
	    } catch (SSLException e) {
	      log("SSL Exception");
	    } catch (SyncFailedException e) {
	      log("Sync Failed Exception");
	    } catch (UnknownHostException e) {
	      log("Unknown Host Exception");
	    } catch (JarException e) {
	      log("Jar Exception");
	    } catch (ZipException e) {
	      log("Zip Exception");
	    } catch (IOException e) {
	      log("IO Exception");
	    }catch (SecurityException e) {
	      log("Security Exception");
	    }
	  }

Then we have the 'what checked exceptions?' developer that worked out how they can bypass the type system to throw a non-runtime exception without the caller knowing it:

	  public static void main(String args[]) {
	    try (FileInputStream input = new FileInputStream(args[0]);) {
	      int c = input.read();
	      if (c &gt; 0)
	        System.out.format("first character is %c%n", c);
	    } catch (Exception e) {
	      Throw.asUncheckedException(e);
	    }
	  }
	  public static class Throw {
	    public static void asUncheckedException(Throwable throwable) {
	      Throw. asUncheckedException0(throwable);
	    }
	    @SuppressWarnings("unchecked")
	    private static  void asUncheckedException0(Throwable throwable) throws E {
	      throw (E) throwable;
	    }
	  }

Fortunately we can all hate the ostrich developers that swallow exceptions. Any experienced Java developer knows what it means to trace a problem for hours only to find that some idiot had not reported an error. A better argument for licensing software professionals is hard to find.

	  public static void main(String args[]) {
	    try (FileInputStream input = new FileInputStream(args[0]);) {
	      int c = input.read();
	      if (c &gt; 0)
	        System.out.format("first character is %c%n", c);
	    } catch (Exception e) {}
	  }

And then we have the pragmatic developer that realizes that there is no difference between checked and runtime exceptions. Hated by its consumers that are still believing in the myth of checked exceptions:

	  public static void main(String args[]) throws Exception {
	    try (FileInputStream input = new FileInputStream(args[0]);) {
	      int c = input.read();
	      if (c &gt; 0)
	        System.out.format("first character is %c%n", c);
	    }
	  }

So in which camp am I? Well, you probably have guessed that I am in the pragmatic camp.  My reasoning is that checked exceptions do not exist, get over it. Bad Idea.

Let me explain why.

I am a firm believer in contract based design and OSGi is imho the best example of this model. In such a world a function call succeeds when the contract is obeyed by the consumer and the provider. However, in the real world there are cases where the contract cannot be fulfilled. Exceptions are for signalling this failure to the consumer. Maybe the input arguments are wrong, one of the downstream calls fails, or a disk goes haywire. The number of things that can go wrong are infinite so it is infeasible to figure out what to do about this failure except to ensure that the state of the current object remains correct.

In all most all cases if anything could be done, then the provider already should have done it. It is crucial to realize that exceptions are therefore by definition not part of the contract. For example, bnd does not see a change in the throws clause as a binary change.

When an exception happens, the consumer could try an alternative strategy but it must never try to understand the reason of the failure for this creates very brittle code. This is especially true in a component world like OSGi where the actual implementations on a call stack can vary. The function succeeds when no exception is thrown, and the function fails when contract could not be obeyed.

Any information in the exception is for the human user to figure out the root problem so that the software contracts can be adjusted to cover the exceptional case or some repair initiated. When an exception happens it is the root cause that the user needs to know. Wrapping exceptions obscures this root cause as we all realize when we see that the root happened 17 exceptions deep and our environment decided to only show 16.

Handling the checked exceptions creates a tight coupling between the consumer and provider for no reason since the consumer should treat all exceptions equal: the contract could not be obeyed, the cause for the consumer is irrelevant. The type, message, and other information of the exception is only intended for the end users to diagnose the problem.

Once you accept this way of thinking about exceptions you realize that checked exceptions were a really bad idea since they give the impression that the consumer should do something specific with them while the best thing is in all most all cases to forward the original exception to the function that is responsible for error handling on that thread.

I started throwing Exception on all my methods a long time ago. I am often resented for this because users of my code are often still under the illusion that checked exception have utility. So they feel forced to obscure there code in the myriad of ways described in this blog. Well, get over it, the emperor has no clothes.

Since the runtime does not distinguish between checked and unchecked exceptions Oracle could probably provide a compiler annotation that would disable the checking for checked exception. Would be a relieve to also get rid of this nonsensical throws Exception line in my code. To conclude, checked exceptions were a failed experiment. Maybe we should start accepting this.

Peter Kriens

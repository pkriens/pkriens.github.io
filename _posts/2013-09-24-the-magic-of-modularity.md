---
layout: post
title: The Magic of Modularity
description: Anybody that has done some computer classes over the last 30 years has learned about modularity ...
comments: true
---

# The Magic of Modularity

Anybody that has done some computer classes over the last 30 years has learned about
modularity and should know it is good. However, to describe why it is good is always 
a bit harder. Maybe it is not that hard to understand the benefits of encapsulation 
because we all have been in situations where we could not change something because 
it was exposed. However, for me the magic actually appears during design, when you 
pick the modules and decide about their responsibilities. This is reflected in the 
seminal paper of [David Parnas 1971][1] called "On the criteria to be used in decomposing systems into modules".

Last week I was designing a function for bnd and there I ran into an example that illustrated very nicely why the decomposition is so important. The problem was the communication to the remote repositories. Obviously, one uses a URL for this purpose since it is extremely well supported in Java, it supports many protocols, and in OSGi it can be easily extended by registering a Stream Handler service. However, security and other details often require some pre-processing of the connection request. For example, basic Http authentication requires a request header with the encoded user id and password. Anybody that has ever touched security standards knows this is a vast area that cannot be covered out of the box, it requires some plugin model. This was the reason we already had a very convenient URLConnector interface in bnd that could translate a URL into an Input Stream:

	   public interface URLConnector {
	      InputStream connect( URL url) throws Exception;
	   }

Even more convenient, there were already several implementations, one that disabled Https certificate verification and one for basic authentication. Always so nice when you find you can reuse something.

However, after starting to use this abstraction I found that I was repeating a lot of code in different URL Connector implementations. I first solved this problem with a base class, but then it required extra parameters to select which of the options should be used. And the basic design did not support output (you know you can even send a mail with just a URL?). So after some struggling I decided to change the design and leverage the URLConnection class instead. Though the common use for a URL is to call openStream(), you can actually first get a URLConnection, parameterize it, and the actually open the connection. So instead of a URLConnector interface I devised a URLConnectionHandler interface. This interface had a single method:

	   public interface URLConnectionHandler {
	      void handle( URLConnection connection) throws Exception;
	   }

Since this interface now specifies a transformation it can be called multiple times, unlike the URLConnector interface. This enabled me to write a number of tiny adapters that only did one thing and were therefore much simpler and actually more powerful. The user can now specify a number of  URLConnectionHandler for a matching URL. For example, Basic Authentication should in general not be used without HTTPS since it shows the user id and password in clear text. Instead of building this verification in the Basic Authentication plugin it can now just be selected by the user so that for another URL it can be used with a different combination. 

After porting the existing functionality of the URLConnector implementations I ended up with significantly less code and much more power., only because the structure was different. That is what I call the magic of modularity.

Peter Kriens


[1]: http://repository.cmu.edu/cgi/viewcontent.cgi?article=2979&context=compsci&sei-redir=1&referer=http%3A%2F%2Fscholar.google.com%2Fscholar_url%3Fhl%3Den%26q%3Dhttp%3A%2F%2Frepository.cmu.edu%2Fcgi%2Fviewcontent.cgi%253Farticle%253D2979%2526context%253Dcompsci%26sa%3DX%26scisig%3DAAGBfm3sRI3PAHzB0h_uEjgKo6Po-M7dXw%26oi%3Dscholarr#search=%22http%3A%2F%2Frepository.cmu.edu%2Fcgi%2Fviewcontent.cgi%3Farticle%3D2979%26context%3Dcompsci%22

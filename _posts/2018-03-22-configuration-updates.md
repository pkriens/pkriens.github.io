---
title : Configuration Updater
layout: default
---

## Properties Suck

Although I am often puzzled about some developer choices, there seems to be one 
thing that almost every developer agree on: properties where you need to maintain
the key as a constant string suck. Code like the following:

	public final static String MY_PROPERTY_KEY = "my.property.key"

	int getMyProperty( Map<String,Object> map) {
		Object value = map.get(MY_PROPERTY_KEY);
		if ( value == null)
			return -1;
		if ( value instanceof String) {
			return Integer.parseInt((String) value);

		BARF!

This style of programming is loud, ugly, and extremely error prone. When you have to work
with an API like this you feel dirty. As said, this is one of the sometimes few things
I agree with virtually every developer.

## Progress

When I took a year off in 2012 (!) to do JPM I added a facility to bnd so I would at least use
my configuration from methods defined on interfaces:

	// deprecated bnd model from pre 2012
	interface Config {
		int port( int deflt);
		String host( String deflt);
	}

	Config config;
	Socket s;

	@Activate
	void activate( Map<String,Object> map) {
		config= Converter.cnv( Config.class, map);
		s = new Socket( config.host("localhost"), config.port(8976));
	}

In this model, we use the method name as the property and the return type as the value type. The magic converter (which also became an OSGi specification in R7) handles the low level details of converting from whatever type is in the map to the (generic) return type of the method that acts as the property key.

Clearly, this is a huge improvement. The converter does not only create a proxy on the map,
it also type converts the variables in the configuration to requested type in the interface.
At the time, I also added annotations for Metatype support which could provide defaults and
options. (Although the data type could be an `enum` which is mostly the same idea.)

Then, after I returned to the OSGi Alliance I convinced the EG to adopt this style in
DS. 

	// Current DS model
	@interface Config {
		int port() default 8976;
		String host( String deflt) default "localhost";
	}

	Socket s;

	@Activate
	void activate( Config config) {
		s = new Socket( config.host(), config.port());
	}


I did not get full interfaces but annotation interfaces do provide 95% of the 
goodies. 

## Metatype & Web Console

At the same time in 2012 I added metatype support for these configuration interfaces
in bnd. If you _designated_ an interface from a `@Component` annotation then bnd would
create the appropriate metatype XML in your bundle. And then the magic happened ... When you
went to Web Console you could _edit_ your configuration from a very nice user interface. 
(Everything is relative, for the GUI challenged Java developer world it is _extremely nice_.)

We also adopted this feature in the OSGi and then added support for R6 in bnd. We're now
working on bnd 4.0.0 where the old style annotations that bnd pioneered will be gone. It
is good see how thet ended up in the spec.

## All Is Under Control, Except ...

Then there was this nagging question from the back of the room: 'How updating configurations?'.
The only answer I had was: 'Well, ehhh, use Web Console? Or, hmmm, use properties?'. Having
to revert to define propety keys as constant strings is of course a giant defeat. 

While working for SMA in Kassel I ran into this problem. There we've standardized _all_ configuration
to go through Configuration Admin. This implies that the GUI code of the product often had to
update the Configuration Admin service with new configurations. Clearly, this, eh, sucked.

## Back to Type Safety

Clearly we use method names as property keys. However, we would have to create _set_ methods on the
interfaces to be able to modify the confguration. Better, but it would require specifying the
same property name as a getter and setter and that is a pattern made popular by beans but that I 
rank only minutely better  than string property keys. And then the small detail of course that
annotations cannot have set methods ... Difficult.

So one day, probably after using Mockito, I realized that I could leverage the guaranteed 
calling order of Java. If I created a proxy on the interface I could record what method
was called. If I could then immediately afterwards provided a value, I could store that
value on the last called method's name. This is very similar to how you build up a mock
with Mockito and some other libraries. 

This is quite a complex sequence so let's (at least try to) elucidate it with a sequence diagram:

![Proxy](http://www.plantuml.com/plantuml/png/NOxB3i8W44Nt_Of9t41Y-G1IcoQkTUV29Q5ZOyA3mE3ZxwLIQtG3kPpBd1aIgKZPckRiCxGzb4k2XXqulCFUkyjrEeLH4R8QX3Og9VwfQmaBuA15YFxnP2kiG4BmaSfhZSklCeMAPJEpBwdwY9IZWovvYt1J9cE_-a0MJq9YFtWBtRnl3RpHRNzGGK8vHCZ4tZOn8HsLHSR_sWEwCLlp0W00)

This looks a tad complicated but in code it looks surprisingly natural:

   c = ...
   c.set( c.d().port(), 1024 );
   c.set( c.d().host(), "localhost" );
   
## Config Helper

I therefore created a _Config Helper_ that can update Configuration Admin programmatically
usin the configuration interfaces. 

    @Reference
    ConfigurationAdmin cm;
  
    void update() {
	    ConfigHelper<Config> ch = new ConfigHelper<>(Config.class, cm);
      ch.read( "com.example.pid" );
      ch.set( ch.d().port(), 3400);
      ch.set( ch.d().host(), "example.com");
      ch.update();
    }

Look ma! No property keys!

You can find the code at [Github][1]. If there is an open source project that wants to adopt it, let me know. If multiple people find this interesting I can also push it to Maven Central.

Enjoy!

  Peter Kriens
  [@pkriens](https://twitter.com/pkriens)
  
[1]: https://github.com/aQute-os/biz.aQute.osgi.util/tree/master/biz.aQute.osgi.configuration.util
		


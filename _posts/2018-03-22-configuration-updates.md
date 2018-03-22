---
title : Configuration Updater
layout: default
---
# Configuration Updater
## Properties Suck

Although I am often puzzled about some developer choices, almost every developer seems to agree that manipulating properties suck. That is, I've never met anybody that likes to write this kind of code:

	public final static String MY_PROPERTY_KEY = "my.property.key"

	int getMyProperty( Map<String,Object> map) {
		Object value = map.get(MY_PROPERTY_KEY);
		if ( value == null)
			return -1;
		if ( value instanceof String) {
			return Integer.parseInt((String) value);

		BARF!

This style of programming is loud, ugly, redundant, and extremely error prone. When you have to work
with an API like this you feel dirty. As said before, this is one of few consensus things in Java.

## Progress

When I took a year off in 2012 (!) to do JPM I added a facility to bnd define my _configuration schema_ in 
a normal Java interface:

	// now deprecated bnd model from pre 2012
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

We use the _method name_ as the property key and the return type as the _value type_. The 'magic' converter (which also became an OSGi specification in R7!) handles the low level details of converting from the value in the map to the (generic) return type. If the map holds a `Long[]`, the return type can be a `List<Byte>`. No sweat, all these conversions are handled completely transparent. Clearly, this is a huge improvement over constant string property keys. 

At the time, I also added annotations for Metatype support which could provide defaults and
options. (Although the data type could be an `enum` which is mostly the same idea.)

Then, after I returned to the OSGi Alliance I worked to convince the EG to adopt this style in
DS, this fortunately worked out. The annotation interface as configuration was introduced in R6.

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


I did not get my full interfaces but annotation interfaces do provide 95% of the 
goodies. So that is good enough. (And they have a nice way to specify defaults.) 

## Metatype & Web Console

When I developed the bnd DS annotations (2009??) I also added metatype support. 
If you _designated_ an interface from a `@Component` annotation then bnd would
create the appropriate metatype XML in your bundle. And then the magic happened ... When you
went to Web Console you could _edit_ your configuration from a very nice user interface. 
(Everything is relative, for the GUI challenged Java developer world it is _extremely nice_.)

We also adopted this feature in the OSGi R6 and then added support for this in bnd. We're now
working on bnd 4.0.0 where the old style annotations that bnd pioneered will be gone. An era gone by ...
Clearly, it is good see how much of that ended up in the OSGi specifications.

## All Is Under Control, Except ...

Then there was this nagging question from the back of the room: 'How about updating configurations?'.
The only answer I had was: 'Well, ehhh, use Web Console?'. Then they usually replied: 'We need to do
this programmatically!'. To which my sad reply then was: 'Hmmm, use properties?'. 

Having to revert to define property keys as constant strings is of course a giant defeat. 

While working for [SMA in Kassel](http://www.ennexos.com/en/) I ran into this problem head on. I had (rather
strongly) advised them to store _all_ configuration in Configuration Admin. Although Configuration Admin
clearly is not the best solution in _all_ cases, having one solution usually far outweighs the
micro improvements one can make with a dedicated tool. (This strategy has worked out extremely well.)

However, if you store everything in Configuration Admin then it is inevitable that many different
places need to update the Configuration Admin. The Web Console is extremely nice for developers but
clearly falls short for end users. It therefore falls on the the bundles to store their changed
configurations in Configuration Admin. Using property keys was clearly not a good idea.

## Back to Type Safety

We use _method names_ as property keys when we use Configuration interfaces. To support
updates, we would have to create _set_ methods on the
configuration interfaces. These set method could then modify the configuration. Much better than
property keys, but it would require specifying the same property name as a getter and setter method.
That is a pattern made popular by beans but that I rank it only minutely better than string property keys. 

And then the small detail of course that annotations cannot have set methods ... Difficult.

So one day, probably after having been inspired by Mockito, I realized that I could leverage the guaranteed 
calling order of Java. 

If I created a proxy on the interface I could record what method
was called. Then immediately afterwards, I could call a set method with a
value. The set method could use the last called method's name and store the 
new value under this name.. 

This is very similar to how you build up a mock
with Mockito and some other libraries. 

This is quite a complex sequence so let's (ok, try to) elucidate it with a sequence diagram:

![Proxy](http://www.plantuml.com/plantuml/png/NO_1YiCW54Nt-OeBtIWqVe2a8T1rPzT5bs9UGo5HqMVx-pKrpJ2pKUuxLuyEYKtalCpDpMUqFSgcON62enVEtjqVqpMCXadKeEniKfBVkjNOW8HLezX17Me47xbCQznEb1ku60uh-oLL7ObpTEYINmXFCsVgTnTqSIHYyGSVqQrlhK4sjkql9cYKHONCucDJ4_6FMKZ8V-s1t5X-_mO0)

This looks a tad complicated but in code it looks surprisingly natural:

   c = ...
   c.set( c.d().port(), 1024 );
   c.set( c.d().host(), "localhost" );
   
## Config Helper

Some time ago there was a [question on Stackoverflow](https://stackoverflow.com/questions/49238517/how-to-map-service-factory-pids-to-their-objectclassdefinition/49239698?noredirect=1#comment85508462_49239698) by someone who was struggling with this. I therefore created a _Config Helper_ class that can update Configuration Admin programmatically
using the configuration interfaces to ge the property names and types. 

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
		


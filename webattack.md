---
title: Web Attacks Intro
---

# Web Attacks

This model shows a store and provides a number of requests to modify the store. It then shows how 
to use the store with a good user `Alice` and attack it with a bad user `Eve`.

## Preamble

Order the Token and State sigs which will be used later. (The includes must come first.)
We also define Item and Token which are needed later but only used for their identity. We
require some of them to be there because otherwise you run into the really nasty problem
that any comprehension seems to succeed because it misses atoms for one of the variables.

```alloy
	module store
	open util/ordering[Token] as tk
	open util/ordering[State] as st

	some sig Item, Token {}
```


## Actions

We create a serial trace of actions on the store. We have the following actions.

```alloy
	enum Action { 
		INIT, 
		BUY, 
		LOGIN, 
		STUTTER 
	}
```
The STUTTER action is necessary to not block the trace. I.e. if there are no more items and 
everybody is logged in then there are no alternative actions so then stutter can fill the gap.

## Authentication

We use a simple userid to digest table. The `digest` macro calculates a digest. In this case
we use the same atom for ease of use but this should be a one-way hash function like the SHA-x
algorithm.

We add the credentials for Alice but no credentials for Eve. That is, Eve has no access to the 
store.

```alloy
	let digest[password] = password
	let authenticate[userid,password] = 
		userid->digest[password] in 
			("Alice" -> digest["Bob123"]) 
```

## State

We need to create a trace of actions. We maintain this state in, ehh, `State`. For convenience
this State maintains the state for both the browser (the cookies) and the server (the stock,
token generator, etc.).

Notice that the order is very relevant here because it defines how the sig is displayed in the
table view. You should try to create 'sentences' with the order. For example, `Eve BUY` 

It is important to see that State is a trace but that only the trace methods 
`login`, `buy`, and `stutter` can constrain this trace.

It is important to realize that the cookies are _shared state_. This means that the browser is free 
to ignore or violete the contract of cookies. We can therefore not create any facts that rely in the 
cookies.

```alloy
	sig State {

		browser		: lone Browser,
		action		: Action,
		bought		: lone Item,

		// Reflects the browser state

		cookies		: Browser -> Token,

		// Reflects the server state

		stock		: set Item,
		cart		: Token -> (Item+String),
		token		: lone Token,
		nextToken	: Token,
	}
```
## Login

The first trace method is login. A browser gives us a userid and a password. We 
must authenticate these credentials. If the login is successful we set a cookie
with a _token_. This token is a capability, it provides the browser then with
the capability to buy items.

The update of the state is made conditional. The reason is that it allows us to 
verify the conditional part (checking if the user is not logged in yet
and we can authenticate this user using the password as the credential) without 
requiring them to be recorded in a trace. This is **extremely** useful in the
evaluator. For example, in the evaluator you can verify a login with:

	login[Eve,"Alice","Bob123",none,none]

This will then only evaluate the conditional and not the trace. This is a
great way to test these trace predicates. (Note, in TLA+ I understand they
always separate these parts.)

We now fail the login if the user is already logged in. It might be interesting
to succeed a failed attempt due to lack of proper credentials. This would then
record the attack in the trace.

We do one bit of a hack. In the cart we record the user id. This is twofold. First
it records the name of the user of that cart, second it creates at least one entry in
the cart. (Never realized you could hack in models.)

```alloy

	pred login[ b : Browser, userid, password: String, s, s' : lone State ] {

		no s.cart.userid
		authenticate[ userid,password ] 

		s != s' implies {

			s'.action = LOGIN
			s'.nextToken = s.nextToken.next
			s'.stock = s.stock
			s'.cart = s.cart + (s.nextToken->userid)
			s'.browser = b
			s'.token = s.nextToken
			s'.bought = none

			s'.cookies = s.cookies + (b->s.nextToken)
		}
	}
```

## Buy

After login the browser has a cookie with a token. We use this token to record
the sale in the corresponding cart.

```alloy

	pred buy[ b : Browser, tkn : Token, item : Item, s, s' : State ] {

		some item
		item in s.stock 

		one tkn
		some s.cart[tkn]

		s != s' implies {

			s'.action = BUY
			s'.nextToken = s.nextToken
			s'.stock = s.stock-item
			s'.cart = s.cart + (tkn -> item)
			s'.browser = b
			s'.token = tkn
			s'.bought = item
	
			s'.cookies = s.cookies
		}
	}
```

## Stutter

A stutter action is there to fill gaps. If the trace cannot make progress then it can always
provide a stutter step. They are kind of annoying because a trace with just stutters is
then a perfectly valid solution. You have to filter out those solutions with your `run` command.
For `check` commands they are generally irrelevant.

```alloy

	pred stutter[s, s' : State ] {

		s'.action = STUTTER
		s'.nextToken = s.nextToken
		s'.stock = s.stock
		s'.cart = s.cart
		s'.browser = none
		s'.token = none
		s'.bought = none

		s'.cookies = s.cookies
	}		

```

## The Clients

We're now ready to define the client side. Our model is that we have a _Browser_, or officially called the _User Agent_. 

We're cheating a bit because we do not record the cookies in the browser, we relay on the shared state 
to store the cookies. (This is dangerous because it is now easy to make facts that assume the server knows 
about the browser.)

We are also definining two users: Alice and Eve. Alice is the good girl and gets a password. Eve is evil
and we do not constrain her use of credentials. In practice, this means that Alloy will use all
possible credentials for Eve.

```alloy
	abstract sig Browser {
		userid : String,
		password : String
	}

	one sig Alice extends Browser {} {
		userid = "Alice"
		password = "Bob123"
	}
	one sig Eve extends Browser {}
```

### Attack 

Evil Eve will attack the store by faking a token. She could for example listen to a non-encrypted session
from Alice and get the token from there.

We verify this by just trying _all_ tokens.
```alloy
	pred Browser.attack[s,s' : State ] {
		some token : Token, item : Item | 
			buy[this,token,item,s,s']
	}
```
## Trace
We now create a trace of every combination of all possible allowed actions. An allowed
action is an action that can create a transition between two subsequent states.

That is, each action predicate is used to constrain State-n -> State-n+1. 

```alloy
	fact {

		st/first.nextToken = tk/first
		st/first.stock = Item
		no st/first.bought
		no st/first.cart
		st/first.action = INIT

		no st/first.browser
		no st/first.cookies


		all s' : State - first, s : s'.prev {
			some b : Browser, item : Item {
					login[b, b.userid, b.password, s, s']
				or 
					buy[  b, s.cookies[b], item, s, s' ]
				or
					Eve.attack[s,s']
				or
					stutter[s,s']
			}
		}
	}
```

## Checking 

We do not want Eve to be able to buy anything, only Alice's credentials are recorded
in the password database.

So we can check that Eve can never buy anything:

```alloy
	check { no s : State | s.browser = Eve and s.action = BUY } for 4
```

Interesting! This gives us the following output.

It is clear that for State¹ Eve logins but she is maliciously using the credentials of 
Alice! Look at the cart. Token⁰ is associated with "Alice".

	┌──────────┬───────┬──────┬──────┬───────────┬─────┬──────────────┬──────┬─────────┐
	│this/State│browser│action│bought│cookies    │stock│cart          │token │nextToken│
	├──────────┼───────┼──────┼──────┼───────────┼─────┼──────────────┼──────┼─────────┤
	│State⁰    │       │INIT⁰ │      │           │Item⁰│              │      │Token⁰   │
	├──────────┼───────┼──────┼──────┼────┬──────┼─────┼──────┬───────┼──────┼─────────┤
	│State¹    │Eve⁰   │LOGIN⁰│      │Eve⁰│Token⁰│Item⁰│Token⁰│"Alice"│Token⁰│Token¹   │
	├──────────┼───────┼──────┼──────┼────┼──────┼─────┼──────┼───────┼──────┼─────────┤
	│State²    │Eve⁰   │BUY⁰  │Item⁰ │Eve⁰│Token⁰│     │Token⁰│"Alice"│Token⁰│Token¹   │
	│          ├───────┼──────┼──────┼────┴──────┤     │      ├───────┼──────┼─────────┤
	│          │       │      │      │           │     │      │Item⁰  │      │         │
	└──────────┴───────┴──────┴──────┴───────────┴─────┴──────┴───────┴──────┴─────────┘

You can see this also in the Browser table. We see that Eve has stolen the credentials
of Alice.
	
	┌────────────┬───────┬────────┐
	│this/Browser│userid │password│
	├────────────┼───────┼────────┤
	│Alice⁰      │"Alice"│"Bob123"│
	├────────────┼───────┼────────┤
	│Eve⁰        │"Alice"│"Bob123"│
	└────────────┴───────┴────────┘

## Attacks

This is a bit of a conumdrum but it shows the power of Alloy. This immediately shows how 
fragile passwords are. In the real world we demand from the users that they keep their 
passwords secret. We therefore record this (stupid!) assumption in a fact.


```alloy

	fact NoSharedPassword {
		//all disj b1, b2 : Browser | b1.userid = b2.userid => b1.password != b2.password
	}
```
Uncomment the previous fact and the run the EveBuying command again. This gives the following output

	┌──────────┬───────┬──────┬──────┬─────────────┬─────┬──────────────┬──────┬─────────┐
	│this/State│browser│action│bought│cookies      │stock│cart          │token │nextToken│
	├──────────┼───────┼──────┼──────┼─────────────┼─────┼──────────────┼──────┼─────────┤
	│State⁰    │       │INIT⁰ │      │             │Item⁰│              │      │Token⁰   │
	├──────────┼───────┼──────┼──────┼──────┬──────┼─────┼──────┬───────┼──────┼─────────┤
	│State¹    │Alice⁰ │LOGIN⁰│      │Alice⁰│Token⁰│Item⁰│Token⁰│"Alice"│Token⁰│Token¹   │
	├──────────┼───────┼──────┼──────┼──────┼──────┼─────┼──────┼───────┼──────┼─────────┤
	│State²    │Eve⁰   │BUY⁰  │Item⁰ │Alice⁰│Token⁰│     │Token⁰│"Alice"│Token⁰│Token¹   │
	│          ├───────┼──────┼──────┼──────┴──────┤     │      ├───────┼──────┼─────────┤
	│          │       │      │      │             │     │      │Item⁰  │      │         │
	└──────────┴───────┴──────┴──────┴─────────────┴─────┴──────┴───────┴──────┴─────────┘

Since Eve can no longer succeed in using Alice's credentials, it tries to steal the token that the
server handed to Alice's browser. It can do this by sniffing in on a wireless network at
Starbucks when Alice uses normal HTTP, not encrypted HTTPS.

It is interesting to see that the item ends up in Alice's cart. 

So we need to record a fact that our model can assume that in the real world the cookies are
protected using HTTPS and cannot be guessed. In our model that means we can 'trust' the
cookies to be protected. (Another indication of the fragility of the web.)

Again uncomment for making it active.

```alloy
	fact HTTPS {
		//all s : State | one s.token implies s.token = s.cookies[s.browser]
	}
```

Instead of doing a run, we now want to make sure Eve cannot buy anything ever ... So if you
run the check again it should fail to find a counter example.

So now we know the web is safe! #not





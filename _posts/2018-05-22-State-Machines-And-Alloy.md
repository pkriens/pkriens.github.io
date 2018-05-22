---
layout: post
title: State Machines and Alloy
description: A gentle introduction to state machines and Alloy
comments: true
---

This post continues the quest to get Java developers using [Alloy], a tool that, in the right
hands, is a fantastic way to explore software and hardware designs. Today we will explore a 
_state machine_. I ran into a state machine problem at a customer and used Alloy to debug it
before I committed it to Java code. This blog is because it could be useful to share this experience. 
It probably would help if you read the [previous post][1] about Alloy.

## About State Machines

A finite-state machine (FSM) is a _mathematical model_ of a computation. It is an abstract machine 
that can be in exactly one of a finite number of _states_ at any given time. The FSM can change from 
one state to another in response to some external _event_. The change from one state to another is 
called a _transition_. An FSM is defined by its initial state, and a table that specifies 
the conditions for the transitions. 

## A Flip-Flop

Probably the simplest FSM is a _flip flop_. A flip flop is a circuit that reverses its output when
the clock goes from low to high. The  state of the flip-flop is either ON or OFF.The edge of 
the clock is the _event_, let's call it CLOCK. To make the problem a tad more interesting we also 
add a RESET event that always forces the state to OFF. 

```alloy
open util/ordering[Trace]

enum Event { CLOCK, RESET }
enum State { ON, OFF }
```

## Transitions

We now can define the table that constraints the transitions. In Alloy, such a table is called a
_relation_. It consists of a set of tuples. For the flip flop we need the following columns in
this table:

* `state` – The state the row applies to
* `event` – The event
* `next` – The next state

We define this table in a function in Alloy:
```alloy
fun transitions : State -> Event -> State {
	ON	->	CLOCK	->	OFF
+	OFF	->	CLOCK	->	ON
+	ON	->	RESET	->	OFF
+	OFF	->	RESET	->	OFF
}
```

Or as a table:

	┌────┬──────┬────┐
	│OFF⁰│CLOCK⁰│ON⁰ │
	│    ├──────┼────┤
	│    │RESET⁰│OFF⁰│
	├────┼──────┼────┤
	│ON⁰ │CLOCK⁰│OFF⁰│
	│    ├──────┼────┤
	│    │RESET⁰│OFF⁰│
	└────┴──────┴────┘

## Verification

Now we get to the interesting part! Clearly, a flip flop changes over _time_. How do we explore this time aspect? 
In Alloy, we can explore time aspects by creating a _trace_. A trace is basically a table (relation) where each
row represents a moment in time. In generally, each row represents a _step_ and rows before other rows were earlier in 
time. Each step is generally an atomic step in a (concurrent) algorithm. That is, a trace looks like:

	┌──────────┬─────┬──────┐
	│this/Trace│state│event │
	├──────────┼─────┼──────┤
	│Trace⁰    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace¹    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace²    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace³    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁴    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁵    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁶    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁷    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁸    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁹    │OFF⁰ │CLOCK⁰│
	└──────────┴─────┴──────┘

So let's define the data for the trace.

```alloy
sig Trace {
	state	: State,
	event	: Event
}
```

Notice that at the start we made Trace `sig` objects _ordered_. That is, there is a _first_ and _last_ Trace 
as well as that all Trace atoms have a `next` and `prev`. As an aside, this ordering is internally maintained
as a table:

	┌──────┬──────┐
	│Trace⁰│Trace¹│
	├──────┼──────┤
	│Trace¹│Trace²│
	├──────┼──────┤
	│Trace²│Trace³│
	├──────┼──────┤
	│Trace³│Trace⁴│
	├──────┼──────┤
	│Trace⁴│Trace⁵│
	├──────┼──────┤
	│Trace⁵│Trace⁶│
	├──────┼──────┤
	│Trace⁶│Trace⁷│
	├──────┼──────┤
	│Trace⁷│Trace⁸│
	├──────┼──────┤
	│Trace⁸│Trace⁹│
	└──────┴──────┘

## Magic

The hardest part to get now is that Alloy is a bit like a quantum computer, it looks like it has the superposition of _all_
possible values. We can ask Alloy for example how one of the possible trace table looks like without any constraints
defined on it:

```alloy
 run {} for 10
```
	┌──────────┬─────┬──────┐
	│this/Trace│state│event │
	├──────────┼─────┼──────┤
	│Trace⁰    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace¹    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace²    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace³    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁴    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁵    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁶    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁷    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁸    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁹    │OFF⁰ │CLOCK⁰│
	└──────────┴─────┴──────┘

This just one of the 4096 possible trace tables. (#state * #event)^10. This clearly is a tiny example, the state table that 
inspired this blog had 14 states, 7 events, and I tried 40 steps. The number of state tables is about as high as the 
number of particles in the universe: 10^80.

Our task is therefore not to create specific tables (all possible tables already exist in Alloy's model), our task 
is instead to _carve out_  the tables that should **not** be part of our solution.

In this case, we're only interested in traces where each step to the next Trace is constrained by the `transitions` we
defined earlier.

In Alloy we can define such a constraint in a _predicate_. If we then ask for an _instance_ of the model where that
predicate is true, we should see a trace that nicely reverses the flip-flop state at each CLOCK and properly handles 
RESET events.

Translating this to Alloy requires us to constrain the changes between 2 subsequent trace rows. Let's call the first
trace row `t` and the next row `t'`. This is a common practice in mathematics and formal models.

Using `t` and `t'` we can limit the allowed transitions of the state from `t` to `t'`. I.e. we want the `state` in
the next row to be constrained by the `transitions` table.

```alloy
pred trace {
	all t : Trace-last, t' : t.next {
		t'.state = transitions[t.state][t.event]
	}
}
```
We can now ask Alloy for an instance:
 
```alloy
 run trace for 10
```
	┌──────────┬─────┬──────┐
	│this/Trace│state│event │
	├──────────┼─────┼──────┤
	│Trace⁰    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace¹    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace²    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace³    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁴    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁵    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁶    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁷    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁸    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁹    │OFF⁰ │CLOCK⁰│
	└──────────┴─────┴──────┘

In this case the first state is `OFF`. Are there also solutions where the first state is `ON`? We can ask
Alloy for such a solution the following way:

```alloy
run {
	trace
	first.state = ON
} for 10
```
And this works fine:
	
	┌──────────┬─────┬──────┐
	│this/Trace│state│event │
	├──────────┼─────┼──────┤
	│Trace⁰    │ON⁰  │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace¹    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace²    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace³    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁴    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁵    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁶    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁷    │OFF⁰ │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁸    │ON⁰  │CLOCK⁰│
	├──────────┼─────┼──────┤
	│Trace⁹    │OFF⁰ │CLOCK⁰│
	└──────────┴─────┴──────┘


## Querying

Since we have a trace now we can ask for specific instances. Note that so far we've seen instances of the model but
that was only a minute part of the possible instances. For example, could we have a trace where the state would 
always be OFF?

```alloy
run AlwaysOff {
	trace
	first.state = OFF
	all t : Trace | t.state = OFF
} for 10 expect 1
```

An instance of this is:

	┌──────────┬─────┬──────┐
	│this/Trace│state│event │
	├──────────┼─────┼──────┤
	│Trace⁰    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace¹    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace²    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace³    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace⁴    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace⁵    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace⁶    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace⁷    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace⁸    │OFF⁰ │RESET⁰│
	├──────────┼─────┼──────┤
	│Trace⁹    │OFF⁰ │CLOCK⁰│
	└──────────┴─────┴──────┘

Could we also get the reverse, a trace with only ON?

```alloy
run AlwaysOn {
	trace
	first.state = ON
	all t : Trace | t.state = ON
} for 10 expect 0
```

And this indeed does not provide us with an instance. 

## Conclusion

Alloy is an odd beast in the software development tooling landscape since it has no counterpart, it 
is genuinly something new. It is excellent in stating quite exactly what you mean. It is perfect that
it than often shows you did not understand the problem yet. Clearly for state machines it is 
an impressive tool. However, what I find most is that I use it to _explore_ software designs. Alloy
is a bit like editor that allows you to play with the _essence_ of a system.

Ah well, let me know if you this was interesting for you. I could write up the actual larger state
machine I developed (and found quite a few errors in the transitions table with using Alloy).

Peter Kriens  ([@pkriens])



[Alloy]: http://alloytools.org
[1]: http://aqute.biz/2017/07/15/Alloy.html
[@pkriens]: https://twitter.com/pkriens

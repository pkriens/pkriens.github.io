---

---

## Dining Philosophers Problem

In computer science, the dining philosophers problem is an example problem often used 
in concurrent algorithm design to illustrate synchronization issues and techniques for 
resolving them.

It was originally formulated in 1965 by Edsger Dijkstra as a student exam exercise, 
presented in terms of computers competing for access to tape drive peripherals. Soon 
after, Tony Hoare gave the problem its present formulation.[1][2][3]

## Problem statement

Five silent philosophers sit at a round table with bowls of spaghetti. Forks are 
placed  between each pair of adjacent philosophers.

Each philosopher must alternately think and eat. However, a philosopher can only 
eat spaghetti when they have both left and right forks. Each fork can be held by 
only one philosopher and so a philosopher can use the fork only if it is not 
being used by another philosopher. After an individual philosopher finishes eating, 
they need to put down both forks so that the forks become available to others. A 
philosopher can take the fork on their right or the one on their left as they 
become available, but cannot start eating before getting both forks.

Eating is not limited by the remaining amounts of spaghetti or stomach space; 
an infinite supply and an infinite demand are assumed.

The problem is how to design a discipline of behavior (a concurrent algorithm) 
such that no philosopher will starve; i.e., each can forever continue to alternate 
between eating and thinking, assuming that no philosopher can know when others may 
want to eat or think.

![Illustration of the Dining Philosophers problem][https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/An_illustration_of_the_dining_philosophers_problem.png/220px-An_illustration_of_the_dining_philosophers_problem.png]


## Alloy Model

We will now create an Alloy model around this problem statement. 

First we'll create a _Table_. This Table has a setting of Philosophers and Forks. 
The `setting` relation maintains which Philosopher has picked up which fork.  For
brevity we use _P_ for Philosophers. 

The line `open util/ordering[Table]` orders all possible Table atoms, we will use this
later when we create a trace.

```alloy
	open util/ordering[Table]
	
	sig Table {
		setting 	: P -> Fork
	}

	sig Fork {}
```



Each Philosopher has a neighbour _next_. We define a left and a right fork, where 
the right fork of a Philosopher is the left fork of its next neighbour.

![UML](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuGf9JCf9LL0gJYqfoSnBLrBGrLLGSCiloiOg4S0LeA2WL9IPdb425W0h10dbfAOXYJYavgK0pGO0)


```alloy
	sig P {
		next			: P,
		left, right 	: Fork
	} {
		right = next.@left
	}
```

Currently the Philosophers are not yet nicely seated on a round table. To enforce 
this, we need to make sure that they are placed in a _ring_. We can define this
by making sure that every Philosopher can see the while group in the `next` field
when we traverse this transitively. The transitive operator is `^`.

To make it more readable, we create a macro that defines this 'ringness' aspect. Although
it is only used once, it makes for easier to read specs.

```alloy
	let ring[group] = all member : group | member.^next = group

```

We also must ensure that Philosophers all have their own fork. We ensure this
by forcing the left and right relations _bijections_. That is, each Philosopher
has its own Fork. (We ensure that both `left` and `right` are bijections but we actually 
only have to ensure one since this will then automatically enforce the other. However,
for readability it is clearer to point out they are both bijections.

The `bijective` macro is defined at the end of this specification.

We can then combine these facts in an Alloy `fact`:

```alloy
	fact Ring {
		ring[P]
		bijective[left] and bijective[right]
	}
```

## Philosopher Actions

We're interested to see any _deadlocks_. We therefore define a number of actions. 

* **take** – A Philosopher takes one fork if a fork is available.
* **eat** – A Philosopher eats if it has two forks, it then puts the forks down.
* **wait** – Otherwise the Philosopher waits.

For each action, we define a macro that updates the `setting` in a Table based on 
a previous Table. I.e. we use the Table as a state that we trace. (This is the reason we 
ordered the Table's.) The `table` is the previous table and `table'` is the next table.

Each macro starts with a precondition. If this is true, it updates the next table using
a utility macro.

```alloy
	let take[ philosopher, fork, table, table'] {
		no table.setting.fork
		table'.update[ table.setting + philosopher -> fork ]
	}
	
	let eat[ philosopher, table,  table' ] {
		let forks = table.setting[philosopher] {
			# forks = 2
			table'.update[ table.setting - philosopher->forks ]
		}
	}
```

For the `wait` method we need some extra thinking. If the wait is a valid step then
we cannot detect deadlock. Deadlock is really when no Philosopher can make either eat
or take a fork. We therefore write the wait function specially so that we 
can assert later that there is at least one valid step for at least one Philosopher
which is not wait. We make that distinction by passing either the next table or none.
The wait macro only works when we pass next Table.

```alloy
	let wait[p,table,tableOrNone'] = {
		one tableOrNone'
		tableOrNone'.setting = table.setting
	}

	let update[table',settings'] = no table' or table'.setting=settings'
```

We now create a `step` function that reflects the steps that a Philosopher can take
at any moment in time.

```alloy
pred step[ philosopher : P, table : Table, table' : lone Table ] {
		philosopher.take[ philosopher.left, 	table, table' ]
	or 	philosopher.take[ philosopher.right, 	table, table' ]
	or	philosopher.eat[ 			table, table' ]
	or  philosopher.wait[				table, table' ]

}
```

We now get to the heart of the model, the trace. A trace is a fact that takes an
ordered state (Table in our case) and ensures there is a defined initial state
and only modifies the state according to our action macros.

In this case, we clear the first table setting. This means no Philosopher holds
a fork. We then iterate over the ordered tables and ask each Philosopher to make
a step. At any moment in time (well for each Table), at least one Philosopher 
should be able to make some progress.

In the trace we always pass a next Table so a valid trace is only Philosophers 
waiting.

```alloy
	fact trace {
	
		no first.setting
	
		all table : Table - last | 
			some p : P | p.step[ table, table.next ]
	}
```


## Running

We can now run the model for 4 Philosophers. 

```alloy
	run { #P = 4 } for 4
```

## Liveliness

We also want to see if when the deadlock happens. This happens when no Philosopher
can do a step excluding the `wait` step.

```alloy
	assert Liveliness {
		no table : Table | no philosopher : P | philosopher.step[table,none]
	}
	check Liveliness for 5 but exactly 4 P, 4 Fork, 4 int
```

## Helper Macros

And a few helper macros

```alloy
	let bijective[relation] = ( all d,r : univ | d.relation = r <=> relation.r = d )
	let domain[ relation ] 	= relation.univ
	let range[  relation ] 	= univ.relation
```


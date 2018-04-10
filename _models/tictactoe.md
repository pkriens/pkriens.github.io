---
comment: You can run this whole markdown text in Alloy 5 Beta
---

# TIC-TAC-TOE

We design this game around a _Board_. The Board is the state and we will use _game rules_ encoded in predicates to
constrain the transitions to the next board.

## Setup

Setup the game by defining the board size, the board and the players. The Board has a relative large number
of fields because that makes the trace output nice to read.

```alloy

	open util/ordering[Board]
	
	let N = 0+1+2
	let highest 	= 	max[N]


	
	sig Board {
		cells : N -> N -> Cell,
		move: Cell,
		to  : N->N,
		won : Cell
	}
	
	enum Cell { _, X, O }
```

## Winning

The game is won when there is a row, a colum, or a diagonal that holds the same player. We can encode this as follows:

```alloy

	let rightdiag 	= 	{ r,c : N | r = c }
	let leftdiag 	= 	{ r,c : N | c = highest.minus[r] }

	pred won[b,b':Board ] {
		some token : X + O {
			let positions = b.cells.token {
		
					some row    : N | N = row.positions 
				or 	some column : N | N = positions.column 
				or	rightdiag in positions
				or	leftdiag in positions
		
				b'.won = token
			}
		}
	}


```

##  Finished

The game is finished when a player won or there are no more free places.

```alloy

	pred finished[ b,b' : Board ] {
		not won[b,b'] implies {
			b'.won = _
			_ not in b'.cells[N][N]
		}
		b'.cells = b.cells
		b'.move = _
		b'.to = none -> none
	}
	
```

## Play

Plays should alternate between the players. That is why we keep the player in the previous board's `move` field
and check it is not  us. We then constrain the board to have an empty position replaced with the player's
token.

```alloy

	pred play[b, b' : Board ] {
		b'.won=_
		some token : X+O {
			b.move != token
			b'.move = token
			some row,col : N {
				b.cells[row][col] = _
				b'.cells = b.cells - row->col->_ + row->col->token
				b'.to = row->col
			}
		}
	}
```

## Trace

Then the only thing remaining is to setup the first board and ensure the game (the trace of _Boards_) is
played according to the rules.
	
```alloy

	fact trace {
	
		first.move = _
		first.won = _
		first.cells = N->N->_
	
		all b' : Board - first, b  : b'.prev {
			not finished[b,b'] => play[b,b']
		}
	}
```

## Run

With the _run_ we can look for certain types of solutions. In this example we try to find a game where O
wins with a righ diagonal ...

	
```alloy
	
	run { some b : Board | rightdiag in b.cells.(O) } for 11 but 3 int

```

This provides the following output in Alloy 5 Table view (table is reordered from beta 5 because it was lexically 
in that release. I.e. Board$10 ended up after Board$1):

	┌──────────┬──────┬────┬───┬───┐
	│this/Board│cells │move│to │won│
	├──────────┼─┬─┬──┼────┼───┼───┤
	│Board⁰    │0│0│_⁰│_⁰  │   │_⁰ │
	│          │ ├─┼──┼────┤   ├───┤
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board¹    │0│0│_⁰│X⁰  │2│1│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board²    │0│0│_⁰│O⁰  │1│2│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board³    │0│0│_⁰│X⁰  │0│1│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board⁴    │0│0│O⁰│O⁰  │0│0│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board⁵    │0│0│O⁰│X⁰  │2│0│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board⁶    │0│0│O⁰│O⁰  │1│1│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│_⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│O⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board⁷    │0│0│O⁰│X⁰  │1│0│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│O⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼─┬─┼───┤
	│Board⁸    │0│0│O⁰│O⁰  │2│2│_⁰ │
	│          │ ├─┼──┼────┼─┴─┼───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│O⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼───┼───┤
	│Board⁹    │0│0│O⁰│_⁰  │   │O⁰ │
	│          │ ├─┼──┼────┤   ├───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│O⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	├──────────┼─┼─┼──┼────┼───┼───┤
	│Board¹⁰   │0│0│O⁰│_⁰  │   │O⁰ │
	│          │ ├─┼──┼────┤   ├───┤
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│_⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │1│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│O⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	│          ├─┼─┼──┤    │   │   │
	│          │2│0│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │1│X⁰│    │   │   │
	│          │ ├─┼──┤    │   │   │
	│          │ │2│O⁰│    │   │   │
	└──────────┴─┴─┴──┴────┴───┴───┘

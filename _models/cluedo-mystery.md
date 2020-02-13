---
author: Peter Kriens
title: A Cluedo like murder mystery
layout: post
description: Shows how to make a readable spec
---

This is a simple murder mystery. Mainly interesting because it is
a demonstration how to make a spec readable by trying to stay very 
close to the original specification.

_Six corpses were found in different rooms of the Tudor Manor_
```alloy
let corpses = 6
```
The suspects are Colonel Moutarde, Mademoiselle Rose, Mme Pervenche, Prof. Violet, 
Mme Leblanc, Dr. Olive. 
```alloy
enum Suspect { Moutarde, Rose, Pervenche, Violet, LeBlanc, Olive }
```
The weapons are:
```alloy
enum Weapon { Candlestick, Dagger, Wrench, Revolver, Rope, Baton }
```
We assume all weapons are used once since we have 6 corpses.

There is a plan of the castle. We have the following rooms and we add an adjancency map.
```alloy
enum Room { Kitchen, GSalon, PSalon, Diner, Cellar, 
	Office, Veranda, Hall, Library, Studio }

let ANY = univ

let adjacent = 
	Kitchen -> GSalon
+	Kitchen -> Diner
+	Diner 	-> Veranda
+	Diner	-> Cellar
+	Diner	-> Kitchen
+	Veranda	-> Diner
+	Veranda	-> Hall
+	GSalon	-> Kitchen
+	GSalon	-> Cellar
+	GSalon	-> PSalon
+	Cellar	-> Diner
+	Cellar	-> GSalon
+	Cellar	-> Hall
+	Cellar	-> Office
+	Hall	-> Veranda
+	Hall	-> Cellar
+	Hall	-> Library
+	Hall	-> Studio
+	PSalon	-> GSalon
+	PSalon	-> Office
+	Office	-> PSalon
+	Office	-> Cellar
+	Office	-> Library
+	Library	-> Office
+	Library	-> Hall
+	Library	-> Studio
+	Studio	-> Library
+	Studio	-> Hall

run testreverse {
	adjacent = ~adjacent -- must be reflexive
}

```
We need the sex of the suspects. However, today a Prof. Violet could clearly be female but the original 
mystery is supposed to play in the nineteenth century so we assume the chances are they professionals
are male.
```alloy
let men = Moutarde +Violet+Olive
let women = Suspect - men
```

We maintain the solution in a singleton. We record in the scene the relation of the suspect, 
the weapon, and the room.
```alloy
one sig Solution {
	scene : Suspect -> Weapon -> Room
} {

	# scene = corpses	      -- assuming all suspects use one weapon to kill one person
	scene.univ.univ = Suspect
	univ.scene.univ = Weapon
	# room[ANY] = corpses -- no double double occupancy!

	-- The suspects made the following statements, proven after 
	-- investigation:

	-- Miss Rose: I swear I saw Mrs. Pervenche pass by with a 
	-- baton earlier. 
	testimony[Pervenche,Baton,ANY]

	-- Ms. Pervenche: The rope looks like the tiebacks used to 
	-- tie the curtains of the large living room.

	testimony[ANY,Rope,GSalon]

	-- And I saw a candlestick in the only one of the three rooms next to mine 
	-- which was not empty.

	# adjacent[room[Pervenche]] = 3
	one (occupied & adjacent[room[Pervenche]])
	testimony[ANY, Candlestick, occupied & adjacent[room[Pervenche]] ]

	-- Ms. Leblanc: The small living room was empty. I know that 
	-- because I was in the room next door.

	no PSalon & occupied
	room[LeBlanc] in adjacent[PSalon]

	-- Colonel Moutarde: The three rooms adjacent to mine were empty.

	# adjacent[room[Moutarde]] = 3
	no (adjacent[room[Moutarde]] & occupied)

	-- Teacher. Violet: I heard voices of women in the only two rooms 
	-- adjacent to mine that were occupied. 

	# (adjacent[room[Violet]] & room[ women ] ) = 2
	# (adjacent[room[Violet]] & occupied ) = 2

	-- I am an intellectual: I have never touched a revolver in my life 
	-- and I am not at all a handyman.

	weapon[Violet] not in Revolver+Wrench -- ??

	-- Dr. Olive: As I walked into the hall (which was empty by the way), 

	Hall not in occupied
	
	-- I heard a click of a wrench nearby. 

	testimony[ ANY, Wrench, adjacent[Hall] ]

	-- I quickly took refuge in an  adjacent room

	testimony[ Olive, ANY-Wrench, adjacent[Hall] ]
}
```
We need a function to record a testimony. Since we maintain a relation of suspect->weapon->room, allow
a witness to assert that there should be at least one member in the solution scene.
```alloy
pred testimony[ s : set Suspect, w : set Weapon, r : set Room ] {
	some (s->w->r & Solution.scene)
}
```
Collect the rooms/weapons that a set of suspects are in. This is easier to use then to return 
a single room/weapon for single suspect. However, be careful to assert how many you need to get
since the empty set is a valid value.
```alloy
fun room[ suspects : set Suspect ] : set Room {
	univ.(suspects.(Solution.scene))
}

fun weapon[ suspects : set Suspect ] : set Weapon {
	(suspects.(Solution.scene)).univ
}
```
Get the set of rooms that are occupied
```alloy
fun occupied : set Room {
	Solution.scene[univ][univ]
}


run {}
```

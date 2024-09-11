## Welcome!
This is the official info page now, instead of the README. I'll add all update changes and future plans here as well.

TETI (the name is in the works) is a modern tetris clone I've been working on for the past year or so, on and off. It's a moderately large project, and there's still many things I want to work on.

This project started out as a learning experience, because suprisingly it was my first time actually using javascript. For my year 12 major project (pseudohuman) I wanted to build a multiplayer web based game, and thus I made this to gain experience before starting. I had already programmed in Java, as wlel as some C# and python, so I was not unfamiliar to programming, and I already knew frontend basics. Teti was able to combine my interest for tetris, and also challenge me to learn javascript. Well after the project was over, I could truly improve the code and game to make an amazing experience

[Here is the trailer video](https://www.youtube.com/watch?v=Gf2dsPRf2uM)

I hope you enjoy TETI, and give a star if you like it. The code is no longer 1000 lines, but I want this to grow to a proper maintainable tetris client.

Also is it just me or is the movement a bit off

### contributions
Thank you [existancepy](https://github.com/existancepy) for all the fixes.

Feel free to contribute with pull requests and issues. I'll try to keep up with new features and fixes.

## Current Features
- modern guideline (customisable)
    - colours
    - 7bag
    - 5 next queue
    - hold
    - srs+ (tetrio)
    - blockout and lockout
    - ghost
    - tspins and allspins
    - locking with indicator
- stats sidebar
- customisable game settings
- customisable controls, handling
- customisable display
- tetrio sfx
- touhou jazz music (funny)
    - can play/pause, skip song
- technically responsive
- many modes
    - 40l, blitz, custom
    - attacker (reach certain attack amount)
    - dig, survival, backfire
    - semi invis mode
    - 4W
- clean modern animated menus
- import/export settings
- customise queues
- edit and draw on board (custom game)
- undo and redo with non linear branches

## Updates
#### v1.1.1
- editing boards now is undoable (gamestate is saved)
- changed some event listeners for efficiency
- piece schedules lock on top rather than topout

### v1.1.0
- added undo and redo feautures
- non linear timeline: branches can be made and navigated, much like a git tree
- preloaded all sfx and songs

### v1.0.0
- I should probably start numbering these versions huh.
- Reorganised all the code into very managable classes that can now be more easily changed.
- You can now draw on your board in custom game.
- You can open an editing menu in custom games (default key: e). This allows you to import, export boards, and also add/remove lines and much more.
- The main menu is more organised, and each menu now organises a certain setting group for better code efficiency.
- The settings object is changed to be a hashmap (js object) rather than an array, more closely matches tetrio setting.ttc files.

## TODO list
Things that I am working on, and most likely will release in the next update
- allow for modifiers to be added to keybinds
- loading page for the first second or so
- add edit menu button
- show history number when in custom game
- title screen maybe

## Feature Wishlist
May or may not add these, kinda ordered by ease and want for feature
- add different 4w residue (both 3 and 6 residue)
- more stats + customise stat sidebar
- more garbage settings
- finesse detection
- pb logging
- allow importing tetrio settings and custom game files
- custom mino skins and music
- show info when hovering over settings
- replay functionality (either save gamestate or save keystrokes idk yet)
- more unique gamemodes (techmino styled)
    - misdrop remover mode
    - gamemode presets
- more rotation systems (ars, trs, srs/srsX, none)
- guide like progression thing? using custom boards (kinda like tetris tres bien)
- maybe play around with server api stuff, like adding a leaderboard or connecting tetrio stats
- touch settings
- cooler graphics (maybe using a library like pixijs)

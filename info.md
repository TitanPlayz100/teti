## Welcome!
This is the official info page now, instead of the README. I'll add all update changes and future plans here as well.

TETI (the name is in the works) is a modern tetris clone I've been working on for the past year or so, on and off. It's a moderately large project, and there's still many things I want to work on.

This project started out as a learning experience, because suprisingly it was my first time actually using javascript. For my year 12 major project (pseudohuman) I wanted to build a multiplayer web based game, and thus I made this to gain experience before starting. I had already programmed in Java, as wlel as some C# and python, so I was not unfamiliar to programming, and I already knew frontend basics. Teti was able to combine my interest for tetris, and also challenge me to learn javascript. Well after the project was over, I could truly improve the code and game to make an amazing experience

I hope you enjoy TETI, and give a star if you like it. If you want you can also contribute, and open issues, and I'll try to keep up with new features.

[Here is the trailer video](https://www.youtube.com/watch?v=Gf2dsPRf2uM)

I know in this new update the code is no longer 1000 lines, but I think it's time to let go of this limitation in order to grow and make this a proper tetris client. However, I'll try to keep the spirit of using no dependacies and pure html, css, and javascript.

Also can someone help me figure out of the movement feels off or is it just me

## Current Features
- modern guideline (customisable)
    - colours
    - 7bag
    - 5 next queue
    - hold
    - srs+ (tetrio)
    - blockout and lockout
    - ghost
    - tspin
    - proper locking (with indicator)
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
- menu animations
- import/export settings
- customise queues
- allspin (immobile check like tetrio)
- edit and draw on board (custom game)


## Updates
### v1.0.0
I should probably start numbering these versions huh.

Reorganised all the code into very managable classes that can now be more easily changed.

You can now draw on your board in custom game.

You can open an editing menu in custom games (default key: e). This allows you to import, export boards, and also add/remove lines and much more.

The main menu is more organised, and each menu now organises a certain setting group for better code efficiency.

The settings object is changed to be a hashmap (js object) rather than an array, more closely matches tetrio setting.ttc files.


## TODO list
Things that I am working on, and most likely will release in the next update
- preload all audio 

## Feature Wishlist
No particular order or time frame, may or may not add these
- undo/redo
- gamemode presets
- guide like progression thing? using custom boards (kinda like tetris tres bien)
- title screen maybe
- more unique gamemodes (techmino styled)
- more stats + customise stat sidebar
- more garbage settings
- maybe play around with server api stuff, like adding a leaderboard or connecting tetrio stats
- allow importing tetrio settings and custom game files
- replay functionality (either save gamestate or save keystrokes idk yet)
- finesse detection
- pb logging
- custom mino skins and music
- touch settings
- cooler graphics (maybe using a library like pixijs)
- more rotation systems (ars, trs, srs/srsX, none)
- misdrop remover mode
- add different 4w residue (both 3 and 6 residue)

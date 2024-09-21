## Welcome!
This is the official info page now, instead of the README. I'll add all update changes and future plans here as well.

TETI (the name is in the works) is a modern tetris clone I've been working on for the past year or so, on and off. It's a moderately large project, and there's still many things I want to work on.

This project started out as a learning experience, because surprisingly it was my first time actually using Javascript. For my year 12 major project (pseudohuman) I wanted to build a multiplayer web based game, and thus I made this to gain experience before starting. I had already programmed in Java, as well as some C# and Python, so I was not unfamiliar to programming, and I already knew frontend basics. Teti was able to combine my interest for tetris, and also challenge me to learn Javascript. Well after the project was over, I could truly improve the code and game to make an amazing experience

[Here is the trailer video](https://www.youtube.com/watch?v=Gf2dsPRf2uM)

I hope you enjoy TETI, and give a star if you like it. The code is no longer 1000 lines, but I want this to grow to a proper maintainable tetris client.

## Contributions
Thank you [existancepy](https://github.com/existancepy) for all the fixes.  
Thanks [ItzBlack6093](https://github.com/ItzBlack6093) for adding the TGM Race mode.  
Design inspired by [Strangelinx's 'blocks'.](https://strangelinx.github.io/blocks/)  
Icons from [The Noun Project](https://thenounproject.com)

Feel free to contribute with features and issues. 

#### Music
[(Locked Girl ~ The Girl's Secret Room) - Cafe de Touhou 3](https://www.youtube.com/watch?v=7Q3c2vmXEyg)  
[ShibayanRecords - Acoustic Image](https://www.youtube.com/watch?v=4RC2hrMFIMQ)  
[ShibayanRecords - Close to your mind](https://www.youtube.com/watch?v=kPIyxq9K-Yw)

## Features
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
    - Race (TGM style)
- clean modern animated menus
- import/export settings
- customise queues
- edit and draw on board (custom game)
- undo and redo with non linear branches
- pbs are recorded, as well as lifetime stats

## TODO list
Things that I am working on, and most likely will release in the next update
- add undo redo sfx and visuals
- button click animations and better menu transitions
- board particle effects
- view lifetime stats and legacy stats in pb menu

## Updates
### v1.2.1
- fun with parallax effect in info page
- changed gamemodes to be stored using JSON instead of in code
- can easily add custom gamemodes now using gamemodes JSON
- competitive mode 
    - sets certain gamerules, disables custom game settings
    - PBs are onyl saved when used
- seperated goals into its own menu
- view pbs in competitive mode menu

### v1.2.0
- added key modifiers
    - you can make undo (or any key) ctrl+z now
    - modifiers are ctrl and alt (no shift)
- added splash screen to cover ugly board and audio loading
- improved movement feeling, can increase das to tetrio settings lmao
- option to enable/disable history 
- Added the storing of PBs and lifetime stats
    - in the future can be displayed
- optimised more event handlers to be delegates
- you get a glow when on pb pace
- fixed danger glow outline

#### v1.1.2
- added board bounce
- custom mode has button for edit menu and a history display 
- Race mode added by itsblack6093

#### v1.1.1
- editing boards now is undoable (gamestate is saved)
- changed some event listeners for efficiency
- piece schedules lock on top rather than topout

### v1.1.0
- added undo and redo features
- non linear timeline: branches can be made and navigated, much like a git tree
- preloaded all sfx and songs

### v1.0.0
- I should probably start numbering these versions huh.
- Reorganised all the code into very managable classes that can now be more easily changed.
- You can now draw on your board in custom game.
- You can open an editing menu in custom games (default key: e). This allows you to import, export boards, and also add/remove lines and much more.
- The main menu is more organised, and each menu now organises a certain setting group for better code efficiency.
- The settings object is changed to be a hashmap (js object) rather than an array, more closely matches tetrio setting.ttc files.


## Feature Wishlist
May or may not add these, kinda ordered by ease and desire for feature
- add different 4w residue (both 3 and 6 residue)
- more stats + customise stat sidebar
- more garbage settings
- finesse detection
- allow importing tetrio settings and custom game files
- show info when hovering over settings
- more rotation systems (ars, trs, srs/srsX, none)
- custom mino skins and music
- replay functionality (either save gamestate or save keystrokes idk yet)
- more unique gamemodes (techmino styled)
    - misdrop remover mode
- guide like progression thing? using custom boards (kinda like tetris tres bien)
- maybe play around with server api stuff, like adding a leaderboard or connecting tetrio stats
- touch settings
- cooler graphics (maybe using a library like pixijs)
- bot to play against
- statistics graph
- colourblind gamemode
- holdless and next queueless gamemode - kinda like qp2 cards
- achievements, progression tree
- glossary of useful terms
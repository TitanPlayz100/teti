## Welcome!

[Jump to Changelog](#updates)

[Jump to Feature Wishlist](#feature-wishlist)

TETI is a singleplayer, modern block stacker, similar to the likes of Tetra Legends, Tetr.js, Blocks, and other web based stackers.

I hope you enjoy Teti, and if you liked it a star would be appreciated. I want this to grow to a proper maintainable tetris web client, so feel free to contribute, and modify my own code.

[Here is the trailer video](https://www.youtube.com/watch?v=Gf2dsPRf2uM)

#### Backstory
This project started out as a learning experience, because surprisingly it was my first time actually using Javascript. For my high school project (pseudohuman) I wanted to build a multiplayer web based game, and thus I made this to gain experience before starting. I had already programmed in Java, as well as some C# and Python, so I was not unfamiliar to programming, and I already knew frontend basics. Teti was able to combine my interest for tetris, and also challenge me to learn Javascript. After the project was over, I could truly improve the game to make an amazing experience.


## Contributions
Thanks [existancepy](https://github.com/existancepy) for all the fixes.  
Thanks [ItzBlack6093](https://github.com/ItzBlack6093) for adding TGM Race mode and other fixes.  
Design inspired by [Strangelinx's 'blocks'.](https://strangelinx.github.io/blocks/)  
Icons from [The Noun Project](https://thenounproject.com)

Feel free to contribute with features and fixes, and open issues. 

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
- customisable display, game, controls, and handling settings
- tetrio sfx
- touhou jazz music
    - can play/pause, skip song
- responsive design
- many modes
    - 40l, blitz, custom
    - attacker (reach certain attack amount)
    - dig, survival, backfire
    - semi invis mode
    - 4W
    - Race (TGM style)
- clean, modern, and animated menus
- import/export settings
- customise queues
- edit and draw on board (custom game)
- custom menu to import/export board states, and edit garbage
- undo and redo with non linear branches
- pbs are saved, as well as lifetime stats

## TODO list
Things that I am working on based on other changes *(omg this will never end)*
- view lifetime stats and legacy stats in pb menu
- customise stat sidebar
- particle options
- customise skin and maybe audio as well
- piece flash, menu sfx proper, dotted vs rounded grid, setting type option, small text under each menu option, firefox css support
- ready set go start option
- stride mode queues (no szo starts)
- custom url backgrounds

## Updates
### v1.3.0 => VISUALS
- PIECE SKINS!
    - will add way to custom add own skins
- PARTICLES!!
    - feedback on performance would be nice
    - will add particle options soon as well
- NEW MENUS!!!
    - allows for scrolling, more animations
    - consistent and more modern look
- changed tick rate to 60 for consistency
- tweaks to movement for hopefully performance 
- refactored board rendering to be more readable
- refactored unreadable code, removed utils => may make a technical wiki someday
- small changes to how backfire works
    - excess garbage used for cancelling sent back to player like tetrio
- pb effects has 3s cooldown
- cursor vanishes while ingame
- fixed bug with toping out when garbage rises
- fixed lockout not working
- hyperalert {!} is back with a 'go down' message

***
#### v1.2.4
- added button to delete pbs
- changed pb border effect to be based on better tracked stats (like apm for attacker)
- made pausing pause locking timer
- maxBTB and maxCombo update properly
- added more stats and dates to saving stats
- hold piece now turns gray when it cannot be used
- lookahead piece now flashes when placed
- fixed scoring with softdrop and harddrop
- reorganised styles pages
- stats are shown at end of each game, can export stats
- game option to disable hold piece

#### v1.2.3
- thanks itsblack6093 for out of focus text
    - option to disable text
- reorganised html with comments
- add undo redo sfx and board shake
- added pb and pace sfx

#### v1.2.2
- added different 4w residue (both 3 and 6 residue)
- piece changes opacity as it locks
- added a LARGE variety of new stats
    - all are stored part of each game and added to lifetime stats
    - in the future these will be accessible and visible

#### v1.2.1.2
- fixed edit modal breaking when main menu open
- fixed flashing being too fast in lookahead mode
- fixed setting snot properly saving with competitive mode active

#### v1.2.1.1
- fun with parallax effect in info page
- changed gamemodes to be stored using JSON instead of in code
- can easily add custom gamemodes now using gamemodes JSON
- competitive mode 
    - sets certain gamerules, disables custom game settings
    - PBs are onyl saved when used
- seperated goals into its own menu
- view pbs in competitive mode menu

### v1.2.0 => COMPETITIVE MODE
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

***
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

### v1.0.0 => THE REWRITE
- I should probably start numbering these versions huh.
- Reorganised all the code into very managable classes that can now be more easily changed.
- You can now draw on your board in custom game.
- You can open an editing menu in custom games (default key: e). This allows you to import, export boards, and also add/remove lines and much more.
- The main menu is more organised, and each menu now organises a certain setting group for better code efficiency.
- The settings object is changed to be a hashmap (js object) rather than an array, more closely matches tetrio setting.ttc files.

***
## Feature Wishlist
Future wants for game, kinda ordered by ease and desire for feature
- more garbage settings
- finesse detection
- better loading screen with toast popup when assets load instead
- cooler action text
- allow importing tetrio settings and custom game files
- show info when hovering over settings
- small guide on essential things for game
- more rotation systems (ars, trs, srs/srsX, none)
- custom mino skins and music
- replay functionality (either save gamestate or save keystrokes idk yet)
- more unique gamemodes (techmino styled)
    - misdrop remover mode
    - holdless and next queueless gamemode kinda like qp2 cards
    - colourblind gamemode
- WIKI for technical docs about project
    - glossary of useful terms
- guide like progression thing? using custom boards (kinda like tetris tres bien)
    - achievements, progression tree
- maybe play around with server api stuff, like adding a leaderboard or connecting tetrio stats
- touch settings
- bot to play against
- statistics graph
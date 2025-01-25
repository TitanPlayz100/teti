## Welcome!

[Jump to Changelog](#updates)

[Jump to Feature Wishlist](#feature-wishlist)

TETI is a singleplayer, modern block stacker, similar to the likes of Tetra Legends, Tetr.js, Blocks, and other web based stackers.

I hope you enjoy Teti, and if you liked it a star would be appreciated. I want this to grow to a proper maintainable tetris web client, so feel free to contribute, and modify my own code.

[Here is the trailer video](https://www.youtube.com/watch?v=Gf2dsPRf2uM)

#### Backstory
This project started out as a learning experience, because surprisingly it was my first time actually using Javascript. For my high school project (pseudohuman) I wanted to build a multiplayer web based game, and thus I made this to gain experience before starting. I had already programmed in Java, as well as some C# and Python, so I was not unfamiliar to programming, and I already knew frontend basics. Teti was able to combine my interest for tetris, and also challenge me to learn Javascript. After the project was over, I could truly improve the game to make an amazing experience.


## Acknowledgements
Thanks [existancepy](https://github.com/existancepy) for all the fixes.  
Thanks [ItzBlack6093](https://github.com/ItzBlack6093) for adding many modes and fixes.  

Feel free to contribute with features and fixes, and open issues.  

Design inspired by [Strangelinx's 'blocks'](https://strangelinx.github.io/blocks/) and [Tetra Legends.](https://tetralegends.app)  
Icons from [The Noun Project.](https://thenounproject.com)  
Sound effects from [TETR.IO.](https://tetr.io)  
Skins from [YHF](https://you.have.fail/ed/at/tetrioplus/)  

#### Music
[(Locked Girl ~ The Girl's Secret Room) - Cafe de Touhou 3](https://www.youtube.com/watch?v=7Q3c2vmXEyg)  
[ShibayanRecords - Acoustic Image](https://www.youtube.com/watch?v=4RC2hrMFIMQ)  
[ShibayanRecords - Close to your mind](https://www.youtube.com/watch?v=kPIyxq9K-Yw)


## Features
- modern guideline (customisable)
    - colours
    - 7-bag
    - 5 next queue
    - hold
    - srs+ (tetrio)
    - blockout and lockout
    - ghost
    - tspins and allspins
    - locking with indicator
- customisable stats sidebar (and many stats to choose)
- customisable display, game, controls, and handling settings
- customisable randomisers and kick tables
- customise queues
- import/export settings
- tetrio sfx
- many modes
    - 40l, blitz, custom
    - attacker (reach certain attack amount)
    - dig, survival, backfire
    - semi invis mode
    - 4W
    - Race (TGM style)
- edit and draw on board (custom game)
- custom menu to import/export board states, and edit garbage
- undo and redo with non linear branches
- pbs are saved, as well as lifetime stats
- custom and preset piece skins
- cool particles
- clean, modern, and animated menus
- responsive design
- touhou jazz music
    - can play/pause, skip song
- Replays can be saved and viewed

## TODO list
Things that might be in progress
- gravity increase over time (and maybe fix softdrop)
- pro mode (large line count on board)
- option to pause on focus loss
- fix responsive design 

Zenith mode additions
- add fatigue:
    - 8:00 - 2 permanent garbage
    - 9:00 - receive 25% more garbage
    - 10:00 - 3 more permanent garbage (5 total)
    - 11:00 - debuff increased to 50% more garbage
    - 12:00 - 5 more permanent garbage (10 total)

- maybe add a "currently in hyperspeed" graphic
- simulated garbage recieving option
    - amount of garbage sent to player increases with floor
    - garbage is random bursts
    - attacks 8 or larger split using {!!} thing (0.5s gap)
- option for expert mode style

[Longterm ideas here](#feature-wishlist)

***

## Updates
#### v1.4.3
- added bag seperators
- added rotation center indicator
- new display setting to toggle these indicators
- sfx setting for piece spawns

#### v1.4.2.2
- finished ready set go option
    - the animation can be improved (need more inspiration)
- fixed classic mode handling, now accurate to real game

- added zenith pb splits and animation on hyperspeed

#### v1.4.2
- Instead of using this.game, the Game instance is exported (less object oriented and more intuitive)
- started adding ready set go option

#### v1.4.1
- replays save as milliseconds instead of frames
- settings properly load from replays now

### v1.4.0 => REPLAYS
- Replays are added, which can be viewed in the replay section
- There is still quite a bit of development related to making replays sharable
- bugs with replays are inevitable
- fixed icons being unclickable

#### v1.3.9
- refactored graphic visuals to be in another file, and animations in another file
- pixirender is much clearer
- added board opacity back
- added a new pb rainbow effect on sides of board (old one was too complex)
- loading spinner

#### v1.3.8
- changed movement to use pixi ticker (frames) to give smoother movement
- added most other kicks (code maybe stolen from tetrio)
    - had to change tetrio's table rotation numbers 
    - (switch digits, then 1 is 4, 2 is 3, 3 is 2, 0 is 1)
    - eg tetrio 01 (01 -> 10 -> 41) is 41 in kicks.json
- kicks include SRS, SRS+, SRS-X, NRS, ARS, ASC, TETRA-X, and none

- piece spawning sfx added
- changed more competitive mode settings
    - updated race mode to use accurate randomiser
- added tgm randomiser (HiS in techmino)

#### v1.3.7
- changed randomiser to use TETR.IO's seed system
    - seeds from tetrio replays match teti's
    - possibly could be handy in the future
- more bag systems added
    - designed from tetrio's randomisers
    - changed 7bag
    - added 7+1 and 7+2 bag, 7+x bag, classic, total mayhem, pairs, and 14 bag
- classic gamemode uses classic randomiser

#### v1.3.6
- added basics of a classic mode (with gravity, instant lock, and classic rng)
- added total mayhem randomiser
    - in the future it is very easy to add more randomisers
    - thinking of adding all tetrio randomisers
    - also figuring out tetrio's seed gen to mimic it for future additions (digging source code aaaaaa)

- more skins added (TGM classic and world)
- grading system in race

#### v1.3.5
- New board design inspired from [this reddit post](https://www.reddit.com/r/Tetris/comments/1g80adg/tetris_ui_concept/)
- added continue button in menu, and changed ingame buttons to use pixijs now
- experimenting with animation library called gsap
- changed action text and stats text to use pixi now
- changed PC text to be more TETR.IO-like
- changed spike text to show in the middle of the board (like techmino)
- RIP coloured queues
- better page loading using defer and lazy loading
- Experimental: pressed keys are stored in a queue, and evry pixi tick they all fire, might be more responsive
- changed timeLeftText animation to use gsap and pixi
- added setting for toggling action text

#### v1.3.4 => PIXI.js
- COMPLETE REWRITE OF ALL GRAPHICS
- Everything is now rendered through pixijs
    - this includes the board, next queue, hold queue, and particles
    - ye turns out there is a high learning curve with pixi (i lost it several times)
    - everything should now be much more performant and smooth yay
- some things were changed due to this
    - need to add border colour back

#### v1.3.3
- Thanks to itzblack for the Zenith Tower mode
- added option for line clear delay

#### v1.3.2
- reset animation
    - toggles with stride mode
- fixed timer when menu was open
- competitive modes now have custom sidebars
- added piece dropping particles and piece flash (tetrio style)
- added notifications
    - displays errors
    - shows export and import messages
- removed assets loading screen, cause it was unnecessary
- added different grid patterns

#### v1.3.1
- backgrounds can be custom using url
- Skin can now be customised and comes with some defaults as well
    - can either use: tetrio, jstris, plain
    - can insert url with image (372x30 using tetrio format) such as you.have.fail skins
- text under main menu options
- fixed menu sfx volume
- made most css work on firefox now
    - update: i installed firefox and actually nothing works because import assertions are not supported yet (import ... **with** json)
- sidebar text is now customisable in game settings
    - use "None" for no text
- stride setting
    - no o, s, z starts
- added btb particles after btb 8

### v1.3.0 => VISUALS
- PIECE SKINS!
    - will add way to custom add own skins
- PARTICLES!!
    - feedback on performance would be nice
    - will add particle options soon as well
- NEW MENUS!!!
    - allows for scrolling, more animations
    - consistent and more modern look
    - images light up on hover
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
- fixed settings not properly saving with competitive mode active

#### v1.2.1.1
- fun with parallax effect in info page
- changed gamemodes to be stored using JSON instead of in code
- can easily add custom gamemodes now using gamemodes JSON
- competitive mode 
    - sets certain gamerules, disables custom game settings
    - PBs are only saved when used
- separated goals into its own menu
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
Possible directions for game, kinda ordered by ease and desire
- add beta tetrio features (surge, pco nerf, immobile tspins, garbage clearing buff )
- finesse detection
- custom game presets
    - setting presets for display settings and game settings
- allow importing tetrio settings and custom game files
- small guide on essential things for game
    - show info when hovering over settings
    - WIKI for technical docs about project
    - glossary of useful terms
- replay functionality (either save gamestate or save keystrokes idk yet)
    - statistics graph
- more unique gamemodes (techmino styled)
    - misdrop remover mode
    - holdless and next queueless gamemode kinda like qp2 cards
    - colourblind gamemode
    - TEC Zone mode
- guide like progression using custom maps
    - maybe like tetris tres bien
    - achievements, progression tree
    - the jstris map creator looks really nice
    - could have user made maps section as well
- maybe play around with api stuff
    - leaderboards
    - connecting tetrio stats
- touch settings
- 1v1
- make setting menus be json generated
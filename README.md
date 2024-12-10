# Teti README

Hosted on github pages [here](https://titanplayz100.github.io/teti/)

The info page can be found [here](https://titanplayz100.github.io/teti/info.html)

> [!WARNING]
> Firefox is not supported (due to import assertions)

## Desktop App
Releases are now run through a workflow. They are **up to date** and contain all the latest features.

App build using Tauri, feel free to open issues and PRs.

## Contributing
Feel free to add and modify any code, as long as its for improvements or optimisations. (I'm pretty lenient)

Just make sure ur accounting for breaking changes, and have clear PRs with good descriptions.

If you need help with understanding code feel free to open an issue.


## Data Formats (for my convenience)
### Gamemode Structure (gamemodes.json)
```js
gamemodes = {
    "gamemode_name": {
        settings: {}, // settings that override the default * settings
        displayName: "", // name shown on gamemode selection
        objectiveText: "", // subtext displayed on right side
        goalStat: "", // stat being tracked (valid property in stats class)
        target: "", // target (valid target in settings)
        result: "", // displayed as result (another valid stat in stats class)
        
        // TO BE ADDED LATER
        music: "", // custom song that can play 
        compmusic: "", // custom song that played on pb pace
        startBoard: "", // starting board, tetrio map format
        effects: [], // custom background / effects
    }
}
```

Add functionality mainly in `features/modes.js`.
You can modify existing modules as well from other files

### Adding Audio (sfxlist.json)
```json
{
    {
        "name": "<name used in code>",
        "path": "assets/sfx/<file path / name>.<ext>"
    }
}
```
Use with `Game.sounds.playSound(<name>)`


## Types for PIXIjs
Workaround to use types when using pixijs imported through script tag:
- download [pixi.js.d.ts](https://github.com/pixijs/pixijs/releases) from pixijs repo and place file in /src
- setup jsconfig.json to automatically detect pixi.js.d.ts for types

```json 
{
    "compilerOptions": { "resolveJsonModule": true },
    "typeAcquisition": { "include": ["pixi.js.d.ts"] }
}
```
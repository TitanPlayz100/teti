# Teti README

Hosted on github pages [here](https://titanplayz100.github.io/teti/)

The info page can be found [here](https://titanplayz100.github.io/teti/info.html)

## Desktop App
All the information is in the tauri branch 

> [!WARNING]
> Releases are **NOT** up to date


## Data Formats
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
        
        music: "", // to be implemented, custom song that can play 
        pbmusic: "", // to be implemented, custom song that played on pb pace
        skin: "", // to be implemented
        board: "", // to be implemented, starting board, tetrio map format
        sidebar: [], // to be implemented, sidebar stats that are displayed
        background: "", // to be implemented, custom background / effects
    }
}
```

Add functionality mainly in `featuers/modes.js`.  
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
Use with `this.game.sounds.playSound("<name>", ...)`

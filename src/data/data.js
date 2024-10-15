export const cleartypes = { 0: "", 1: "Single", 2: "Double", 3: "Triple", 4: "Quad", 5: "Teti-tris" };

export const defaultSkins = ['tetrio', 'jstris', 'plain', 'tgm_c', 'tgm_w'];

export const scoringTable = {
    "": 0,
    TSPIN: 400,
    "TSPIN MINI": 100,
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    QUAD: 800,
    "TSPIN SINGLE": 800,
    "TSPIN DOUBLE": 1200,
    "TSPIN TRIPLE": 1600,
    "TSPIN MINI SINGLE": 200,
    "TSPIN MINI DOUBLE": 400,
    "ALL CLEAR": 3500,
};

export const levellingTable = {
    0: 0,
    1: 1,
    2: 2,
    3: 4,
    4: 6,
};

export const disabledKeys = [
    "ArrowRight",
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
    " ",
    "Enter",
    "Escape",
    "Tab",
];

export const spinChecks = [
    [
        [0, 2],
        [2, 2],
    ],
    [
        [2, 2],
        [2, 0],
    ],
    [
        [0, 0],
        [2, 0],
    ],
    [
        [0, 0],
        [0, 2],
    ],
];

export const gameoverText = {
    clearlines: "Cleared _ lines",
    attack: "Sent _ damage",
    cleargarbage: "Dug _ lines",
    ended: "Survived _ lines",
    tgm_level: "Reached level _",
    time: "Spent _ seconds",
    altitude: "Climbed _ meters",
}

export const gameoverResultText = {
    time: " in _ seconds",
    score: " to score _ points",
    maxCombo: " to get _ combo",
    grade: " to get grade _"
}

export const lowerIsBetter = {
    time: true,
    score: false,
    maxCombo: false
}

export const pbTrackingStat = {
    clearlines: "pps",
    time: "score",
    attack: "apm",
    cleargarbage: "dss",
    combo: "maxCombo",
    level: "pps"
}

export const resultSuffix = {
    time: 's',
    score: ' Points',
    maxCombo: ' Combo',
    grade: ""
}

export const statDecimals = {
    0: ["clearlines", "pieceCount", "score", "pcs", "quads", "allspins", "level", "attack", "cleargarbage", "sent", "recieved", "combo", "maxCombo", "btbCount", "maxBTB", "tpE", "ipE", "inputs", "holds", "rotates", "ppb",],    
    1: ["time", "vs", "chzind", "garbeff",],
    2: ["pps", "apm", "lpm", "app", "apl", "appw", "dss", "dsp", "vsOnApm", "kps", "kpp"]
}

export const statsSecondary = {
    pps: "pieceCount",
    apm: "attack",
    lpm: "clearlines",
    app: "attack",
    apl: "attack",
    appw: "attack",
    dss: "cleargarbage",
    dsp: "cleargarbage",
    kps: "inputs",
    kpp: "inputs",
    tpE: "tspins",
    ipE: "quads",
    ppb: "score"
}


// const sfx = await fetch("https://api.github.com/repos/titanplayz100/teti/contents/assets/sfx")
// const combo = await fetch("https://api.github.com/repos/titanplayz100/teti/contents/assets/sfx/combo")
// const songs = await fetch("https://api.github.com/repos/titanplayz100/teti/contents/assets/songs")
// manually remove dirs
export const songsobj = [
    {
        "name": "Cafe de Touhou 3 - The Girl's Secret Room.mp3",
        "path": "assets/songs/Cafe de Touhou 3 - The Girl's Secret Room.mp3",
        "type": "file"
    },
    {
        "name": "ShibayanRecords - Acoustic Image.mp3",
        "path": "assets/songs/ShibayanRecords - Acoustic Image.mp3",
        "type": "file"
    },
    {
        "name": "ShibayanRecords - Close to your Mind.mp3",
        "path": "assets/songs/ShibayanRecords - Close to your Mind.mp3",
        "type": "file"
    }
];

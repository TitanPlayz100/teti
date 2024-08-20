export const KickData = [[ // srs+ (tetrio)
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 4 -> 1, 1 is north, ccw is 1 -> 4, ccw is * -1
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // 1 -> 2
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 2 -> 3 
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]      // 3 -> 4
], [                                            // I piece kicks
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],    // 4 -> 1      
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 1 -> 2
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],    // 2 -> 3
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]     // 3 -> 4
]];

export const KickData180 = [[
    [[0, 0], [0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0]], // 3 -> 1
    [[0, 0], [-1, 0], [-1, 2], [-1, 1], [0, 2], [0, 1]],   // 4 -> 2
    [[0, 0], [0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0]],    // 1 -> 3
    [[0, 0], [1, 0], [1, 2], [1, 1], [0, 2], [0, 1]]       // 2 -> 4
], [                                                   // I piece kicks
    [[0, 0], [0, -1]],                                     // 3 -> 1
    [[0, 0], [-1, 0]],                                     // 4 -> 2
    [[0, 0], [0, 1]],                                      // 1 -> 3
    [[0, 0], [1, 0]],                                      // 2 -> 4
]];

// json has no comments :(
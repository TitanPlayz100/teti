#ifndef BOT_H
#define	BOT_H

#include <iostream>
#include <map>
#include <string>
#include <sstream>
#include "tetrisgame.h"

class Bot {
public:
    Bot();
    Bot(const Bot& orig);
    virtual ~Bot();
    
    int onMessage(char * msg);
    
    void setup();
    void init();
    void outputMoves();
    void startCalculating();
    void debug();
    
    
    struct tetris_ai {
        int style;
        int level;
        tetris_ai() {
            style = 2;
            level = 4;
        }
    };

    struct tetris_rule {
        int spin180;
        int GarbageCancel;
        int GarbageBuffer;
        int GarbageBlocking;
        int combo_table_style;
        tetris_rule() {
            spin180 = 1;
            GarbageCancel = 1;
            GarbageBuffer = 1;
            GarbageBlocking = 1;
            combo_table_style = 2; //1=TOJ, 2=TF
        }
    };
    
private:   
    void processMoves();
    int m_restarts;
    char m_queue[8];
    int *m_field;
    int m_queueLen;
    int m_upcomeAtt;
    std::map<char, int> m_gemMap;
    std::vector<std::string> m_rotateMap;
    
    TetrisGame tetris;
    tetris_rule rule;
    tetris_ai ai;

    // Conversion table from weird Misa block definitions to SRS center used by TBP
    int srs_point[8][4][2] = {
        {{0,0},{0,0},{0,0},{0,0}},
        {{1,1},{2,1},{2,2},{1,2}}, //I
        {{2,1},{2,1},{2,1},{2,1}}, //T
        {{2,1},{2,1},{2,1},{2,1}}, //L
        {{2,1},{2,1},{2,1},{2,1}}, //J
        {{2,1},{2,1},{2,1},{2,1}}, //Z
        {{2,1},{2,1},{2,1},{2,1}}, //S
        {{1,1},{0,0},{0,0},{0,0}}  //O,1
    };
};

#endif	/* BOT_H */
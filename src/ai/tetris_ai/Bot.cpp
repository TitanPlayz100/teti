#include "Bot.h"
#include <cassert>
#include <vector>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

/* ============================================================ */
/* This part registers postMessageJson() function, which will
   send json data from this bot to TBP frontend using 
   postMessage() call in javascript                             */

EM_JS(void, call_js_agrs, (const char *title, int lentitle), {
    postMessage(JSON.parse(UTF8ToString(title, lentitle)));
});

bool postMessageJson(json const& j) {
    std::string s = j.dump();
    call_js_agrs(s.c_str(), s.length());
    return true;
}

EMSCRIPTEN_BINDINGS(module) {
    emscripten::function("postMessageJson", &postMessageJson);
}
/* ============================================================ */

Bot::Bot(){
    m_gemMap[' '] = AI::GEMTYPE_NULL;
    m_gemMap['I'] = AI::GEMTYPE_I;
    m_gemMap['T'] = AI::GEMTYPE_T;
    m_gemMap['L'] = AI::GEMTYPE_L;
    m_gemMap['J'] = AI::GEMTYPE_J;
    m_gemMap['Z'] = AI::GEMTYPE_Z;
    m_gemMap['S'] = AI::GEMTYPE_S;
    m_gemMap['O'] = AI::GEMTYPE_O;
    m_rotateMap.push_back("north");
    m_rotateMap.push_back("east");
    m_rotateMap.push_back("south");
    m_rotateMap.push_back("west");
    m_restarts=0;
}

Bot::Bot(const Bot& orig) {
}

Bot::~Bot() {}

/**
 * Called when the worker is initialized (initial TBP messsage)
 */
void Bot::init() {
    json j = {
        {"type", "info"},
        {"name", BOT_NAME},
        {"version", BOT_VERSION},
        {"author", "Misakamm, TBP port by jezevec10"},
        {"features", {}},
    };
    postMessageJson(j);
}

/**
 * Handle incoming message from TBP frontend
 * 
 * @param msg JSON string
 * @return int 1 if processed successfully
 */
int Bot::onMessage(char * msg) {
    auto j_msg = json::parse(msg);
    string command = j_msg["type"].get<std::string>();
    if( command == "rules"){
        setup();
        json j = {
            {"type", "ready"},
        };
        postMessageJson(j);
    }else if( command == "start"){
        m_restarts++;
        tetris.reset(0,0);
        //tetris.m_hold = false;
        if(j_msg["board"].is_array()){
            vector<int> rows;
            
            vector<vector<char>> board;
            for (auto& row_val : j_msg["board"]) {
                vector<char> board_row;
                int row = 0, col = 0;
                for (auto& col_val : row_val) {
                    ++col;
                    if(col_val.is_string()){
                        string brick_ident = col_val.get<std::string>();
                        char brick = brick_ident.c_str()[0];
                        board_row.push_back(brick);
                        row |= (1 << (10 - col));
                    }else{
                        board_row.push_back(' ');
                    }
                }
                rows.push_back(row);
                board.push_back(board_row);
            }

            std::reverse(rows.begin(),rows.end());

            int max_size = 20;
            if(rows.size() > max_size){
                int cut = rows.size() - max_size;
                std::vector<decltype(rows)::value_type>(rows.begin()+cut, rows.end()).swap(rows);
            }

            tetris.m_pool.reset(10, rows.size());
            for (auto &row : rows) {
                tetris.addRow(row);
            }
        }
        if(j_msg["queue"].is_array()){
            int i = 0;
            for (auto& element : j_msg["queue"]) {
                string piece = element.get<std::string>();
                tetris.m_next[i++] = AI::getGem(m_gemMap[piece.c_str()[0]], 0);
            }
            tetris.m_next_num=i;
            tetris.newpiece();
        }
        if(j_msg["hold"].is_string()){
            string hold = j_msg["hold"].get<std::string>();
            tetris.m_pool.m_hold = m_gemMap[hold.c_str()[0]];
            //tetris.m_hold = true;
        }
        tetris.m_pool.combo = 0;
        if(j_msg["combo"].is_number()){
            int combo = j_msg["combo"].get<int>();
            tetris.m_pool.combo = combo;
        }
        if(j_msg["back_to_back"].is_boolean()){
            bool b2b = j_msg["back_to_back"].get<bool>();
            tetris.m_pool.b2b = b2b;
        }
        #ifdef BOT_DEBUG
            debug();
        #endif

        startCalculating();
    }else if( command == "suggest"){
        outputMoves();
    }else if( command == "play"){
        startCalculating();
    }else if( command == "new_piece"){
        if(j_msg["piece"].is_string()){
            string piece = j_msg["piece"].get<std::string>();
            int gemId = m_gemMap[piece.c_str()[0]];
            tetris.m_next[tetris.m_next_num++] = AI::getGem(gemId, 0);;
        }
    }else if( command == "stop"){
        // Nothing to do here
    }
    return 1;
}

/**
 * MisaMino setup from original code
 */
void Bot::setup() {
    AI::AI_Param param = {
        13, 9, 17, 10, 29, 25, 39, 2, 12, 19, 7, 24, 21, 16, 14, 19, 200
    };
    tetris.m_ai_param = param;

    if (ai.level <= 0) {
        AI::AI_Param param[2] = {
            {

                //  43,  47,  84,  62,  60,  47,  53,  21,   2,  98,  85,  13,  21,  37,  38,  0
                //  47,  66,  86,  66, -79,  42,  38,  23,  -3,  95,  74,  13,  27,  36,  37,  0
                //  45,  61,  99,  49,  63,  40,  42,  31, -27,  88,  80,  28,  28,  41,  33,  0
                //  58,  61,  90,  82,  19,  27,  44,  17,  -4,  75,  47,  20,  38,  32,  41,  0
                47, 62, 94, 90, 11, 35, 48, 19, -21, 78, 64, 20, 42, 42, 39, 300
                //  48,  65,  84,  59, -75,  39,  43,  23, -17,  92,  64,  20,  29,  37,  36,  0

            },
            {

                //  43,  47,  84,  62,  60,  47,  53,  21,   2,  98,  85,  13,  21,  37,  38,  0
                //  47,  66,  86,  66, -79,  42,  38,  23,  -3,  95,  74,  13,  27,  36,  37,  0
                //  45,  61,  99,  49,  63,  40,  42,  31, -27,  88,  80,  28,  28,  41,  33,  0 // a
                //  58,  61,  90,  82,  19,  27,  44,  17,  -4,  75,  47,  20,  38,  32,  41,  0 // b
                //  47,  62,  94,  90,  11,  35,  48,  19, -21,  78,  64,  20,  42,  42,  39,  0 // s
                //  48,  65,  84,  59, -75,  39,  43,  23, -17,  92,  64,  20,  29,  37,  36,  0 // s
                71, 12, 78, 52, 96, 37, 14, 24, 40, 99, 44, 49, 93, 25, 44, 380
            }
        };
        tetris.m_ai_param = param[0];
    }

    tetris.m_ai_param.strategy_4w = 0;
    std::string ai_name = "T-spin AI";
    if (ai.style == 1) {
        ai_name = "T-spin+ AI";
    } else if (ai.style == 2) {
        AI::setAIsettings(0, "hash", 0);
    } else if (ai.style == 3) {
        tetris.m_ai_param.tspin = tetris.m_ai_param.tspin3 = -300;
        tetris.m_ai_param.clear_useless_factor *= 0.8;
        ai_name = "Ren AI";
    } else if (ai.style == 4) {
        tetris.hold = false;
        tetris.m_ai_param.clear_useless_factor *= 0.7;
        ai_name = "non-Hold";
    } else if (ai.style == 5) {
        tetris.m_ai_param.tspin = tetris.m_ai_param.tspin3 = -300;
        tetris.m_ai_param.clear_useless_factor *= 0.8;
        tetris.m_ai_param.strategy_4w = 500;
        ai_name = "4W Ren AI";
    } else if (ai.style != -1) { //if ( ai.style == 5 ) {
        AI::AI_Param param[2] = {
            {49, 918, 176, 33, -300, -0, 0, 25, 22, 99, 41, -300, 0, 14, 290, 0}, // defence AI
            {21, 920, 66, 40, -300, -2, 0, 26, 8, 71, 13, -300, 0, 7, 269, 0},
        };
        AI::setAIsettings(0, "combo", 0);
        tetris.m_ai_param = param[0];
        ai_name = "Downstack";
    }

    if (ai.style) {
        char name[200];
        sprintf(name, "%s LV%d", ai_name.c_str(), ai.level);
        tetris.m_name = name;
        #if DEBUG_LEVEL>=1
        cerr << "[debug] Name:" << tetris.m_name << std::endl;
        #endif
    }
    if (tetris.pAIName) {
        tetris.m_name = tetris.pAIName(ai.level);
    }

    if (rule.combo_table_style == 0) {
        int a[] = {0, 0, 0, 1, 1, 2};
        AI::setComboList(std::vector<int>(a, a + sizeof (a) / sizeof (*a)));
        tetris.m_ai_param.strategy_4w = 0;
        AI::setAIsettings(0, "4w", 0);
    } else if (rule.combo_table_style == 1) {
        int a[] = {0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5};
        AI::setComboList(std::vector<int>(a, a + sizeof (a) / sizeof (*a)));
    } else if (rule.combo_table_style == 2) {
        int a[] = {0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5};
        AI::setComboList(std::vector<int>(a, a + sizeof (a) / sizeof (*a)));
    } else {
        int a[] = {0, 0, 0, 1, 1, 2};
        AI::setComboList(std::vector<int>(a, a + sizeof (a) / sizeof (*a)));
    }

    tetris.m_base = AI::point(0, 30);
    tetris.env_change = 1;
    tetris.n_pieces += 1;
    tetris.total_clears += tetris.m_clearLines;
    tetris.m_clearLines = 0;
    tetris.m_attack = 0;
}

/**
 * Gets the last move sequence generated by the bot and plays them
 * on the current board. Lines are cleared, nex piece is fetched
 * and moves array is cleared.
 */
void Bot::processMoves() {
    tetris.m_state = AI::Tetris::STATE_MOVING;
    while ( tetris.ai_movs_flag == -1 && !tetris.ai_movs.movs.empty() ){
        int mov = tetris.ai_movs.movs[0];
        tetris.ai_movs.movs.erase( tetris.ai_movs.movs.begin() );
        if (0) ;
        else if (mov == AI::Moving::MOV_L) tetris.tryXMove(-1);
        else if (mov == AI::Moving::MOV_R) tetris.tryXMove( 1);
        else if (mov == AI::Moving::MOV_D) tetris.tryYMove( 1);
        else if (mov == AI::Moving::MOV_LSPIN) tetris.trySpin(1);
        else if (mov == AI::Moving::MOV_RSPIN) tetris.trySpin(3);
        else if (mov == AI::Moving::MOV_LL) { tetris.tryXXMove(-1); } //{ tetris.mov_llrr = AI::Moving::MOV_LL; }
        else if (mov == AI::Moving::MOV_RR) { tetris.tryXXMove( 1); } //{ tetris.mov_llrr = AI::Moving::MOV_RR; }
        else if (mov == AI::Moving::MOV_DD) tetris.tryYYMove( 1) ;
        else if (mov == AI::Moving::MOV_DROP) tetris.drop();
        else if (mov == AI::Moving::MOV_HOLD) {
            tetris.tryHold();
        } else if (mov == AI::Moving::MOV_SPIN2) {
            if ( AI::spin180Enable() ) {
                tetris.trySpin180();
            }
        } else if (mov == AI::Moving::MOV_REFRESH) {
            tetris.env_change = 1;
        }
    }
    tetris.clearLines();
    tetris.newpiece();
}

/**
 * Output the move found in the most recent calculation using the TBP "suggestion" msg.
 */
void Bot::outputMoves() {
    bool holdUsed = false;
    AI::Gem cur;
    std::stringstream out;
    std::vector<AI::Gem> next;
    int i, bottom = AI_POOL_MAX_H - 5;  // depends on board height from .reset() call
    for (int j = 0; j < tetris.m_next_num; ++j)
        next.push_back(tetris.m_next[j]);

    // Check if the bot is dead, then no moves are sent
    if(!tetris.alive() || tetris.ai_movs.x == AI::MovingSimple::INVALID_POS){
        json j = {
            {"type", "suggestion"},
            {"run_id", m_restarts},
            {"moves", json::array()},
            {"debug", "no moves"},
            {"isAlive", (int)tetris.alive()},
        };
        postMessageJson(j);
        return;
    }

    // Is hold in the move sequence?
    if (std::find(tetris.ai_movs.movs.begin(), tetris.ai_movs.movs.end(), AI::Moving::MOV_HOLD) != tetris.ai_movs.movs.end())
        holdUsed = true;

    // Determine current piece based on if hold was used
    if ( holdUsed ) {
        if ( tetris.m_pool.m_hold == 0 && !next.empty())
            cur = AI::getGem(next[0].num, 0);
        else
            cur = AI::getGem(tetris.m_pool.m_hold, 0);
    } else {
        cur = tetris.m_cur;
    }

    json j = {
        {"type", "suggestion"},
        {"run_id", m_restarts},
        {"moves", {
            {
                {"spin", ""},   // filled after processMoves
                {"location", {
                    {"type", std::string(1, cur.getLetter())},
                    {"orientation", m_rotateMap[tetris.ai_movs.spin]},
                    {"x", 9-(tetris.ai_movs.x+3-srs_point[cur.num][tetris.ai_movs.spin][0])}, //miror subtr -1*a+3
                    {"y", bottom-tetris.ai_movs.y-10+3-srs_point[cur.num][tetris.ai_movs.spin][1]},
                }},
            }
        }},
    };

    #ifdef BOT_DEBUG
        debug();
    #endif

    processMoves();

    // Set spin based on the last processed move
    j["moves"][0]["spin"] = (tetris.m_clearLines > 0) ? "full" : ((int)tetris.wallkick_spin ? "mini" : "none");
    
    #ifdef BOT_DEBUG
        debug();
    #endif

    tetris.m_state = AI::Tetris::STATE_READY;
    postMessageJson(j);
}

/**
 * Starts bot calculation
 * This can take a long time, so it may be interrupted via high priority
 * TBP message like suggest or stop
 */
void Bot::startCalculating() {
    std::vector<AI::Gem> next;
    for (int j = 0; j < tetris.m_next_num; ++j)
        next.push_back(tetris.m_next[j]);
    int deep = AI_TRAINING_DEEP;
    // tetris.m_hold - hold already used this round, tetris.hold - hold enabled in ruleset
    //bool canhold = !tetris.m_hold && tetris.hold;
    bool canhold = tetris.hold;
    
    AI::RunAI(tetris.ai_movs, tetris.ai_movs_flag, tetris.m_ai_param, tetris.m_pool, tetris.m_hold,
    //AI::RunAI(tetris.ai_movs, tetris.ai_movs_flag, tetris.m_ai_param, tetris.m_pool, tetris.m_pool.m_hold,
            tetris.m_cur,
            tetris.m_cur_x, tetris.m_cur_y, next, canhold, m_upcomeAtt,
            deep, tetris.ai_last_deep, ai.level, 0);
}

/**
 * Print out some info from the bot state as TBP "debug" message
 */
void Bot::debug() {
    std::stringstream out;
    std::vector<AI::Gem> next;
    for (int j = 0; j < tetris.m_next_num; ++j)
        next.push_back(tetris.m_next[j]);
    int deep = AI_TRAINING_DEEP;
    // tetris.m_hold - hold already used this round, tetris.hold - hold enabled in ruleset
    bool canhold = !tetris.m_hold && tetris.hold;
    out << "[debug] RunAI: movs:" << tetris.ai_movs.movs.size() << ", nodes:" << tetris.ai_movs.nodes << ", flag:" << tetris.ai_movs_flag << ", combo:" <<tetris.m_pool.combo <<endl;
    out << "hold:" << AI::getGem(tetris.m_pool.m_hold, 0).getLetter() << ", cur:"<< tetris.m_cur.getLetter() << " x:"<< tetris.m_cur_x<< " y:"<<tetris.m_cur_y << endl << "Next:";
    for(auto &n : next){
        out << " " << n.getLetter();
    }
    out<< " " <<((canhold)?"canhold":"NOThold")<<", Deep:"<<deep<<",last:"<<tetris.ai_last_deep<<",level:"<<ai.level<<endl;
    out << std::endl;
    int i,bottom=AI_POOL_MAX_H-5;
    for(i=AI::gem_add_y + 1; i<bottom; i++){
        unsigned long mask=512u; //(2^WIDTH-1)
        for(;mask!=0;mask=mask>>1){
            out<<( ((tetris.m_pool.m_row[i] & mask) == mask)? 2 : 0 );
            if(mask!=1)out<<',' ;
        }
        if(i!=bottom-1)out<<';'<< std::endl;
    }
    json j2 = {"debug", out.str()};
    postMessageJson(j2);
}

#pragma once
#define _ALLOW_ITERATOR_DEBUG_LEVEL_MISMATCH

#include "gamepool.h"

#include <algorithm>
#include <vector>

namespace AI {
    struct Moving
    {
        enum {
            MOV_NULL,
            MOV_L,
            MOV_R,
            MOV_LL,
            MOV_RR,
            MOV_D,
            MOV_DD,
            MOV_LSPIN,
            MOV_RSPIN,
            MOV_DROP,
            MOV_HOLD,
            MOV_SPIN2,
            MOV_REFRESH,
        };
        std::vector<int> movs;
        int x, y;
        int score, score2;
        int nodes;
        signed char spin;
        signed char wallkick_spin;
        Moving () { nodes=-1; wallkick_spin = 0; movs.reserve (16); }
        Moving ( const Moving & m ) {
            //movs.reserve (16);
            movs = m.movs;
            x = m.x;
            y = m.y;
            spin = m.spin;
            score = m.score;
            score2 = m.score2;
            wallkick_spin = m.wallkick_spin;
            nodes = m.nodes;
        }
        Moving ( const Moving & m, int _spin ) {
            movs.reserve (16);
            movs = m.movs;
            spin = _spin;
        }
        bool operator < (const Moving& _m) const {
            return score > _m.score;
        }
        bool operator == (const Moving& _m) const {
            if ( x != _m.x || y != _m.y ) return false;
            if ( spin != _m.spin ) return false;
            if ( wallkick_spin != _m.wallkick_spin ) return false;
            return true;
        }
    };
    struct MovingSimple
    {
        enum {
            MOV_NULL,
            MOV_L,
            MOV_R,
            MOV_LL,
            MOV_RR,
            MOV_D,
            MOV_DD,
            MOV_LSPIN,
            MOV_RSPIN,
            MOV_DROP,
            MOV_HOLD,
            MOV_SPIN2,
            MOV_REFRESH,
        };
        enum {
            INVALID_POS = -64,
        };
        int x, y;
        int lastmove;
        int score, score2;
        int nodes;
        signed char spin;
        signed char wallkick_spin;
        bool hold;
        MovingSimple () { nodes=-1; x = INVALID_POS; wallkick_spin = 0; lastmove = MovingSimple::MOV_NULL; }
        MovingSimple ( const Moving & m ) {
            x = m.x;
            y = m.y;
            spin = m.spin;
            score = m.score;
            score2 = m.score2;
            wallkick_spin = m.wallkick_spin;
            nodes = m.nodes;
            if (m.movs.empty()) hold = false;
            else hold = (m.movs[0] == MovingSimple::MOV_HOLD);
            if (m.movs.empty()) lastmove = MovingSimple::MOV_NULL;
            else lastmove = m.movs.back();
        }
        MovingSimple ( const MovingSimple & m ) {
            x = m.x;
            y = m.y;
            spin = m.spin;
            score = m.score;
            score2 = m.score2;
            wallkick_spin = m.wallkick_spin;
            hold = m.hold;
            lastmove = m.lastmove;
        }
        MovingSimple ( const MovingSimple & m, int _spin ) {
            lastmove = m.lastmove;
            hold = m.hold;
            spin = (signed char)_spin;
        }
        bool operator == (const MovingSimple& _m) const {
            if ( x != _m.x || y != _m.y ) return false;
            if ( spin != _m.spin ) return false;
            if ( lastmove != _m.lastmove ) return false;
            if ( hold != _m.hold ) return false;
            if ( wallkick_spin != _m.wallkick_spin ) return false;
            return true;
        }
        bool operator < (const MovingSimple& _m) const {
            return score > _m.score;
        }
    };
    template <class T>
    struct MovList
    {
        std::vector<T> queue;
        //T queue[1024];
        int beg, end;
        MovList() {
            beg = end = 0;
        }
        MovList( size_t size ) {
            beg = end = 0;
            //queue.resize( size );
            queue.reserve( size );
        }
        void clear() {
            beg = end = 0;
            queue.clear();
        }
        size_t size() const {
            return end - beg;
        }
        T& back() {
            return queue[end-1];
        }
        void push(const T& mov) {
            queue.push_back(mov);
            //queue[end] = mov;
            ++end;
        }
        bool empty () const {
            return beg == end;
        }
        void pop(T& mov) {
            mov = queue[beg++];
        }
    };
    template <class T>
    struct MovQueue
    {
        std::vector<T> queue;
        //GameField pool;
        MovQueue() {
        }
        MovQueue( size_t size ) {
            queue.reserve( size );
        }
        void clear() {
            queue.clear();
        }
        size_t size() const {
            return queue.size();
        }
        T& front() {
            return queue.front();
        }
        T& back() {
            return queue.back();
        }
        T& append() {
            queue.push_back(T());
            return back();
        }
        void push_back() {
            std::push_heap(queue.begin(), queue.end());
        }
        void pop_back() {
            std::pop_heap(queue.begin(), queue.end());
        }
        void dec_size() {
            queue.pop_back();
        }
        void push(const T& mov) {
            queue.push_back(mov);
            std::push_heap(queue.begin(), queue.end());
        }
        bool empty () const {
            return queue.empty();
        }
        void pop(T& mov) {
            std::pop_heap(queue.begin(), queue.end());
            mov = queue.back();
            queue.pop_back();
        }
        void sort () {
            std::sort( queue.begin(), queue.end() );
        }
    };
    struct AI_Param {
        int miny_factor; // ��߸߶ȷ�
        int hole; // -����
        int open_hole; // -���Ŷ������ܲ��
        int v_transitions; // -ˮƽת��ϵ��
        int tspin3; // T3������

        int clear_efficient; // ����Ч��ϵ��
        int upcomeAtt; // -Ԥ����������ϵ��
        int h_factor; // -�߶Ȳ�ϵ��
        int hole_dis_factor2; // -������ϵ��
        int hole_dis; // -���ľ����
        //int flat_factor; // ƽֱϵ��

        int hole_dis_factor; // -������ϵ��
        int tspin; // tspinϵ��
        int hold_T; // hold T��Iϵ��
        int hold_I; // hold T��Iϵ��
        int clear_useless_factor; // ��Ч��ϵ��
        //int ready_combo; // ����Ԥ����x

        int dif_factor; //ƫ��ֵ
        int strategy_4w;
    };
    typedef char* (*AIName_t)( int level );
    typedef char* (*TetrisAI_t)(int overfield[], int field[], int field_w, int field_h, int b2b, int combo,
               char next[], char hold, bool curCanHold, char active, int x, int y, int spin,
               bool canhold, bool can180spin, int upcomeAtt, int comboTable[], int maxDepth, int level, int player);
    void setComboList( std::vector<int> combolist );
    int getComboAttack( int combo );
    void setSpin180( bool enable );
    bool spin180Enable();
    void setAIsettings(int player, const char* key, int val);

    void GenMoving(const GameField& field, std::vector<MovingSimple> & movs, Gem cur, int x, int y, bool hold);
    void FindPathMoving(const GameField& field, std::vector<Moving> & movs, Gem cur, int x, int y, bool hold);
    MovingSimple AISearch(AI_Param ai_param, const GameField& pool, int hold, Gem cur, int x, int y, const std::vector<Gem>& next, bool canhold, int upcomeAtt, int maxDeep, int & searchDeep, int level);
    int RunAI(Moving& ret_mov, int& flag, const AI_Param& ai_param, const GameField& pool, int hold, Gem cur, int x, int y, const std::vector<Gem>& next, bool canhold, int upcomeAtt, int maxDeep, int & searchDeep, int level, int player);
}

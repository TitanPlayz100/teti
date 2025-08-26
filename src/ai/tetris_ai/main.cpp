#include "Bot.h"

#include <iostream>
#include <string>

using namespace std;

Bot MisaBot;

extern "C" {

    // Incoming TBP json message (called from JS)
    int tbp_msg(char * msg) {
        return MisaBot.onMessage(msg);
    }

    int main() {
        MisaBot.init();
        return 0;
    }
}
var G_STATE = {
    'WELCOME_SCREEN': 0, //welcome screen
    'WELCOME_SCREEN_BUZZ': 1, //welcome screen - waiting on tghe user BUZZ input
    'WELCOME_SCREEN_BUZZ_SELECTED': 2, //welcome screen - BUZZ pressed - don't process any other imput
    'CHAR_SEL_SCREEN': 3, //character selection screen
    'CHAR_SEL_TIMEOUT': 4, //character selection timeout
    'GAME_PREPARE_QUESTION': 5, //state where the game is preparing the question and game level screen.
    'GAME_QUESTION_READY': 6, //the question is displayed and is waiting for an answers.
    'GAME_AFTER_QUESTION': 7, //state right after all users give their answer (or timeout)
    'GAME_FINISH': 8 //last screen in the game
};

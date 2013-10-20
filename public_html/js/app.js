window.AudioContext = window.AudioContext || window.webkitAudioContext;

var APP_SOUNDS = {
    'question_bg': 'sounds/193591__setuniman__nervous-1b40.wav'
};


/**
 * Game for sandbox for GDG DevFest 2013.
 * 
 * HTML5 technologies used:
 * - chrome USB API
 * 
 * 
 * @author Paweł Psztyć (GDG Warsaw), Wojciech Kaliciński (GDG Warsaw)
 * Follow us on Goole+! :)
 * @returns {GdgGame}
 */
function GdgGame() {
    /**
     * Reference to ChromeBuzz object
     * @type ChromeBuzz
     */
    this.buzz = null;
    /**
     * Flag indicate that the device (buzz controller) is ready.
     * @type Boolean
     */
    this.deviceReady = false;
    
    this.players = [];

    /**
     * Current game state for buzzer controller callback to recognize the sate.
     * 
     * @type Number
     */
    this.state = G_STATE.WELCOME_SCREEN;

    /**
     * Questions available in the game
     * @type Array
     */
    this.questions = [];
    /**
     * Number of rounds that the player has played
     * @type Number
     */
    this.roundsCounter = 0;
    /**
     * Rounds number in the game 
     * @type Number
     */
    this.maxRounds = 10;
    /**
     * Randomly generated question for current game.
     * @type Object
     */
    this.currentQuestion = null;
    this.currentPlayerAnswers = {};
    this.currentAnswersCount = 0;
    /**
     * Time given to the user for answer (in miliseconds)
     * @type Number
     */
    this.questionAnswerTime = 9000;
    /**
     * The time after screen dissapear after user results list has been reordered
     * @type Number
     */
    this.afterResetPlayerPositionWait = 1500;
    /**
     * The time when question is ready and players can give their answer.
     * It is performance.now() function so value if float type.
     * @type Float
     */
    this.answerStartTime = null;

    this.controllersButtons = ["red", "yellow", "green", "orange", "blue"];
    this.controllersAnswersButtons = ["blue", "orange", "green", "yellow"];
    this.audioContext = null;
    
    /**
     * 
     * @type Object of ArrayBuffers
     */
    this.audioBuffers = {};
}
/**
 * Initialize game objects, event handlers etc.
 * @returns {undefined}
 */
GdgGame.prototype.initialize = function() {
    this.observeAppActions();
    this.buzz = new ChromeBuzz();
    this.buzz.addListener(this.onBuzzEvent.bind(this));
//    var initialSounds = [
//        APP_SOUNDS.question_bg
//    ];
//    this.audio = new GameSounds({sounds: initialSounds});
};

GdgGame.prototype.playSound = function(source, volume, loop) {
//    if(typeof volume === 'undefined') volume = 1;
//    if(typeof loop === 'undefined') loop = false;
//    this.audio.play({
//        'url': source,
//        'volume': volume,
//        'loop':loop
//    });
};
GdgGame.prototype.stopSound = function(source, isFade, fadeTime) {
//    if(typeof isFade === 'undefined') isFade = false;
//    if(isFade){
//        if(typeof fadeTime === 'undefined') fadeTime = 1000;
//        this.audio.fadeOut({
//            'url': source,
//            'time': fadeTime
//        });
//    } else {
//        this.audio.stop({
//            'url': source
//        });
//    }
};

/**
 * Observer application buttons like start game etc.
 * @returns {undefined}
 */
GdgGame.prototype.observeAppActions = function() {

    function tryGameStart() {
        document.querySelector('#WelcomeScreen').classList.add('hidden');
        document.querySelector('#DeviceNotReadyScreen').classList.add('hidden');
        document.querySelector('#NoDevideScreenScreen').classList.add('hidden');
        this.state = G_STATE.CHAR_SEL_SCREEN;
        this.buzz.requestPermission();
    }

    document.querySelector('#StartGameButton').addEventListener('click', tryGameStart.bind(this), false);
    document.querySelector('#StartGameButtonRed').addEventListener('click', tryGameStart.bind(this), false);
    document.querySelector('#StartOverAgain').addEventListener('click', tryGameStart.bind(this), false);
    document.querySelector('#PermissionsAcceptButton').addEventListener('click', function(e) {
        this.buzz.requestPermission();
    }.bind(this), false);

};
/**
 * Handler for Buzz! controller events.
 * @param {ChromeBuzz} buzz Reference to ChromeBuzz object
 * @param {String} change Event type
 * @param {Object} param Additional param
 * @returns {undefined}
 */
GdgGame.prototype.onBuzzEvent = function(buzz, change, param) {
    if (!change)
        return;

    switch (change) {
        case 'interfaceready': //when device connection interface is ready to read/write data
            
            this.deviceReady = true;
            
            
            break;
        case 'initialized':
            if (param) {
                this.state = G_STATE.WELCOME_SCREEN_BUZZ;
                document.querySelector('#StartGameButton').classList.add('hidden');
                document.querySelector('#StartGameButtonRed').classList.remove('hidden');
                buzz.setupDevices(function() {
                });
            } else {

            }
            break;
        case 'hasPermission':
            if (param) {
                document.querySelector('#NoDevideScreenScreen').classList.add('hidden');
                document.querySelector('#WelcomeScreen').classList.add('hidden');
                document.querySelector('#DeviceNotReadyScreen').classList.add('hidden');
                if(!this.deviceReady){
                    buzz.setupDevices(function() {});
                } else {
                    this.gameBegin();
                }
            } else {
                //button with add permission
                document.querySelector('#NoDevideScreenScreen').classList.remove('hidden');
                document.querySelector('#WelcomeScreen').classList.add('hidden');
                document.querySelector('#DeviceNotReadyScreen').classList.add('hidden');
            }
            break;
        case 'hasDevices': //called when all devices has been found.
            if (param === 0) {
                document.querySelector('#NoDevideScreenScreen').classList.add('hidden');
                document.querySelector('#WelcomeScreen').classList.add('hidden');
                document.querySelector('#DeviceNotReadyScreen').classList.remove('hidden');
            } else {
                if (this.state !== G_STATE.WELCOME_SCREEN_BUZZ) {
                    document.querySelector('#WelcomeScreen').classList.add('hidden');
                    document.querySelector('#NoDevideScreenScreen').classList.add('hidden');
                    document.querySelector('#DeviceNotReadyScreen').classList.add('hidden');
                    this.gameBegin();
                }
            }
            break;
        case 'devicedisconnected': //called when any of the connected devices was disconnected from the wrapper.
            console.log('Disconnected device', param);
            this.handleUsbDisconnected();
            break;
        case 'devicedata': //calend after data has been received from aby controller (and any button).
//            console.log('Message from device', param);
            this.handleGameInput(param);
            break;
    };
};
GdgGame.prototype.handleUsbDisconnected = function() {
    var info = document.querySelector('#UsbDisconnectedScreen');
    var moreInfo = document.querySelector('#usbDisconnectedMoreHelpButton');
    info.classList.remove('hidden');
    var button = document.querySelector('#tryReconnect');

    function reconnect(e) {
        info.classList.add('hidden');
        button.removeEventListener('click', reconnect.bind(this), false);
        this.buzz.setupDevices(function() {
        });
    }
    
    function back(e){
        var moreInfoScreen = document.querySelector('#UsbDisconnectedMoreHelp');
        moreInfoScreen.classList.add('hidden');
        var moreInfoScreen = document.querySelector('#backUsbHelp');
        moreInfoScreen.removeEventListener('click', back.bind(this), false);
    }
    
    function displayMoreInfo(e){
        var moreInfoScreen = document.querySelector('#UsbDisconnectedMoreHelp');
        moreInfoScreen.classList.remove('hidden');
        moreInfo.removeEventListener('click', displayMoreInfo.bind(this), false);
        var moreInfoScreen = document.querySelector('#backUsbHelp');
        moreInfoScreen.addEventListener('click', back.bind(this), false);
    }
    
    moreInfo.addEventListener('click', displayMoreInfo.bind(this), false);
    button.addEventListener('click', reconnect.bind(this), false);
};
GdgGame.prototype.handleGameInput = function(param) {
//    console.log(param, this.state);
    switch (this.state) {
        case G_STATE.WELCOME_SCREEN_BUZZ:
            var resultsContainer = document.querySelector('#GameResultsScreen');
            resultsContainer.classList.add('hidden');
            
            var playerNo = this.playerRedButton(param);
            if (playerNo !== null) {
                this.state = G_STATE.WELCOME_SCREEN_BUZZ_SELECTED;
                document.querySelector('#WelcomeScreen').classList.add('hidden');
                document.querySelector('#NoDevideScreenScreen').classList.add('hidden');
                document.querySelector('#DeviceNotReadyScreen').classList.add('hidden');
                this.gameBegin();
            }
            return;
        case G_STATE.CHAR_SEL_SCREEN:
            this.handleCharacterSelectionInput(param);
            return;
        case G_STATE.CHAR_SEL_TIMEOUT:
            var playerNo = this.playerRedButton(param);
            if (playerNo !== null) {
                this.redrawPlayersSelector();
            }
            return;
        case G_STATE.GAME_QUESTION_READY:
            this.processUsersAnswers(param);
            break;
    }
};
/**
 * Returns number of player who pressed red button
 * @param {Object} param
 * @returns {Number|Null} Number of the player (zero based) or null if there is no user who pressed red button.
 */
GdgGame.prototype.playerRedButton = function(param) {
    var ctrls = param.controllersState;
    for (var i = 0, len = ctrls.length; i < len; i++) {
        var controller = ctrls[i];
        if (controller.red) {
            return i;
        }
    }
    return null;
};



/**
 * Handle input from buzzers on characters selection screen
 * @param {Object} param
 * @returns {undefined}
 */
GdgGame.prototype.handleCharacterSelectionInput = function(param) {
    var ctrls = param.controllersState;

    for (var i = 0, len = ctrls.length; i < len; i++) {
        var controller = ctrls[i];
        if (controller.red) {
            for (var j = 0, size = this.players.length; j < size; j++) {
                if (this.players[j]['#'] === i) {
                    return;
                }
            }
            this.players.push({
                '#': i,
                'device': param.device,
                'score': 0
            });
            console.log('Has ' + this.players.length + ' players in the game');
            var playerContainer = document.querySelector('#PlayersChooserScreen .player-selector > div:nth-child(' + (i + 1) + ')');
            var circle = playerContainer.querySelector('.circle');
            circle.classList.add('active');

            break;
        }
    }

    if (this.players.length === 4) {
        this.onPlayersReady();
    }
};

/**
 * Start the game.
 * 1) choose players.
 * 
 * @returns {undefined}
 */
GdgGame.prototype.gameBegin = function() {
    this.state = G_STATE.CHAR_SEL_SCREEN;
    this.drawPlayersSelector(this.onPlayersReady.bind(this));
};
/**
 * O
 * @returns {undefined}
 */
GdgGame.prototype.onPlayersReady = function() {
    
    var playersChooserScreen = document.querySelector('#PlayersChooserScreen');
    playersChooserScreen.classList.add('hidden');
    
    var circles = playersChooserScreen.querySelectorAll('#PlayersChooserScreen .player-selector > div .circle');
    for(var i=0,len=circles.length;i<len;i++){
        circles[i].classList.remove('active');
    }
    
    //we have some players here.
    //Lests start the game :)
    this.state = G_STATE.GAME_PREPARE_QUESTION;
    this.questions = [];
    this.loadQuestions(function(questions) {
        this.questions = questions;
        this.nextQuestion();
    }.bind(this));
};


/**
 * Draw screen with user selector.
 * 
 * @param {Function} callback The function called when ready.
 * @returns {undefined}
 */
GdgGame.prototype.drawPlayersSelector = function(callback) {
    if (callback) {
        this._selectedPlayersCallback = callback;
    }

    document.querySelector('#PlayersChooserScreen').classList.remove('hidden');
    var timerRow = document.querySelector('#PlayersChooserScreen .row.join-timer');
    var canvas = timerRow.querySelector('canvas');
    if (canvas) {
        canvas.parentNode.removeChild(canvas);
        canvas = null;
    }

    canvas = this.createPieTimerCanvas(200);
    timerRow.appendChild(canvas);

    function onTimerEnd() {
        if (this.state === G_STATE.CHAR_SEL_SCREEN) {
            this.onSelectPlayersEnds();
        } else {
            delete this._selectedPlayersCallback;
        }
    }
    new PieTimer(9000, {'target': canvas, 'end': onTimerEnd.bind(this)}).start();
};
/**
 * Method used when users do not join the game and someones press the red button on controller 
 * @returns {undefined}
 */
GdgGame.prototype.redrawPlayersSelector = function() {

    var info = document.querySelector('#JoinTimeout');
    info.classList.add('hidden');
    this.state = G_STATE.CHAR_SEL_SCREEN;
    this.drawPlayersSelector();
};
GdgGame.prototype.onSelectPlayersEnds = function() {
    if (this.players.length === 0) {
        this.state = G_STATE.CHAR_SEL_TIMEOUT;
        //timeout, no one has joined the game :(
        var info = document.querySelector('#JoinTimeout');
        info.classList.remove('hidden');
    } else {
        this._selectedPlayersCallback();
        //delete this._selectedPlayersCallback;
    }
};

GdgGame.prototype.createPieTimerCanvas = function(size) {
    var canvas = document.createElement('canvas');
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size + '';
    canvas.height = size + '';
    return canvas;
};

/**
 * Load questions from external file, DB etc
 * @param {Function} callback Callback function with only parameter - questions array
 * @returns {undefined}
 */
GdgGame.prototype.loadQuestions = function(callback) {
    //docelowo tutaj plik json z pytaniami pobierany przez XmlHttpRequest
    callback(GAME_QUESTIONS);
};


/**
 * Create screen with new question.
 * 1) get random question
 * 2) show category
 * 3) show question and answers.
 * @returns {undefined}
 */
GdgGame.prototype.nextQuestion = function() {

    if (this.roundsCounter === this.maxRounds) {
        this.finishGame();
        //the game is over.
        return;
    }


    this.state = G_STATE.GAME_PREPARE_QUESTION;
    var gameScreen = document.querySelector('#GameQuestionScreen');
    if (gameScreen.classList.contains('hidden')) {
        gameScreen.classList.remove('hidden');
    }
    var question = this.generateQuestion();

    if (!question) {
        //end of questions, show end screen
        this.finishGame();
        return;
    }
    this.roundsCounter++;
    this.setCategoryScreen(gameScreen, question.category, function() {
        this.setQuestionScreen(gameScreen, question);
    }.bind(this));
};
/**
 * Show category screen.
 * @param {Element} gameScreen DOM object where to place a content.
 * @param {String} category The category to show.
 * @param {Function} callback The callback function to call after category screen ends
 * @returns {undefined}
 */
GdgGame.prototype.setCategoryScreen = function(gameScreen, category, callback) {
    var content = document.querySelector('#question-category-template').content.cloneNode(true);
    content.querySelector('.category-value').innerText = category;
    content.querySelector('.current-question').innerText = '#'+this.roundsCounter;
    content.querySelector('.all-questions').innerText = this.maxRounds;
    gameScreen.appendChild(content);
    document.querySelector('.question-category-wrapper').classList.remove('start');
    document.querySelector('.question-category-wrapper').classList.add('active');
    
    
    
    setTimeout(callback, 5000);
};

GdgGame.prototype.setQuestionScreen = function(gameScreen, question) {
    this.currentQuestion = question;
    

    document.querySelector('.question-category-wrapper').classList.add('start');
    document.querySelector('.question-category-wrapper').classList.remove('active');
    gameScreen.innerHTML = '';

    var content = document.querySelector('#question-screen-template').content.cloneNode(true);
    content.querySelector('.question-value').innerText = question.question;
    content.querySelector('.answers li:nth-child(1)').innerText = question.answers[0];
    content.querySelector('.answers li:nth-child(2)').innerText = question.answers[1];
    content.querySelector('.answers li:nth-child(3)').innerText = question.answers[2];
    content.querySelector('.answers li:nth-child(4)').innerText = question.answers[3];
    var timers = this.setUserResults(content);
    gameScreen.appendChild(content);
    this.resetPlayersPosition(function() {
    }, false);

    for (var playerNo in timers) {
        timers[playerNo].setOnend(function(playerNo) {
            console.log('player reached time limit', playerNo, this.currentPlayerAnswers[playerNo]);
            if (this.currentPlayerAnswers[playerNo].result === false) {
                this.currentPlayerAnswers[playerNo].timeLimit = true;
                this.currentPlayerAnswers[playerNo].timer = null;
                this.currentAnswersCount++;

                if (this.currentAnswersCount === this.players.length) {
                    //all players has already answered the question
                    this.postPlayerAnswers();
                }
            }
        }.bind(this, playerNo));

        timers[playerNo].showCountdown = false;
        timers[playerNo].recalculateSize();
        this.currentPlayerAnswers[playerNo] = {
            result: false, //number of the answer or false if not answered
            correct: false, //true only if the user give correct answr to the question
            time: -1, //the time (performance.now() function) of the user answer
            points: 0, //amount of points the user get for the answer
            timer: timers[playerNo], //user's timer
            timeLimit: false //true if the user reached time limit
        };
    }

    window.setTimeout(function() {
        //show answers
        var lis = gameScreen.querySelectorAll('.answers li');
        for (var i = 0, len = lis.length; i < len; i++) {
            lis[i].classList.remove('hidden');
        }
        this.startAnswersTimers(timers);
        this.playSound('sounds/193591__setuniman__nervous-1b40.wav');
    }.bind(this, timers, gameScreen), 2000);
};


GdgGame.prototype.processUsersAnswers = function(param) {
    var ctrls = param.controllersState;

    //iterate throught all active players and check if they have answered in current event loop
    for (var i = 0, len = this.players.length; i < len; i++) {
        var playerNo = this.players[i]['#'];

        //No such user in the game. (must be something really wrong!)
        if (!(playerNo in this.currentPlayerAnswers)) {
            continue;
        }
        //the user has already answered to the question. Probably it's someones else turn.
        if (this.currentPlayerAnswers[playerNo].result !== false) {
            continue;
        }

        //Maybe the user reach his timeout
        if (this.currentPlayerAnswers[playerNo].timeLimit !== false) {
            console.log('Player reached timeout', playerNo);
            continue;
        }

        //player's controller.
        var controller = ctrls[playerNo];
        for (var j = 0, size = this.controllersAnswersButtons.length; j < size; j++) {
            if (controller[this.controllersAnswersButtons[j]]) {
                var answerButton = j;
                console.log('Recorded user answer (P#, button#)', playerNo, j);
                if (this.currentPlayerAnswers[playerNo].timer) { //might be right after timeout which clears the timer. So watch out.
                    try {
                        this.currentPlayerAnswers[playerNo].timer.stop();
                    } catch (e) {
                    }
                    ;
                }
                this.currentPlayerAnswers[playerNo].result = answerButton;
                this.currentPlayerAnswers[playerNo].time = performance.now();
                this.currentAnswersCount++;
                this.setPlayerAnsweredState(playerNo);
                break;
            }
        }
        if (this.currentAnswersCount === this.players.length) {
            //all players has already answered the question
            this.postPlayerAnswers();
        }
    }
};
/**
 * Set information that user answered to the question
 * @param {Number} playerNo Player number
 * @returns {undefined}
 */
GdgGame.prototype.setPlayerAnsweredState = function(playerNo) {
    var scoreContainer = document.querySelector('.players-results li:nth-child(' + (playerNo + 1) + ')');
    if (!scoreContainer)
        return;
    scoreContainer.classList.add('bg-gray');
    scoreContainer.classList.remove('bg-gray-light');
};

/**
 * Function called when players finish answering to the question (or after time's out).
 * @returns {undefined}
 */
GdgGame.prototype.postPlayerAnswers = function() {
    this.state = G_STATE.GAME_AFTER_QUESTION;
    
    this.stopSound('sounds/193591__setuniman__nervous-1b40.wav', true, 500);
    
    
    var correctAnswerIndex = this.currentQuestion.correct;

    this.displayCorrectAnswer(correctAnswerIndex);


    var callbacksCount = 0;
    var calledCallbacks = 0;

    function callPostCallback() {
        callbacksCount++;
        if (callbacksCount === calledCallbacks) {
            this.currentQuestion = null;
            this.currentPlayerAnswers = {};
            this.currentAnswersCount = 0;
            console.log("LEVEL COMPLETED");

            //place the playes in score order.
            this.resetPlayersPosition(function() {
                this.cleanQuestionScreen(function() {
                    this.nextQuestion();
                }.bind(this));
            }.bind(this));

        }
    }

    for (var i = 0, len = this.players.length; i < len; i++) {
        var playerNo = this.players[i]['#'];
        var playerResult = this.currentPlayerAnswers[playerNo];

        if (playerResult.result === correctAnswerIndex) {
            //right answer
            var levelPoints = this.calculateUserPoints(playerResult.time);
            var player = this.getPlayer(playerNo);
            if (!player)
                continue;
            calledCallbacks++;
            this.playerAnswerCorrect(playerNo, player.score, levelPoints, callPostCallback.bind(this));
            player.score += levelPoints;
        } else {
            //wrong answer
            calledCallbacks++;
            this.playerAnswerIncorrect(playerNo, callPostCallback.bind(this));
        }
    }
    console.log('processed all players answers. Waiting for callbacks');
};
/**
 * Visually highlight correct answer
 * @param {Number} correctAnswerNo Zero-based index of DOM element representing correct answer
 * @returns {undefined}
 */
GdgGame.prototype.displayCorrectAnswer = function(correctAnswerNo) {
    var scoreContainer = document.querySelectorAll('.answers li');
    for (var i = 0, len = scoreContainer.length; i < len; i++) {
        if (i === correctAnswerNo)
            continue;
        scoreContainer[i].classList.add('wrongQuestionView');
    }
};




/**
 * Get player by his controller number
 * @param {Number} controllerNumber
 * @returns {Object|null}
 */
GdgGame.prototype.getPlayer = function(controllerNumber) {
    for (var i = 0, len = this.players.length; i < len; i++) {
        if (this.players[i]['#'] === controllerNumber) {
            return this.players[i];
        }
    }
    return null;
};

/**
 * Do the visualization of giving the user points.
 * @param {Number} playerNo ID of the player (controller number)
 * @param {Number} currentScore CurrentUserScore
 * @param {Number} earnedPoints Points earned in current level
 * @param {Function} callback Callback fo call after the animation
 * @returns {undefined}
 */
GdgGame.prototype.playerAnswerCorrect = function(playerNo, currentScore, earnedPoints, callback) {
    var scoreContainer = document.querySelector('.players-results li:nth-child(' + (playerNo + 1) + ')');
    if (!scoreContainer) {
        console.error('Container unknown', '.players-results li:nth-child(' + (playerNo + 1) + ')');
        setTimeout(callback, 0);
        return;
    }
    var canvas = scoreContainer.querySelector('canvas');
    if (canvas) {
        canvas.parentNode.removeChild(canvas);
    }
    var valueContainer = scoreContainer.querySelector('.answer-counter');
    valueContainer.innerText = earnedPoints;
    var scoreValue = scoreContainer.querySelector('.player-value');

    var draw = function() {
        earnedPoints -= 2;
        currentScore += 2;
        if (earnedPoints < 0) {
            earnedPoints = 0;
            currentScore++;
        }
        scoreValue.innerText = currentScore;
        valueContainer.innerText = earnedPoints;
        if (earnedPoints <= 0) {
            setTimeout(callback, 0);
            return;
        }

        requestAnimationFrame(draw);
    };
    window.setTimeout(function() {
        requestAnimationFrame(draw);
    }, 1000);
};

/**
 * Do the visualization of the incorrect answer
 * @param {Number} playerNo ID of the player (controller number)
 * @param {Function} callback Callback fo call after the animation
 * @returns {undefined}
 */
GdgGame.prototype.playerAnswerIncorrect = function(playerNo, callback) {
    try {
        playerNo = parseInt(playerNo);
    } catch (e) {
        setTimeout(callback, 0);
        console.error('Unable to parse player ID', playerNo);
        return;
    }
    var scoreContainer = document.querySelector('.players-results li:nth-child(' + (playerNo + 1) + ')');
    if (!scoreContainer) {
        console.error('Container unknown', '.players-results li:nth-child(' + (playerNo + 1) + ')');
        setTimeout(callback, 0);
        return;
    }
    var canvas = scoreContainer.querySelector('canvas');
    var canvasParent = canvas.parentNode;
    canvasParent.removeChild(canvas);

    var content = document.querySelector('#bad-answer-symbol-template').content.cloneNode(true);
    canvasParent.appendChild(content);
    scoreContainer.classList.add('incorrect');
    setTimeout(callback, 2000);
};

/**
 * Cleenup question screen
 * @param {Function} callback
 * @returns {undefined}
 */
GdgGame.prototype.cleanQuestionScreen = function(callback) {
    var questionContainer = document.querySelector('.question-screen-wrapper');
    if (questionContainer) {
        questionContainer.classList.add('fade');
    }

    window.setTimeout(function() {

        var gameScreen = document.querySelector('#GameQuestionScreen');
        gameScreen.innerHTML = '';

        callback();
    }.bind(this), 1500);
};

/**
 * Calculate how many points the user will get for this round.
 * @param {Number} responseTime
 * @returns {Number}
 */
GdgGame.prototype.calculateUserPoints = function(responseTime) {
    if (responseTime <= 0)
        return 0;
    var maxPoints = 500;
    var playerReactionTime = responseTime - this.answerStartTime;
    var perc = (this.questionAnswerTime / playerReactionTime) / 10;
    if (perc > 1) {
        perc = 1;
    }
    if (perc < 0.05) {
        perc = 0.05;
    }

    return Math.round(maxPoints * perc);
};


/**
 * Run user timers when the question is ready and set period of time has elapsed (to give a chanse to read the questions).
 * @param {Array} timers
 * @returns {undefined}
 */
GdgGame.prototype.startAnswersTimers = function(timers) {
    for (var playerNo in timers) {
        timers[playerNo].start();
        console.log('Timer started for', playerNo);
    }
    this.state = G_STATE.GAME_QUESTION_READY;
    this.answerStartTime = performance.now();
};


GdgGame.prototype.setUserResults = function(content) {
    var timers = {};

    for (var j = 0, size = this.players.length; j < size; j++) {
        var player = this.players[j];
        var playerNo = player['#'];
        var scoreContainer = content.querySelector('.players-results li:nth-child(' + (playerNo + 1) + ')');
        scoreContainer.dataset['hash'] = playerNo;
        scoreContainer.querySelector('.player-value').innerText = player.score;
        var canvas = scoreContainer.querySelector('canvas');
        timers[playerNo] = new PieTimer(this.questionAnswerTime, {'target': canvas});
        //timers[playerNo].debugSymbol = '#'+playerNo;
        scoreContainer.classList.remove('hidden');
    }
    return timers;
};



/**
 * This function will find a random question, randomly order answers and return the question object.
 * @returns {undefined}
 */
GdgGame.prototype.generateQuestion = function() {
    var questionsSize = this.questions.length;
    if (questionsSize === 0) {
        //no more questions! ups!

        return null;
    }
    var no = this.random(1, questionsSize);
    no--;
    if (questionsSize === 0) {
        return null;
    }

    var question = this.questions[no];
    this.questions.splice(no, 1);

    var correctAnswer = question.answers[0];
    question.answers.sort(function(a, b) {
        return Math.random() - 0.5;
    });
    var correct = question.answers.indexOf(correctAnswer);
    question.correct = correct;
    return question;
};
/**
 * When one round is completed replace players position in order from highest score.
 * @param {Function} callback Callback function to call after all animations ands
 * @param {Boolean} noanim Defaul FALSE. If true no animations will be applied.
 * @returns {undefined}
 */
GdgGame.prototype.resetPlayersPosition = function(callback, noanim) {
    noanim = noanim || false;
    callback = callback || function() {
    };
    if (noanim) {
        document.querySelector('ul.players-results').classList.add('noanim');
    }
    ;

    var order = this.getPlayersOrder();
    //order in this array is also players ranking
    for (var i = 0, len = order.length; i < len; i++) {
        var cls = 'result-order-' + i;
        console.log('.players-results li[data-hash="' + order[i]['#'] + '"]');
        var scoreContainer = document.querySelector('.players-results li[data-hash="' + order[i]['#'] + '"]');
        scoreContainer.classList.remove('result-order-0');
        scoreContainer.classList.remove('result-order-1');
        scoreContainer.classList.remove('result-order-2');
        scoreContainer.classList.remove('result-order-3');
        scoreContainer.classList.add(cls);
    }
    ;

    if (noanim) {
        document.querySelector('ul.players-results').classList.remove('noanim');
    }
    ;

    window.setTimeout(callback, this.afterResetPlayerPositionWait);
};

/**
 * Get current players order by score.
 * @returns {Array}
 */
GdgGame.prototype.getPlayersOrder = function() {
    var order = [];
    for (var i = 0, len = this.players.length; i < len; i++) {
        order[i] = {
            'score': this.players[i].score,
            '#': this.players[i]['#']
        };
    }

    order.sort(function(p1, p2) {
        if (p1.score > p2.score)
            return -1;
        if (p1.score < p2.score)
            return 1;
        return 0;
    });

    return order;
};

/**
 * This function should be called whe players finish the game.
 * @returns {undefined}
 */
GdgGame.prototype.finishGame = function() {
    this.state = G_STATE.GAME_FINISH;
    var list = this.getPlayersOrder();
    var gameContainer = document.querySelector('#GameQuestionScreen');
    gameContainer.classList.add('hidden');
    
    var resultsContainer = document.querySelector('#GameResultsScreen');
    for(var i=0; i<4; i++){
        var li = resultsContainer.querySelector('.player-results li:nth-child('+(i+1)+')');
        if(!li) continue;
        var score = list[i];
        if(!score){
            li.classList.add('hidden');
        } else {
            li.querySelector('.player-name').innerText = 'Player ' + (list[i]['#']+1);
            li.querySelector('.player-value').innerText =  list[i]['score'];
        }
    }
    
    resultsContainer.classList.remove('hidden');
    this.resetGame();
};

GdgGame.prototype.resetGame = function() {
    this.players = [];
    this.roundsCounter = 0;
    this.currentQuestion = null;
    this.currentPlayerAnswers = {};
    this.currentAnswersCount = 0;
    this.answerStartTime = null;
    
    this.state = G_STATE.WELCOME_SCREEN_BUZZ;
};



/**
 * Returns a random integer between min and max
 * Using Math.round() will give you a non-uniform distribution!
 * http://stackoverflow.com/a/1527820
 * @param {Number} min The minimal number
 * @param {Number} max The maximal number
 */
GdgGame.prototype.random = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


var game = new GdgGame();
game.initialize();







//document.querySelector('#bb1').addEventListener('click', function(e) {
//    var data = new Uint8Array([0, 0, 255, 255, 0, 0]);
//    var outTransferInfo = {
//        "direction": "out",
//        "endpoint": 1,
//        "data": data.buffer
//    };
//    chrome.usb.interruptTransfer(device, outTransferInfo, function(e){
//        console.log("Send data", e, arrayBufferToString(e.data));
//    });
//}, false);

//document.querySelector('#bb3').addEventListener('click', function(e) {
//    var data = new Uint8Array([0, 0, 255, 255, 0, 0]);
//    var outTransferInfo = {
//        "direction": "out",
//        "endpoint": 1,
//        "data": data.buffer
//    };
//    chrome.usb.interruptTransfer(device, outTransferInfo, function(e){
//        console.log("Send data", e, arrayBufferToString(e.data));
//    });
//});
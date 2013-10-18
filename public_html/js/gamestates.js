var G_STATE = {
    'WELCOME_SCREEN': 0, //welcome screen
    'WELCOME_SCREEN_BUZZ': 1, //welcome screen - waiting on tghe user BUZZ input
    'WELCOME_SCREEN_BUZZ_SELECTED': 2, //welcome screen - BUZZ pressed - don't process any other imput
    'CHAR_SEL_SCREEN': 3, //character selection screen
    'CHAR_SEL_TIMEOUT': 4, //character selection timeout
    'GAME_PREPARE_QUESTION': 5, //state where the game is preparing the question and game level screen.
    'GAME_QUESTION_READY': 6, //the question is displayed and is waiting for an answers.
    'GAME_AFTER_QUESTION': 7 //state right after all users give their answer (or timeout)
};


var GAME_QUESTIONS = [{
    'category': 'Systemy komputerowe',
    'question': 'Od jakiej daty liczony jest tzw. UNIX time?',
    'answers': ['1 stycznia 1970','1 stycznia 0000','1 grudnia 2010','1 stycznia 2000'] //correct answer is always 0
},
{
    'category': 'Protokół HTTP',
    'question': 'Jaki kod HTTP ma status "Moved permanently"?',
    'answers': ['301','307','404','200']
},
{
    'category': 'Protokół HTTP',
    'question': 'Co oznacza w protokole HTTP kod 404?',
    'answers': ['Not found / nie znaleziono','OK','Server Error','Redirect / przekierowanie']
},
{
    'category': 'Protokół HTTP',
    'question': 'Jaki kod HTTP ma status "Bad Request"?',
    'answers': ['400','404','500','307']
},
{
    'category': 'Protokół HTTP',
    'question': 'Co oznacza w protokole HTTP kod 418?',
    'answers': ['I’m a teapot / jestem czajniczkiem','Server Error','Not found / nie znaleziono','Redirect / przekierowanie']
},
{
    'category': 'Przeglądarki internetowe',
    'question': 'Jak nazywa się silnik renderowania, który używany jest w większości przeglądarek obecnych na smartfonach i desktopach, jak np. Chrome i Safari?',
    'answers': ['Webkit','Gecko','Trident','KHTML']
},
{
    'category': 'Przeglądarki internetowe',
    'question': 'Jak nazywa się silnik renderowania aktualnie używany w przegladarce Google Chrome?',
    'answers': ['Blink','Gecko','Trident','Webkit']
},
{
    'category': 'Przeglądarki internetowe',
    'question': 'Jak nazywała się  biblioteka renderującą HTML w środowisku KDE, na której bazie powstał wilnik webkit?',
    'answers': ['KHTML','Gecko','Trident','Blink']
},
{
    'category': 'Aplikacje internetowe',
    'question': 'W którym roku wystartowała dostępna na zaproszenie wersja beta serwisu Gmail?',
    'answers': ['2004','2005','2007','208']
},
{
    'category': 'Języki programowania',
    'question': 'Jak nazywa się nowy język programowania dla przeglądarek rozwijany przez Google, który został wymyślony specjalnie do tworzenia web aplikacji?',
    'answers': ['Dart','GWT','AppEngine','Javascript']
},
{
    'category': 'Mobilny OS',
    'question': 'Według jakiej reguły nazywane są kolejne wersje systemu Android?',
    'answers': ['Słodycze, w kolejności alfabetycznej','Nazwy mostów w San Francisco','Ulubione ciastka Larrego Page\'a','Losowo wybierany nazwy słodyczy']
},
{
    'category': 'Projektowanie stron www',
    'question': 'Jak nazywa się technika tworzenia stron internetowych, aby dynamicznie dostosowywały się do rozmiaru ekranu?',
    'answers': ['Responsive Web Design','Responsible Web Design','Screen Size Design','Optional Design']
},
{
    'category': 'Świat urządzeń mobilnych',
    'question': 'Ile modeli urządzeń z linii Nexus wypuścił do tej pory Google?',
    'answers': ['7','6','5','8']
},
{
    'category': 'Języki programowania',
    'question': 'Które środowisko uruchomieniowe jest dostępne na Google App Engine?',
    'answers': ['PHP','PERL','PDP','C#']
},
{
    'category': 'Coś dla geeka',
    'question': 'Jaka jest odpowiedź na Wielkie Pytanie o Życie, Wszechświat i całą resztę?',
    'answers': ['42','Tak','Pomidor','Czas na kawę']
},
{
    'category': 'Coś dla geeka',
    'question': 'Który reżyser został zaangażowany zarówno do zrebootowania serii Star Trek, jak i Star Wars?',
    'answers': ['J.J. Abrams','James Cameron','Roman Polański','Quentin Tarantino']
},
{
    'category': 'Coś dla geeka',
    'question': 'Jak nazywa się kontroler umożliwiające śledzenie ruchów ciała gracza w konsoli Nintendo Wii?',
    'answers': ['Wii Remote','Wii Note','Wii Move','Nintedo body']
}];
'use strict';

/**
 * EVERYDAY KNOWLEDGE & CULTURE CATEGORIES
 * Music, food, sports, literature, board games, riddles, slang, brands, art, and cars.
 */

const EVERYDAY_CATEGORIES = [
  {
    id: 'pop-music',
    name: 'POP & THROWBACK BANGERS',
    icon: '🎵',
    group: 'everyday',
    blurb: 'Chart toppers, stadium anthems, Grammy winners & music history',
    clues: [
      {
        baseValue: 200,
        clue: 'Freddie Mercury and Queen sang \"Scaramouche, Scaramouche, will you do the Fandango!\" in this six-minute operatic rock classic.',
        answer: 'Bohemian Rhapsody',
        accept: ['bohemian rhapsody']
      },
      {
        baseValue: 400,
        clue: 'This pop superstar’s billion-dollar \"Eras Tour\" celebrated over 17 years of albums from Fearless to Midnights.',
        answer: 'Taylor Swift',
        accept: ['swift']
      },
      {
        baseValue: 600,
        clue: 'Vincent Price delivers a spooky monologue and zombies dance in the street in the iconic 1983 music video for this Michael Jackson hit.',
        answer: 'Thriller',
        accept: ['thriller']
      },
      {
        baseValue: 800,
        clue: 'At age 18, she swept the 2020 Grammys alongside her brother Finneas on the strength of her hit \"bad guy.\"',
        answer: 'Billie Eilish',
        accept: ['eilish']
      },
      {
        baseValue: 1000,
        clue: 'Before going solo, Beyoncé rose to fame in the late 1990s as part of this R&B girl group behind \"Say My Name\" and \"Survivor.\"',
        answer: 'Destiny\'s Child',
        accept: ['destinys child']
      },
      {
        baseValue: 200,
        clue: 'John Lennon, Paul McCartney, George Harrison, and Ringo Starr made up which legendary English rock quartet?',
        answer: 'The Beatles',
        accept: ['beatles']
      },
      {
        baseValue: 400,
        clue: 'What Canadian superstar singer released chart-topping hits including "Blinding Lights", "Starboy", and "Can\'t Feel My Face"?',
        answer: 'The Weeknd',
        accept: ['weeknd', 'abel tesfaye']
      },
      {
        baseValue: 600,
        clue: 'What Barbados-born pop icon and Fenty Beauty billionaire performed the 2023 Super Bowl halftime show while pregnant?',
        answer: 'Rihanna',
        accept: ['robyn rihanna fenty']
      },
      {
        baseValue: 800,
        clue: 'Which 1970s Swedish pop group scored global disco hits with "Dancing Queen", "Mamma Mia", and "Waterloo"?',
        answer: 'ABBA',
        accept: ['abba']
      },
      {
        baseValue: 1000,
        clue: 'What Seattle grunge band fronted by Kurt Cobain launched alternative rock into the mainstream with 1991\'s "Smells Like Teen Spirit"?',
        answer: 'Nirvana',
        accept: ['nirvana band']
      },
      {
        baseValue: 200,
        clue: 'What king of rock and roll lived at Graceland in Memphis and had hits with "Jailhouse Rock" and "Hound Dog"?',
        answer: 'Elvis Presley',
        accept: ['elvis', 'presley']
      },
      {
        baseValue: 400,
        clue: 'What British singer-songwriter had smash hits with "Shape of You", "Bad Habits", and named his albums after mathematical symbols?',
        answer: 'Ed Sheeran',
        accept: ['sheeran']
      },
      {
        baseValue: 600,
        clue: 'What British powerhouse vocalist swept the Grammys with her breakup albums 19, 21, 25, and 30 featuring the hit "Rolling in the Deep"?',
        answer: 'Adele',
        accept: ['adele adkins']
      },
      {
        baseValue: 800,
        clue: 'Which legendary guitarist famously played the Star-Spangled Banner with distorted feedback at Woodstock in 1969?',
        answer: 'Jimi Hendrix',
        accept: ['hendrix']
      },
      {
        baseValue: 1000,
        clue: 'In 1999, what Puerto Rican singer kickstarted the Latin pop explosion with his bilingual mega-hit "Livin\' la Vida Loca"?',
        answer: 'Ricky Martin',
        accept: ['martin']
      }
    ]
  },
  {
    id: 'weird-food',
    name: 'WEIRD & WONDERFUL FOOD',
    icon: '🍕',
    group: 'everyday',
    blurb: 'Culinary trivia, food origins, spices & eating customs',
    clues: [
      {
        baseValue: 200,
        clue: 'Despite its tropical name, \"Hawaiian pizza\" topped with ham and pineapple was actually invented in 1962 in this North American country.',
        answer: 'Canada',
        accept: ['ontario canada', 'ontario']
      },
      {
        baseValue: 400,
        clue: 'Most green \"wasabi\" served outside Japan is actually food coloring mixed with mustard and this pungent root vegetable.',
        answer: 'Horseradish',
        accept: ['horse radish']
      },
      {
        baseValue: 600,
        clue: 'A quarter of the world’s supply of these nuts goes into making jars of Nutella chocolate spread.',
        answer: 'Hazelnuts',
        accept: ['hazelnut', 'filberts', 'filbert']
      },
      {
        baseValue: 800,
        clue: 'Named after American pharmacist Wilbur, this fiery scale measures the heat of chili peppers in SHU.',
        answer: 'Scoville',
        accept: ['scoville scale', 'scoville heat scale']
      },
      {
        baseValue: 1000,
        clue: 'The world’s most expensive spice by weight consists of crimson threads hand-plucked from crocus flowers.',
        answer: 'Saffron',
        accept: ['crocus sativus']
      },
      {
        baseValue: 200,
        clue: 'What popular Mexican dip made primarily from mashed ripe avocados is traditionally served with tortilla chips?',
        answer: 'Guacamole',
        accept: ['guac']
      },
      {
        baseValue: 400,
        clue: 'What sweet, viscous fluid produced by honeybees never spoils and has been found still edible inside ancient Egyptian tombs?',
        answer: 'Honey',
        accept: ['bee honey']
      },
      {
        baseValue: 600,
        clue: 'In traditional Italian cooking, pasta should be cooked until it is still slightly firm when bitten, a state called what?',
        answer: 'Al dente',
        accept: ['aldente', 'to the tooth']
      },
      {
        baseValue: 800,
        clue: 'White chocolate is not technically chocolate under FDA standards because it contains no chocolate solids, only cocoa what?',
        answer: 'Butter',
        accept: ['cocoa butter', 'fat']
      },
      {
        baseValue: 1000,
        clue: 'What rare subterranean fungi sniffed out by trained pigs and dogs in France and Italy can sell for thousands of dollars per pound?',
        answer: 'Truffles',
        accept: ['truffle', 'white truffle', 'black truffle']
      },
      {
        baseValue: 200,
        clue: 'Which fruit is the primary ingredient in traditional wine making?',
        answer: 'Grapes',
        accept: ['grape']
      },
      {
        baseValue: 400,
        clue: 'What Asian noodle soup, consisting of rich broth, noodles, chashu pork, and a soft-boiled egg, is a Japanese staple?',
        answer: 'Ramen',
        accept: ['ramen noodles']
      },
      {
        baseValue: 600,
        clue: 'From what plant do vanilla beans originate, making it the only commercially grown edible fruit in the orchid family?',
        answer: 'Orchid',
        accept: ['vanilla orchid']
      },
      {
        baseValue: 800,
        clue: 'Tofu is a protein-rich curd made from the coagulated milk of which legume?',
        answer: 'Soybeans',
        accept: ['soy', 'soya']
      },
      {
        baseValue: 1000,
        clue: 'What Japanese delicacy prepared from poisonous fugu pufferfish requires licensed chefs to avoid lethal tetrodotoxin poison?',
        answer: 'Fugu',
        accept: ['pufferfish', 'blowfish']
      }
    ]
  },
  {
    id: 'sports-records',
    name: 'SPORTS & WILD RECORDS',
    icon: '🏆',
    group: 'everyday',
    blurb: 'Championships, speed records, Olympic glory & athletic legends',
    clues: [
      {
        baseValue: 200,
        clue: 'Roll three consecutive strikes in ten-pin bowling and your scorecard awards you this festive Thanksgiving bird.',
        answer: 'Turkey',
        accept: ['a turkey']
      },
      {
        baseValue: 400,
        clue: 'Clocked at 9.58 seconds in the 100-meter dash, this Jamaican sprinter holds the title of fastest human ever recorded.',
        answer: 'Usain Bolt',
        accept: ['bolt']
      },
      {
        baseValue: 600,
        clue: 'The overall leader riding at the head of cycling’s Tour de France wears a coveted jersey of this bright color.',
        answer: 'Yellow',
        accept: ['yellow jersey', 'maillot jaune']
      },
      {
        baseValue: 800,
        clue: 'Interlocked on a white flag, how many colored rings make up the official symbol of the Olympic Games?',
        answer: '5',
        accept: ['five', 'five rings', '5 rings']
      },
      {
        baseValue: 1000,
        clue: 'A Regulation NBA basketball hoop rim hangs this exact number of feet off the hardwood floor.',
        answer: '10',
        accept: ['ten', '10 feet', 'ten feet']
      },
      {
        baseValue: 200,
        clue: 'What Argentine soccer legend captained his country to victory in the 2022 FIFA World Cup in Qatar?',
        answer: 'Lionel Messi',
        accept: ['messi', 'leo messi']
      },
      {
        baseValue: 400,
        clue: 'In golf, scoring three strokes under par on a single hole is named after this sovereign bird of prey.',
        answer: 'Albatross',
        accept: ['double eagle']
      },
      {
        baseValue: 600,
        clue: 'What American swimmer holds the all-time record for most Olympic medals won by any athlete in history, with 28 medals?',
        answer: 'Michael Phelps',
        accept: ['phelps']
      },
      {
        baseValue: 800,
        clue: 'On March 2, 1962, which NBA center scored an untouchable 100 points in a single game for the Philadelphia Warriors?',
        answer: 'Wilt Chamberlain',
        accept: ['chamberlain', 'wilt the stilt']
      },
      {
        baseValue: 1000,
        clue: 'The Vince Lombardi Trophy is awarded each year to the championship team of which American sporting event?',
        answer: 'Super Bowl',
        accept: ['the super bowl', 'nfl championship']
      },
      {
        baseValue: 200,
        clue: 'How many players are on the field for one team during a regulation baseball game?',
        answer: '9',
        accept: ['nine', '9 players']
      },
      {
        baseValue: 400,
        clue: 'What tennis Grand Slam tournament is played on traditional grass courts in southwest London every summer?',
        answer: 'Wimbledon',
        accept: ['the championships wimbledon']
      },
      {
        baseValue: 600,
        clue: 'Which boxing icon famously claimed he would "Float like a butterfly, sting like a bee"?',
        answer: 'Muhammad Ali',
        accept: ['ali', 'cassius clay']
      },
      {
        baseValue: 800,
        clue: 'A standard marathon race covers an official distance of 26 miles and this many yards.',
        answer: '385',
        accept: ['385 yards', '26.2 miles', 'three hundred eighty five']
      },
      {
        baseValue: 1000,
        clue: 'What Canadian hockey legend nicknamed "The Great One" holds 61 individual NHL records and wore jersey #99?',
        answer: 'Wayne Gretzky',
        accept: ['gretzky']
      }
    ]
  },
  {
    id: 'famous-books',
    name: 'BOOKS & PLOT TWISTS',
    icon: '📚',
    group: 'everyday',
    blurb: 'Literary classics, epic fantasy, famous opening lines & plots',
    clues: [
      {
        baseValue: 200,
        clue: 'Run straight through the brick barrier at London’s King’s Cross Station to board the Hogwarts Express at Platform nine and this fraction.',
        answer: 'Three-quarters',
        accept: ['3/4', 'three fourths', '9 3/4', 'nine and three quarters']
      },
      {
        baseValue: 400,
        clue: 'Pop quiz: In Mary Shelley’s novel, \"Frankenstein\" is NOT the stitched-together creature — it’s the last name of this scientist who built him.',
        answer: 'Victor',
        accept: ['doctor', 'dr frankenstein', 'victor frankenstein', 'scientist']
      },
      {
        baseValue: 600,
        clue: 'Posters warning \"BIG BROTHER IS WATCHING YOU\" plaster the dystopian streets of George Orwell’s novel titled after this year.',
        answer: '1984',
        accept: ['nineteen eighty four']
      },
      {
        baseValue: 800,
        clue: '\"Call me Ishmael\" opens this 1851 Herman Melville epic about Captain Ahab’s obsession with a giant white whale.',
        answer: 'Moby-Dick',
        accept: ['moby dick']
      },
      {
        baseValue: 1000,
        clue: 'In F. Scott Fitzgerald’s The Great Gatsby, Jay Gatsby stares yearningly across the bay at a light of this color at the end of Daisy’s dock.',
        answer: 'Green',
        accept: ['green light', 'the green light']
      },
      {
        baseValue: 200,
        clue: 'What J.R.R. Tolkien fantasy novel follows Bilbo Baggins joining thirteen dwarves and Gandalf to reclaim the Lonely Mountain from Smaug?',
        answer: 'The Hobbit',
        accept: ['hobbit']
      },
      {
        baseValue: 400,
        clue: 'What famous William Shakespeare tragedy features star-crossed teenage lovers from the feuding Montague and Capulet families of Verona?',
        answer: 'Romeo and Juliet',
        accept: ['romeo & juliet']
      },
      {
        baseValue: 600,
        clue: 'In The Chronicles of Narnia, siblings enter the magical winter realm through the back of what bedroom furniture piece?',
        answer: 'A wardrobe',
        accept: ['wardrobe']
      },
      {
        baseValue: 800,
        clue: 'What Victorian detective created by Sir Arthur Conan Doyle lives at 221B Baker Street in London?',
        answer: 'Sherlock Holmes',
        accept: ['sherlock', 'holmes']
      },
      {
        baseValue: 1000,
        clue: 'What Russian author wrote the epic historical novel War and Peace, as well as Anna Karenina?',
        answer: 'Leo Tolstoy',
        accept: ['tolstoy']
      },
      {
        baseValue: 200,
        clue: 'What Dr. Seuss character hates Christmas and tries to steal all the presents from Whoville alongside his dog Max?',
        answer: 'The Grinch',
        accept: ['grinch']
      },
      {
        baseValue: 400,
        clue: 'In Suzanne Collins’ The Hunger Games, protagonist Katniss Everdeen volunteers as tribute from which impoverished mining district?',
        answer: 'District 12',
        accept: ['twelve', '12']
      },
      {
        baseValue: 600,
        clue: 'What classic Lewis Carroll tale follows a young girl falling down a rabbit hole into a nonsensical fantasy realm?',
        answer: 'Alice in Wonderland',
        accept: ['alices adventures in wonderland', 'alice']
      },
      {
        baseValue: 800,
        clue: 'What American gothic author wrote "The Raven", "The Tell-Tale Heart", and "The Fall of the House of Usher"?',
        answer: 'Edgar Allan Poe',
        accept: ['poe']
      },
      {
        baseValue: 1000,
        clue: 'What French author wrote The Count of Monte Cristo and The Three Musketeers?',
        answer: 'Alexandre Dumas',
        accept: ['dumas']
      }
    ]
  },
  {
    id: 'board-games-toys',
    name: 'BOARD GAMES & TOYS',
    icon: '🎲',
    group: 'everyday',
    blurb: 'Monopoly, LEGO, D&D, Scrabble, Rubik\'s Cubes & classic toys',
    clues: [
      {
        baseValue: 200,
        clue: 'Shout this three-letter Spanish word for \"one\" before laying down your penultimate card — or prepare to draw penalty cards!',
        answer: 'UNO',
        accept: ['uno']
      },
      {
        baseValue: 400,
        clue: 'Derived from the Danish phrase \"leg godt\" (\"play well\"), these interlocking plastic bricks are the worst thing on Earth to step on barefoot.',
        answer: 'LEGO',
        accept: ['legos', 'lego bricks']
      },
      {
        baseValue: 600,
        clue: 'Mandela Effect alert! Rich Uncle Pennybags — the top-hatted mascot of Monopoly — has NEVER worn this single-lens eyepiece.',
        answer: 'A monocle',
        accept: ['monocle']
      },
      {
        baseValue: 800,
        clue: 'Hungarian architecture professor Ernő invented this 3x3 colorful twisty puzzle in 1974 with over 43 quintillion possible scrambles.',
        answer: 'Rubik\'s Cube',
        accept: ['rubiks cube', 'rubik cube', 'rubix cube']
      },
      {
        baseValue: 1000,
        clue: 'Roll a natural 20 for a critical hit on the iconic icosahedral die used in this tabletop fantasy role-playing game abbreviated D&D.',
        answer: 'Dungeons & Dragons',
        accept: ['dungeons and dragons', 'dnd']
      },
      {
        baseValue: 200,
        clue: 'In the naval guessing game Battleship, what four-letter word do you say when your opponent\'s grid guess touches open water?',
        answer: 'Miss',
        accept: ['a miss']
      },
      {
        baseValue: 400,
        clue: 'In Scrabble, which two high-value letters are worth 10 points each on the standard English board?',
        answer: 'Q and Z',
        accept: ['q z', 'z and q']
      },
      {
        baseValue: 600,
        clue: 'In Clue, murder suspect Colonel Mustard is represented on the game board by what color game piece?',
        answer: 'Yellow',
        accept: ['mustard yellow']
      },
      {
        baseValue: 800,
        clue: 'The classic Hasbro game where players carefully extract funny plastic body parts with tweezers without touching the buzzer is what?',
        answer: 'Operation',
        accept: ['operation game']
      },
      {
        baseValue: 1000,
        clue: 'In chess, moving the king two squares toward a rook and placing the rook on the square the king crossed is called what maneuver?',
        answer: 'Castling',
        accept: ['castle']
      },
      {
        baseValue: 200,
        clue: 'What popular wooden block-stacking game by Leslie Scott challenges players to remove blocks without toppling the tower?',
        answer: 'Jenga',
        accept: ['jenga game']
      },
      {
        baseValue: 400,
        clue: 'In Connect Four, what is the winning objective: drop checkers into a vertical grid to form a line of how many checkers?',
        answer: '4',
        accept: ['four', 'four in a row']
      },
      {
        baseValue: 600,
        clue: 'What game of global conquest involves moving armies between 42 territories across six continents on a world map?',
        answer: 'Risk',
        accept: ['risk game']
      },
      {
        baseValue: 800,
        clue: 'What world-famous 11.5-inch fashion doll was introduced by Mattel in 1959, created by businesswoman Ruth Handler?',
        answer: 'Barbie',
        accept: ['barbie doll']
      },
      {
        baseValue: 1000,
        clue: 'What ancient strategy board game originating in China over 2,500 years ago is played by placing black and white stones on a 19x19 grid?',
        answer: 'Go',
        accept: ['weiqi', 'baduk']
      }
    ]
  },
  {
    id: 'brands-logos',
    name: 'SECRET LOGOS & BRANDS',
    icon: '🏷️',
    group: 'everyday',
    blurb: 'Hidden corporate symbols, iconic slogans & retail giants',
    clues: [
      {
        baseValue: 200,
        clue: 'Look closely between the \"E\" and the \"x\" in the purple-and-orange FedEx logo to spot this hidden directional symbol.',
        answer: 'An arrow',
        accept: ['arrow', 'right arrow']
      },
      {
        baseValue: 400,
        clue: 'The orange smile underneath this online retail giant’s logo doubles as an arrow pointing from \"A\" all the way to \"Z.\"',
        answer: 'Amazon',
        accept: ['amazon com', 'amazon.com']
      },
      {
        baseValue: 600,
        clue: 'Graphic design student Carolyn Davidson was initially paid just $35 in 1971 to sketch the famous \"Swoosh\" logo for this sneaker brand.',
        answer: 'Nike',
        accept: ['nike inc']
      },
      {
        baseValue: 800,
        clue: 'Hidden in the white negative space of the Matterhorn mountain on a triangular Toblerone chocolate bar stands this animal, symbol of Bern.',
        answer: 'A bear',
        accept: ['bear']
      },
      {
        baseValue: 1000,
        clue: 'Long before building the Game Boy and Switch, this Japanese gaming giant was founded way back in 1889 making handmade playing cards!',
        answer: 'Nintendo',
        accept: ['nintendo co']
      },
      {
        baseValue: 200,
        clue: 'What beverage giant’s famous wavy Spencerian script logo has remained virtually unchanged since pharmacist John Pemberton’s bookkeeper drew it in 1886?',
        answer: 'Coca-Cola',
        accept: ['coke', 'coca cola']
      },
      {
        baseValue: 400,
        clue: 'What Swedish ready-to-assemble furniture retail giant is named after the initials of its founder and his childhood farm and village?',
        answer: 'IKEA',
        accept: ['ikea']
      },
      {
        baseValue: 600,
        clue: 'The golden arches of McDonald\'s form what giant letter of the alphabet?',
        answer: 'M',
        accept: ['letter m']
      },
      {
        baseValue: 800,
        clue: 'The three stripes on the athletic apparel logo of this German brand originally doubled as supportive shoe leather straps.',
        answer: 'Adidas',
        accept: ['adidas original']
      },
      {
        baseValue: 1000,
        clue: 'The four interlocked silver rings in this German luxury automobile brand\'s logo represent the merger of four historic motor companies in 1932.',
        answer: 'Audi',
        accept: ['audi ag']
      },
      {
        baseValue: 200,
        clue: 'What tech company uses a bitten fruit as its sleek corporate emblem?',
        answer: 'Apple',
        accept: ['apple inc']
      },
      {
        baseValue: 400,
        clue: 'The logo of Starbucks depicts a twin-tailed mythological sea siren, commonly called a what?',
        answer: 'Mermaid',
        accept: ['siren', 'a mermaid']
      },
      {
        baseValue: 600,
        clue: 'What popular potato chip brand features a mustachioed cartoon man named Julius Pringles on its cylindrical cans?',
        answer: 'Pringles',
        accept: ['pringles chips']
      },
      {
        baseValue: 800,
        clue: 'The three points on the famous hood star emblem of Mercedes-Benz represent motorized transportation over land, sea, and what third domain?',
        answer: 'Air',
        accept: ['in the air', 'the air']
      },
      {
        baseValue: 1000,
        clue: 'What French luxury fashion house is famous for its interlocking double "C" logo designed by its founder, Gabrielle?',
        answer: 'Chanel',
        accept: ['coco chanel']
      }
    ]
  },
  {
    id: 'famous-art',
    name: 'FAMOUS ART & MASTERPIECES',
    icon: '🎨',
    group: 'everyday',
    blurb: 'Mona Lisa, Starry Night, Sistine Chapel & art history',
    clues: [
      {
        baseValue: 200,
        clue: 'Leonardo da Vinci painted this iconic portrait of a woman with an enigmatic smile, displayed behind bulletproof glass in the Louvre.',
        answer: 'Mona Lisa',
        accept: ['the mona lisa', 'la gioconda']
      },
      {
        baseValue: 200,
        clue: 'Vincent van Gogh painted this swirling nocturnal masterpiece featuring a glowing yellow crescent moon from his asylum window in Saint-Rémy.',
        answer: 'The Starry Night',
        accept: ['starry night']
      },
      {
        baseValue: 400,
        clue: 'Michelangelo spent four grueling years painting biblical frescoes on the ceiling of this Vatican chapel.',
        answer: 'Sistine Chapel',
        accept: ['the sistine chapel']
      },
      {
        baseValue: 400,
        clue: 'What Spanish artist co-founded Cubism and painted the harrowing black-and-white anti-war masterpiece Guernica?',
        answer: 'Pablo Picasso',
        accept: ['picasso']
      },
      {
        baseValue: 600,
        clue: 'Salvador Dalí’s surrealist painting "The Persistence of Memory" is famous for depicting these melting household objects draped over tree branches.',
        answer: 'Clocks',
        accept: ['watches', 'melting clocks', 'pocket watches']
      },
      {
        baseValue: 600,
        clue: 'Edvard Munch depicted a stylized agonized figure holding its face against a blood-orange sunset sky in this 1893 expressionist work.',
        answer: 'The Scream',
        accept: ['scream']
      },
      {
        baseValue: 800,
        clue: 'What 1930 Grant Wood painting shows a stern pitchfork-holding farmer and his spinster daughter standing in front of a white farmhouse?',
        answer: 'American Gothic',
        accept: ['american gothic']
      },
      {
        baseValue: 800,
        clue: 'The 17th-century Dutch master Johannes Vermeer painted this striking portrait of a young woman wearing an exotic turban and a luminescent earring.',
        answer: 'Girl with a Pearl Earring',
        accept: ['girl with the pearl earring']
      },
      {
        baseValue: 1000,
        clue: 'Claude Monet was a pioneer of which 19th-century French art movement named after his 1872 painting "Impression, Sunrise"?',
        answer: 'Impressionism',
        accept: ['impressionist movement']
      },
      {
        baseValue: 1000,
        clue: 'What 16th-century Italian sculptor carved the 17-foot marble statue of biblical hero David before his battle with Goliath?',
        answer: 'Michelangelo',
        accept: ['michelangelo buonarroti']
      },
      {
        baseValue: 200,
        clue: 'What pop art pioneer is famous for his colorful silkscreen prints of Campbell\'s soup cans and Marilyn Monroe?',
        answer: 'Andy Warhol',
        accept: ['warhol']
      },
      {
        baseValue: 400,
        clue: 'Mexican artist Frida Kahlo is world-renowned for her vibrant, emotionally raw self-portraits and her iconic connected facial what?',
        answer: 'Unibrow',
        accept: ['eyebrows', 'her unibrow']
      },
      {
        baseValue: 600,
        clue: 'The Great Wave off Kanagawa is an iconic woodblock print created by which celebrated Japanese ukiyo-e master?',
        answer: 'Hokusai',
        accept: ['katsushika hokusai']
      },
      {
        baseValue: 800,
        clue: 'What French sculptor created the famous bronze statue "The Thinker", depicting a man resting his chin on his fist in deep contemplation?',
        answer: 'Auguste Rodin',
        accept: ['rodin']
      },
      {
        baseValue: 1000,
        clue: 'In Rembrandt\'s masterpiece "The Night Watch", what type of military civil guard company is marching out?',
        answer: 'Militia',
        accept: ['militia company', 'civic guard', 'musketeers']
      }
    ]
  },
  {
    id: 'riddles-wordplay',
    name: 'RIDDLES & BRAIN TEASERS',
    icon: '💡',
    group: 'everyday',
    blurb: 'Clever wordplay, lateral thinking puzzles & riddle classics',
    clues: [
      {
        baseValue: 200,
        clue: 'What goes up and never comes down as you celebrate your birthday every year?',
        answer: 'Your age',
        accept: ['age', 'my age']
      },
      {
        baseValue: 400,
        clue: 'Some months have 30 days and some have 31 days. How many months of the year have 28 days?',
        answer: '12',
        accept: ['all of them', 'all 12', 'every month', 'all', 'twelve']
      },
      {
        baseValue: 600,
        clue: 'Spelled forward, I am a 2,000-pound heavyweight; spelled backward, I am a three-letter word meaning the exact opposite of \"yes.\"',
        answer: 'Ton',
        accept: ['ton']
      },
      {
        baseValue: 800,
        clue: 'I have 88 keys, zero locks, and no doors — yet you can play me in a concert hall.',
        answer: 'A piano',
        accept: ['piano', 'grand piano']
      },
      {
        baseValue: 1000,
        clue: 'What is always coming on the calendar, yet the moment it gets here it becomes \"today\" — so it technically never arrives?',
        answer: 'Tomorrow',
        accept: ['tomorrow']
      },
      {
        baseValue: 200,
        clue: 'What has a head and a tail, but no body or legs?',
        answer: 'A coin',
        accept: ['coin', 'penny']
      },
      {
        baseValue: 400,
        clue: 'The more you take away from me, the larger I become. What am I?',
        answer: 'A hole',
        accept: ['hole']
      },
      {
        baseValue: 600,
        clue: 'What five-letter English word becomes shorter when you add two letters to it?',
        answer: 'Short',
        accept: ['the word short']
      },
      {
        baseValue: 800,
        clue: 'I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?',
        answer: 'An echo',
        accept: ['echo']
      },
      {
        baseValue: 1000,
        clue: 'What English word starts with "e", ends with "e", and usually contains only a single letter?',
        answer: 'An envelope',
        accept: ['envelope']
      },
      {
        baseValue: 200,
        clue: 'What has hands and a face, but cannot hold anything or smile?',
        answer: 'A clock',
        accept: ['clock', 'watch']
      },
      {
        baseValue: 400,
        clue: 'What gets wetter the more it dries?',
        answer: 'A towel',
        accept: ['towel']
      },
      {
        baseValue: 600,
        clue: 'What belongs completely to you, but everyone else uses it much more than you do?',
        answer: 'Your name',
        accept: ['name', 'my name']
      },
      {
        baseValue: 800,
        clue: 'What has many teeth, but cannot eat a single bite of food?',
        answer: 'A comb',
        accept: ['comb', 'saw', 'zipper']
      },
      {
        baseValue: 1000,
        clue: 'A cowboy rides into town on Friday, stays for three nights, and leaves on Friday. How did he do it?',
        answer: 'His horse is named Friday',
        accept: ['horse named friday', 'horse is named friday', 'friday is a horse']
      }
    ]
  },
  {
    id: 'slang-translator',
    name: 'SLANG TRANSLATOR',
    icon: '💬',
    group: 'everyday',
    blurb: 'Modern lingo, generational slang & decoded catchphrases',
    clues: [
      {
        baseValue: 200,
        clue: 'Calling LeBron James, Serena Williams, or Messi by this four-letter farm-animal acronym means they’re the \"Greatest Of All Time.\"',
        answer: 'GOAT',
        accept: ['the goat', 'g.o.a.t.']
      },
      {
        baseValue: 400,
        clue: 'Named Oxford’s 2023 Word of the Year, this four-letter slang term for effortless charm is shortened from the middle of \"charisma.\"',
        answer: 'Rizz',
        accept: ['riz']
      },
      {
        baseValue: 600,
        clue: 'Telling a chronically online gamer to step outside and reconnect with reality is summed up by the two-word phrase \"touch ___.\"',
        answer: 'Grass',
        accept: ['touch grass']
      },
      {
        baseValue: 800,
        clue: 'When someone texts \"no ___\" with a baseball hat emoji, they mean \"no lie\" or \"for real.\"',
        answer: 'Cap',
        accept: ['no cap', 'capping']
      },
      {
        baseValue: 1000,
        clue: 'Abruptly cutting off all texts and communication with someone without warning goes by this supernatural verb.',
        answer: 'Ghosting',
        accept: ['ghost', 'ghosted']
      },
      {
        baseValue: 400,
        clue: 'To fling something across a room with reckless abandon and high velocity is summarized by this 4-letter verb.',
        answer: 'Yeet',
        accept: ['yeeted']
      },
      {
        baseValue: 600,
        clue: 'Acting like your life has an epic cinematic soundtrack and everyone else is just an NPC is having \"___ Character\" energy.',
        answer: 'Main',
        accept: ['main character', 'main character syndrome']
      },
      {
        baseValue: 200,
        clue: 'If something looks suspicious or questionable in Among Us lingo, it is summarized with this 3-letter abbreviation.',
        answer: 'Sus',
        accept: ['suss']
      },
      {
        baseValue: 400,
        clue: 'When you expose someone\'s lies or spill juicy gossip with friends, you are said to "spill the ___".',
        answer: 'Tea',
        accept: ['spill the tea', 'the tea']
      },
      {
        baseValue: 600,
        clue: 'In internet slang, an "NPC" stands for this video game term applied to people who seem to follow a script without independent thought.',
        answer: 'Non-Playable Character',
        accept: ['non playable character', 'non player character']
      },
      {
        baseValue: 800,
        clue: 'When someone boasts or shows off wealth, muscles, or achievements, they are performing this gym-inspired action.',
        answer: 'Flexing',
        accept: ['flex', 'a flex']
      },
      {
        baseValue: 1000,
        clue: 'What slang word describes a social faux pas or behavior so awkward and embarrassing that it makes you physically recoil?',
        answer: 'Cringe',
        accept: ['cringey', 'cringe!']
      },
      {
        baseValue: 200,
        clue: 'What three-letter acronym is texted to indicate you are rolling on the floor laughing at a hilarious joke?',
        answer: 'ROFL',
        accept: ['lmao', 'lol']
      },
      {
        baseValue: 800,
        clue: 'When someone gives off bad or negative energy, they are said to fail the "___ check".',
        answer: 'Vibe',
        accept: ['vibe check']
      },
      {
        baseValue: 1000,
        clue: 'To be completely and undeniably in the right about an issue or opinion is to be "___", the opposite of cringe.',
        answer: 'Based',
        accept: ['based!']
      }
    ]
  },
  {
    id: 'before-and-after',
    name: 'BEFORE & AFTER MASHUPS',
    icon: '🔀',
    group: 'everyday',
    blurb: 'Clever two-clue mashups sharing a common middle word',
    clues: [
      {
        baseValue: 200,
        clue: 'SpongeBob’s tropical fruit house teams up with an Italian cheesy pie to create a controversial dinner topping.',
        answer: 'Pineapple pizza',
        accept: ['pineapple pizza']
      },
      {
        baseValue: 400,
        clue: 'Taylor Swift’s record-breaking concert tour merges with the French cycling race featuring a yellow jersey.',
        answer: 'Eras Tour de France',
        accept: ['the eras tour de france']
      },
      {
        baseValue: 600,
        clue: 'George Orwell’s dystopian \"Watching You\" dictator joins a Nintendo fighting game starring Mario, Link, and Pikachu.',
        answer: 'Big Brother Super Smash Bros',
        accept: ['big brother smash bros']
      },
      {
        baseValue: 800,
        clue: 'A flaky French crescent pastry rolls right into a classic hardware tool with an adjustable jaw for tightening bolts.',
        answer: 'Croissant crescent wrench',
        accept: ['crescent roll wrench']
      },
      {
        baseValue: 1000,
        clue: 'Cookie Monster’s blue children’s TV avenue collides with Capcom’s arcade fighting game known for \"Hadouken!\"',
        answer: 'Sesame Street Fighter',
        accept: ['sesame street fighter']
      },
      {
        baseValue: 200,
        clue: 'The Dark Knight of Gotham City combines with a nocturnal flying mammal to form an aerial winged superhero.',
        answer: 'Batman',
        accept: ['bat man']
      },
      {
        baseValue: 400,
        clue: 'A circular sweet breakfast fried dough with a hole merges with a hole in the ground filled with water.',
        answer: 'Doughnut hole in one',
        accept: ['donut hole in one']
      },
      {
        baseValue: 600,
        clue: 'Apple\'s handheld smartphone links with a traditional landline telephone booth on a British street corner.',
        answer: 'iPhone booth',
        accept: ['iphone phone booth']
      },
      {
        baseValue: 800,
        clue: 'A yellow cartoon family from Springfield combines with a courtroom jury selection procedure.',
        answer: 'The Simpsons jury duty',
        accept: ['simpsons trial']
      },
      {
        baseValue: 1000,
        clue: 'An iconic green Starbucks coffee cup merges with an Olympic athletic gold medal ceremony.',
        answer: 'Starbucks coffee cup podium',
        accept: ['starbucks cup']
      },
      {
        baseValue: 200,
        clue: 'A chocolate-loving boy in a Roald Dahl factory joins a chocolate candy bar with peanut butter.',
        answer: 'Charlie and the Chocolate Factory Reese\'s',
        accept: ['charlie chocolate bar']
      },
      {
        baseValue: 400,
        clue: 'A classic game of building plastic houses on Boardwalk merges with the board game of world domination.',
        answer: 'Monopoly Risk',
        accept: ['monopoly board']
      },
      {
        baseValue: 600,
        clue: 'The red planet Mars combines with a chocolate-and-caramel candy bar produced by the Mars company.',
        answer: 'Planet Mars bar',
        accept: ['mars bar']
      },
      {
        baseValue: 800,
        clue: 'A golden Oscar statuette merges with a famous singing fish mounted on a wall plaque.',
        answer: 'Academy Award Big Mouth Billy Bass',
        accept: ['oscar billy bass']
      },
      {
        baseValue: 1000,
        clue: 'A famous painting of a smiling Florentine lady by Leonardo da Vinci meets an Italian soda brand.',
        answer: 'Mona Lisa San Pellegrino',
        accept: ['mona lisa soda']
      }
    ]
  },
  {
    id: 'cars-transport',
    name: 'CARS, PLANES & TRAINS',
    icon: '🚗',
    group: 'everyday',
    blurb: 'Supercars, jetliners, bullet trains, horsepower & speed records',
    clues: [
      {
        baseValue: 200,
        clue: 'Henry Ford made history with which 1908 vehicle, famously noting customers could have any color "so long as it is black"?',
        answer: 'Model T',
        accept: ['ford model t', 'the model t']
      },
      {
        baseValue: 200,
        clue: 'What Italian luxury sports car brand features a rearing black prancing stallion on a yellow shield logo?',
        answer: 'Ferrari',
        accept: ['scuderia ferrari']
      },
      {
        baseValue: 400,
        clue: 'The Concorde was a legendary commercial airliner capable of flying at Mach 2, faster than the speed of what?',
        answer: 'Sound',
        accept: ['the speed of sound', 'sound barrier']
      },
      {
        baseValue: 400,
        clue: 'What German automaker based in Munich is known for its blue-and-white propeller roundel emblem and the slogan "The Ultimate Driving Machine"?',
        answer: 'BMW',
        accept: ['bavarian motor works']
      },
      {
        baseValue: 600,
        clue: 'The Shinkansen, famous for its high speeds and pinpoint punctuality, is the high-speed bullet train network of which country?',
        answer: 'Japan',
        accept: ['nippon']
      },
      {
        baseValue: 600,
        clue: 'What supersonic French fighter jet or American muscle car features a running wild horse emblem, introduced by Ford in 1964?',
        answer: 'Mustang',
        accept: ['ford mustang']
      },
      {
        baseValue: 800,
        clue: 'In 1997, the twin-turbofan jet-propelled car ThrustSSC became the first land vehicle to officially break the sound barrier in which desert?',
        answer: 'Black Rock Desert',
        accept: ['nevada', 'black rock']
      },
      {
        baseValue: 800,
        clue: 'The Boeing 747, with its distinctive upper-deck hump, earned what royal airborne nickname?',
        answer: 'Queen of the Skies',
        accept: ['queen of the skies', 'jumbo jet']
      },
      {
        baseValue: 1000,
        clue: 'The Bugatti Veyron Super Sport shocked the automotive world by achieving a verified road-car top speed of over how many miles per hour?',
        answer: '267',
        accept: ['267 mph', '268', 'over 260 mph', '267.8']
      },
      {
        baseValue: 1000,
        clue: 'What high-speed magnetic levitation rail technology suspends, guides, and propels trains over tracks without physical friction?',
        answer: 'Maglev',
        accept: ['magnetic levitation']
      },
      {
        baseValue: 200,
        clue: 'What electric vehicle company founded in 2003 was named after the Serbian-American inventor of alternating current?',
        answer: 'Tesla',
        accept: ['tesla motors']
      },
      {
        baseValue: 400,
        clue: 'What iconic German beetle-shaped compact car was manufactured by Volkswagen from 1938 until 2003?',
        answer: 'The Beetle',
        accept: ['beetle', 'vw beetle', 'kafer', 'bug']
      },
      {
        baseValue: 600,
        clue: 'What famous luxury British automaker is celebrated for the "Spirit of Ecstasy" flying lady hood ornament?',
        answer: 'Rolls-Royce',
        accept: ['rolls royce']
      },
      {
        baseValue: 800,
        clue: 'Which historic 24-hour endurance sports car race has been held annually near the town of Le Mans in France since 1923?',
        answer: '24 Hours of Le Mans',
        accept: ['le mans', '24 hours of lemans']
      },
      {
        baseValue: 1000,
        clue: 'What commercial passenger aircraft built by Airbus holds the record as the world’s largest passenger airliner, featuring a full double deck?',
        answer: 'A380',
        accept: ['airbus a380', 'airbus 380']
      }
    ]
  },
  {
    id: 'mythology-folklore',
    name: 'GODS & MYTHOLOGY',
    icon: '⚡',
    group: 'history',
    blurb: 'Mount Olympus, Norse gods, Egyptian deities & folklore legends',
    clues: [
      {
        baseValue: 200,
        clue: 'In Greek mythology, what king of the Olympian gods wields a thunderbolt and rules from Mount Olympus?',
        answer: 'Zeus',
        accept: ['jupiter']
      },
      {
        baseValue: 200,
        clue: 'In Norse mythology, what hammer-wielding god of thunder protects Asgard and rides a chariot pulled by two goats?',
        answer: 'Thor',
        accept: ['thor odinson']
      },
      {
        baseValue: 400,
        clue: 'What three-headed hound in Greek mythology guards the entrance to the Underworld to prevent the dead from escaping?',
        answer: 'Cerberus',
        accept: ['kerberos', 'hound of hades']
      },
      {
        baseValue: 400,
        clue: 'In ancient Egyptian religion, what jackal-headed god presided over mummification and guided souls in the afterlife?',
        answer: 'Anubis',
        accept: ['anpu']
      },
      {
        baseValue: 600,
        clue: 'According to Greek myth, what gorgon had venomous snakes for hair and turned anyone who gazed upon her into stone?',
        answer: 'Medusa',
        accept: ['the gorgon medusa']
      },
      {
        baseValue: 600,
        clue: 'In Norse myth, Odin gave up one of his what at the well of Mimir in exchange for cosmic wisdom?',
        answer: 'Eyes',
        accept: ['his eye', 'an eye', 'one eye']
      },
      {
        baseValue: 800,
        clue: 'What legendary Greek hero had only one vulnerable spot on his heel because his mother dipped him in the River Styx while holding him there?',
        answer: 'Achilles',
        accept: ['achilles heel']
      },
      {
        baseValue: 800,
        clue: 'What winged horse sprang from the neck of Medusa after Perseus beheaded her?',
        answer: 'Pegasus',
        accept: ['the pegasus']
      },
      {
        baseValue: 1000,
        clue: 'In Egyptian mythology, the heart of the deceased was weighed against the Feather of Ma\'at to judge moral worth; if heavy, it was devoured by which monster?',
        answer: 'Ammit',
        accept: ['ammut', 'devourer of the dead']
      },
      {
        baseValue: 1000,
        clue: 'In Norse cosmology, what rainbow bridge connects Midgard (Earth) to Asgard, guarded by the god Heimdall?',
        answer: 'Bifrost',
        accept: ['the bifrost', 'bifröst']
      },
      {
        baseValue: 200,
        clue: 'In Greek mythology, what god of the sea wields a mighty three-pronged trident?',
        answer: 'Poseidon',
        accept: ['neptune']
      },
      {
        baseValue: 400,
        clue: 'What mischievous Norse trickster god is the blood-brother of Odin and father of the wolf Fenrir and world serpent Jormungandr?',
        answer: 'Loki',
        accept: ['loki laufeyson']
      },
      {
        baseValue: 600,
        clue: 'According to legend, what Greek king was granted a wish that turned everything he touched into solid gold, which quickly proved a curse?',
        answer: 'King Midas',
        accept: ['midas']
      },
      {
        baseValue: 800,
        clue: 'What mythical firebird cyclically burns itself to ashes in a nest of spices only to be reborn from its own embers?',
        answer: 'Phoenix',
        accept: ['the phoenix', 'firebird']
      },
      {
        baseValue: 1000,
        clue: 'What Titan in Greek mythology stole fire from Mount Olympus and gave it to mortal humanity, for which Zeus chained him to a rock?',
        answer: 'Prometheus',
        accept: ['prometheus the titan']
      }
    ]
  }
];

module.exports = { EVERYDAY_CATEGORIES };


'use strict';

/**
 * HISTORY & GEOGRAPHY CATEGORIES
 * Ancient civilizations, medieval knights, world capitals, landmarks, chaotic history, and maps.
 */

const HISTORY_CATEGORIES = [
  {
    id: 'chaotic-history',
    name: 'CHAOTIC HISTORY',
    icon: '⚔️',
    group: 'history',
    blurb: 'Wild historical accidents, absurd wars & strange decisions',
    clues: [
      {
        baseValue: 200,
        clue: 'In 1932, Australia deployed soldiers armed with machine guns against 20,000 crop-raiding flightless birds — and lost — in the Great War named for this animal.',
        answer: 'Emu',
        accept: ['emus', 'great emu war', 'emu war']
      },
      {
        baseValue: 200,
        clue: 'In 1788, the Austrian army engaged in the Battle of Karansebes, where confused soldiers mistakenly fought who in the dark?',
        answer: 'Themselves',
        accept: ['each other', 'their own troops', 'their own army']
      },
      {
        baseValue: 400,
        clue: 'In 1919, a burst storage tank sent a deadly 25-foot, 35-mph tidal wave of this sticky sweetener rushing through the streets of Boston.',
        answer: 'Molasses',
        accept: ['boston molasses', 'great molasses flood']
      },
      {
        baseValue: 400,
        clue: 'In 1859, the United States and the British Empire nearly went to war over San Juan Island after an American farmer shot a British what?',
        answer: 'Pig',
        accept: ['a pig', 'pig war']
      },
      {
        baseValue: 600,
        clue: 'After signing the Treaties of Tilsit in 1807, this French emperor organized a celebratory hunt that backfired when hundreds of tame rabbits swarmed and attacked him.',
        answer: 'Napoleon',
        accept: ['napoleon bonaparte', 'bonaparte']
      },
      {
        baseValue: 600,
        clue: 'The 1325 "War of the Oaken Bucket" was fought between the Italian city-states of Bologna and Modena over what stolen wooden item?',
        answer: 'A bucket',
        accept: ['bucket', 'wooden bucket', 'well bucket']
      },
      {
        baseValue: 800,
        clue: 'In July 1518, hundreds of residents in Strasbourg were struck by a mysterious mania that caused them to do this non-stop in the streets for weeks.',
        answer: 'Dance',
        accept: ['dancing', 'dancing plague']
      },
      {
        baseValue: 800,
        clue: 'In 1969, a tense soccer World Cup qualifying match sparked a real four-day armed military conflict known as the "Football War" between El Salvador and this neighbor.',
        answer: 'Honduras',
        accept: ['republic of honduras']
      },
      {
        baseValue: 1000,
        clue: 'In 1989, the Soviet Union traded 17 submarines and 3 warships for scrap in order to pay for syrup from this American cola company.',
        answer: 'Pepsi',
        accept: ['pepsico', 'pepsi cola']
      },
      {
        baseValue: 1000,
        clue: 'On August 27, 1896, the Anglo-Zanzibar War became the shortest war in recorded history when Zanzibar surrendered after roughly this many minutes.',
        answer: '38',
        accept: ['38 minutes', 'thirty eight', '40', '38 to 45']
      },
      {
        baseValue: 200,
        clue: 'During the 1773 Boston Tea Party, American colonists protested British taxes by dumping 342 chests of what beverage into the harbor?',
        answer: 'Tea',
        accept: ['british tea', 'tea leaves']
      },
      {
        baseValue: 400,
        clue: 'What Russian mystic survived poison and gunshots before eventually drowning in the freezing Malaya Nevka River in 1916?',
        answer: 'Rasputin',
        accept: ['grigori rasputin']
      },
      {
        baseValue: 600,
        clue: 'In 1871, legend claims Catherine O\'Leary\'s cow kicked over a lantern, sparking this catastrophic urban fire.',
        answer: 'Great Chicago Fire',
        accept: ['chicago fire', 'the chicago fire']
      },
      {
        baseValue: 800,
        clue: 'In 1923, German hyperinflation was so severe that citizens literally carried money in wheelbarrows, and children built towers out of stacks of what currency?',
        answer: 'Marks',
        accept: ['deutsche mark', 'papiermark', 'german marks']
      },
      {
        baseValue: 1000,
        clue: 'In 1672, an angry Dutch mob killed, roasted, and partially ate their own Prime Minister, named Johan who?',
        answer: 'de Witt',
        accept: ['johan de witt', 'dewitt', 'de witt']
      }
    ]
  },
  {
    id: 'ancient-civilizations',
    name: 'ANCIENT CIVILIZATIONS',
    icon: '🏛️',
    group: 'history',
    blurb: 'Pharaohs, gladiators, philosophy, Mesopotamian clay & ancient wonders',
    clues: [
      {
        baseValue: 200,
        clue: 'The Great Pyramid of Giza was built as a grand tomb for this Fourth Dynasty Egyptian pharaoh.',
        answer: 'Khufu',
        accept: ['cheops', 'pharaoh khufu']
      },
      {
        baseValue: 200,
        clue: 'This legendary ancient Greek city-state was famous for its fierce military culture and king Leonidas.',
        answer: 'Sparta',
        accept: ['spartans']
      },
      {
        baseValue: 400,
        clue: 'The Code of Hammurabi, one of the earliest written legal codes featuring "an eye for an eye", originated in this ancient Mesopotamian kingdom.',
        answer: 'Babylon',
        accept: ['babylonia', 'babylonian empire']
      },
      {
        baseValue: 400,
        clue: 'What massive amphitheater in Rome could seat over 50,000 spectators for gladiatorial contests and mock naval battles?',
        answer: 'The Colosseum',
        accept: ['colosseum', 'flavian amphitheatre']
      },
      {
        baseValue: 600,
        clue: 'The Rosetta Stone, discovered in 1799, allowed scholars to finally decipher this ancient pictorial Egyptian writing system.',
        answer: 'Hieroglyphics',
        accept: ['hieroglyphs', 'egyptian hieroglyphs']
      },
      {
        baseValue: 600,
        clue: 'Which great Macedonian king conquered the Persian Empire and created an empire stretching from Greece to northwestern India before dying at age 32?',
        answer: 'Alexander the Great',
        accept: ['alexander', 'alexander iii of macedon']
      },
      {
        baseValue: 800,
        clue: 'What Roman dictator was assassinated on the Ides of March (March 15, 44 BC) by a conspiracy of Roman senators including Brutus?',
        answer: 'Julius Caesar',
        accept: ['caesar', 'gaius julius caesar']
      },
      {
        baseValue: 800,
        clue: 'The Terracotta Army, featuring over 8,000 unique clay soldiers and horses, was built to guard the tomb of Qin Shi Huang, the first emperor of what nation?',
        answer: 'China',
        accept: ['ancient china']
      },
      {
        baseValue: 1000,
        clue: 'The Minoan civilization, Europe’s first advanced bronze-age society famous for the Palace of Knossos, flourished on this Mediterranean island.',
        answer: 'Crete',
        accept: ['island of crete']
      },
      {
        baseValue: 1000,
        clue: 'Cuneiform script, pressed into soft wet clay tablets using wedge-shaped reeds, was invented by this ancient civilization of southern Mesopotamia.',
        answer: 'Sumerians',
        accept: ['sumer', 'sumeria']
      },
      {
        baseValue: 200,
        clue: 'The golden death mask of which boy pharaoh was discovered intact in 1922 by archaeologist Howard Carter?',
        answer: 'King Tut',
        accept: ['tutankhamun', 'king tutankhamun']
      },
      {
        baseValue: 400,
        clue: 'What ancient Greek philosopher was sentenced to death by drinking hemlock poison for "corrupting the youth" of Athens?',
        answer: 'Socrates',
        accept: ['socrate']
      },
      {
        baseValue: 600,
        clue: 'Hannibal famously invaded Italy during the Second Punic War by marching war elephants across which European mountain range?',
        answer: 'The Alps',
        accept: ['alps', 'swiss alps']
      },
      {
        baseValue: 800,
        clue: 'What ancient temple perched atop the Acropolis of Athens was dedicated to the goddess Athena?',
        answer: 'The Parthenon',
        accept: ['parthenon']
      },
      {
        baseValue: 1000,
        clue: 'The Library of Alexandria, the ancient world\'s largest intellectual center, was located on the Mediterranean coast of which country?',
        answer: 'Egypt',
        accept: ['ptolemaic egypt']
      }
    ]
  },
  {
    id: 'medieval-history',
    name: 'MEDIEVAL KNIGHTS & CASTLES',
    icon: '🏰',
    group: 'history',
    blurb: 'Castles, chivalry, Crusades, black plagues & feudal lords',
    clues: [
      {
        baseValue: 200,
        clue: 'In 1066, William the Conqueror won this famous English battle, commemorated on the 230-foot Bayeux Tapestry.',
        answer: 'Battle of Hastings',
        accept: ['hastings', '1066 battle of hastings']
      },
      {
        baseValue: 200,
        clue: 'A defensive water-filled ditch surrounding a medieval castle wall is called a what?',
        answer: 'Moat',
        accept: ['a moat']
      },
      {
        baseValue: 400,
        clue: 'What 15th-century French peasant girl claimed divine visions and led French forces to victory at the Siege of Orleans before being burned at the stake?',
        answer: 'Joan of Arc',
        accept: ['jeanne d\'arc', 'saint joan']
      },
      {
        baseValue: 400,
        clue: 'The Black Death pandemic of 1347-1351 was caused by Yersinia pestis bacteria carried primarily by fleas living on these rodents.',
        answer: 'Rats',
        accept: ['black rats', 'rat']
      },
      {
        baseValue: 600,
        clue: 'In 1215 at Runnymede, English barons forced King John to sign this "Great Charter", establishing that even kings are bound by law.',
        answer: 'Magna Carta',
        accept: ['the magna carta']
      },
      {
        baseValue: 600,
        clue: 'A heavily armored medieval siege engine that used a massive counterweight to fling 300-pound boulders at castle walls is a what?',
        answer: 'Trebuchet',
        accept: ['trebuchets', 'catapult']
      },
      {
        baseValue: 800,
        clue: 'The legendary round table and Excalibur sword are associated with which mythical British monarch and his court at Camelot?',
        answer: 'King Arthur',
        accept: ['arthur', 'arthur pendragon']
      },
      {
        baseValue: 800,
        clue: 'The fierce Scandinavian warriors who raided European coasts in longships between the 8th and 11th centuries were known as what?',
        answer: 'Vikings',
        accept: ['norse', 'norsemen', 'viking']
      },
      {
        baseValue: 1000,
        clue: 'The Catholic military order founded in 1119 to protect Christian pilgrims in Jerusalem, famously dissolved by King Philip IV on Friday the 13th, was the Knights who?',
        answer: 'Templar',
        accept: ['knights templar', 'order of the templar']
      },
      {
        baseValue: 1000,
        clue: 'The 100 Years\' War was fought primarily between England and France, but actually lasted for how many total years?',
        answer: '116',
        accept: ['116 years', 'one hundred and sixteen', 'one hundred sixteen']
      },
      {
        baseValue: 200,
        clue: 'The social and economic hierarchy of the Middle Ages, where kings granted land to lords in exchange for military service, was called what?',
        answer: 'Feudalism',
        accept: ['feudal system']
      },
      {
        baseValue: 400,
        clue: 'A knight\'s ceremonial military combat on horseback, charging with blunted wooden lances, was called what sport?',
        answer: 'Jousting',
        accept: ['a joust', 'joust']
      },
      {
        baseValue: 600,
        clue: 'What massive fortified castle complex in London has served as a royal palace, prison, execution site, and home of the Crown Jewels for nearly 1,000 years?',
        answer: 'Tower of London',
        accept: ['the tower of london']
      },
      {
        baseValue: 800,
        clue: 'What German king was crowned the first Holy Roman Emperor by Pope Leo III on Christmas Day in the year 800?',
        answer: 'Charlemagne',
        accept: ['charles the great', 'karl der grosse']
      },
      {
        baseValue: 1000,
        clue: 'What medieval code of conduct governed the ideals of knightly honor, courage, generosity, and courtesy?',
        answer: 'Chivalry',
        accept: ['code of chivalry']
      }
    ]
  },
  {
    id: 'world-capitals',
    name: 'WORLD CAPITALS',
    icon: '🗺️',
    group: 'history',
    blurb: 'Global seats of power, geography questions & world cities',
    clues: [
      {
        baseValue: 200,
        clue: 'The Eiffel Tower and the Louvre museum are located in this French capital city.',
        answer: 'Paris',
        accept: ['city of paris']
      },
      {
        baseValue: 200,
        clue: 'Tokyo is the bustling capital city of which Asian island nation?',
        answer: 'Japan',
        accept: ['nippon']
      },
      {
        baseValue: 400,
        clue: 'It is NOT Sydney or Melbourne! This planned city serves as the official capital of Australia.',
        answer: 'Canberra',
        accept: ['city of canberra']
      },
      {
        baseValue: 400,
        clue: 'Ottawa, not Toronto or Montreal, is the national capital of which North American country?',
        answer: 'Canada',
        accept: ['dominion of canada']
      },
      {
        baseValue: 600,
        clue: 'Washington, D.C. sits on the banks of this river bordering Maryland and Virginia.',
        answer: 'Potomac River',
        accept: ['the potomac', 'potomac']
      },
      {
        baseValue: 600,
        clue: 'Brasília, an ultra-modern planned city shaped like an airplane, replaced Rio de Janeiro as the capital of this South American nation in 1960.',
        answer: 'Brazil',
        accept: ['brasil']
      },
      {
        baseValue: 800,
        clue: 'What high-altitude city, situated at over 11,900 feet in the Andes mountains, is the administrative capital of Bolivia?',
        answer: 'La Paz',
        accept: ['lapaz', 'sucre and la paz']
      },
      {
        baseValue: 800,
        clue: 'Wellington is the southernmost national capital city in the entire world, situated in this Pacific island country.',
        answer: 'New Zealand',
        accept: ['aotearoa']
      },
      {
        baseValue: 1000,
        clue: 'This city, completely enclosed within Rome, is the smallest independent sovereign state and capital in the world.',
        answer: 'Vatican City',
        accept: ['the vatican', 'holy see']
      },
      {
        baseValue: 1000,
        clue: 'Reykjavik, the northernmost capital of a sovereign nation, is the geothermal capital of which North Atlantic island nation?',
        answer: 'Iceland',
        accept: ['republic of iceland']
      },
      {
        baseValue: 200,
        clue: 'London is the historic capital city of the United Kingdom, built along the banks of this river.',
        answer: 'Thames',
        accept: ['river thames', 'the thames']
      },
      {
        baseValue: 400,
        clue: 'Berlin, reunited after the fall of its infamous Wall in 1989, is the capital of which European power?',
        answer: 'Germany',
        accept: ['deutschland']
      },
      {
        baseValue: 600,
        clue: 'What historic city on the Nile River is the largest metropolitan area in the Middle East and the capital of Egypt?',
        answer: 'Cairo',
        accept: ['al qahirah']
      },
      {
        baseValue: 800,
        clue: 'Bern, not Zurich or Geneva, serves as the federal de facto capital of which alpine nation?',
        answer: 'Switzerland',
        accept: ['swiss confederation']
      },
      {
        baseValue: 1000,
        clue: 'What city on the Chao Phraya River, known locally as Krung Thep, is the vibrant capital of Thailand?',
        answer: 'Bangkok',
        accept: ['krung thep']
      }
    ]
  },
  {
    id: 'flags-of-world',
    name: 'FLAGS OF THE WORLD',
    icon: '🚩',
    group: 'history',
    blurb: 'Vexillology, national colors, maple leaves & flag trivia',
    clues: [
      {
        baseValue: 200,
        clue: 'The national flag of Canada prominently displays an 11-pointed red leaf from this tree.',
        answer: 'Maple',
        accept: ['maple leaf', 'sugar maple']
      },
      {
        baseValue: 200,
        clue: 'The flag of Japan consists of a stark white field with a single solid red circle in the center representing this celestial body.',
        answer: 'The Sun',
        accept: ['sun', 'rising sun']
      },
      {
        baseValue: 400,
        clue: 'Nepal possesses the only national flag in the world that is not this standard geometric shape.',
        answer: 'Rectangle',
        accept: ['rectangular', 'a rectangle', 'quadrilateral', 'four sided']
      },
      {
        baseValue: 400,
        clue: 'The flag of the United Kingdom combines the crosses of St. George, St. Andrew, and St. Patrick under this popular two-word nickname.',
        answer: 'Union Jack',
        accept: ['union flag', 'the union jack']
      },
      {
        baseValue: 600,
        clue: 'How many horizontal stripes are on the official flag of the United States, representing the original Thirteen Colonies?',
        answer: '13',
        accept: ['thirteen', '13 stripes']
      },
      {
        baseValue: 600,
        clue: 'The flag of Switzerland is a white Greek cross on a red square; what international humanitarian organization reversed these colors for its logo?',
        answer: 'Red Cross',
        accept: ['the red cross', 'international red cross']
      },
      {
        baseValue: 800,
        clue: 'Mozambique has the only national flag in the world that depicts a modern military firearm: this Russian assault rifle.',
        answer: 'AK-47',
        accept: ['kalashnikov', 'ak47']
      },
      {
        baseValue: 800,
        clue: 'All the Nordic national flags (Denmark, Sweden, Norway, Finland, Iceland) share this off-center cross design named for the region.',
        answer: 'Nordic Cross',
        accept: ['scandinavian cross', 'nordic']
      },
      {
        baseValue: 1000,
        clue: 'The study of the history, symbolism, and design of flags is formally known by this 12-letter term.',
        answer: 'Vexillology',
        accept: ['vexillologist']
      },
      {
        baseValue: 1000,
        clue: 'Which Caribbean island nation is the only sovereign country in the world whose national flag contains the color purple, found on a Sisserou parrot?',
        answer: 'Dominica',
        accept: ['commonwealth of dominica']
      },
      {
        baseValue: 200,
        clue: 'The French national flag is nicknamed "Le Tricolore" because it features these three vertical color bands: blue, white, and what?',
        answer: 'Red',
        accept: ['rouge']
      },
      {
        baseValue: 400,
        clue: 'The flag of Brazil features a blue globe containing 27 white stars and a green-and-yellow background with the motto "Ordem e ___".',
        answer: 'Progresso',
        accept: ['progress', 'ordem e progresso']
      },
      {
        baseValue: 600,
        clue: 'The national flag of Mexico depicts an eagle perched on a prickly pear cactus devouring a what?',
        answer: 'Snake',
        accept: ['serpent', 'rattlesnake']
      },
      {
        baseValue: 800,
        clue: 'What African nation has a flag with a gold, black, and green diagonal chevron, famously one of only a few flags with no red, white, or blue?',
        answer: 'Jamaica',
        accept: ['jamaican flag']
      },
      {
        baseValue: 1000,
        clue: 'The Dannebrog, the national flag of this Scandinavian country, holds the Guinness World Record as the oldest continuously used national flag, dating to 1219.',
        answer: 'Denmark',
        accept: ['danish flag', 'kingdom of denmark']
      }
    ]
  },
  {
    id: 'famous-landmarks',
    name: 'WONDERS & FAMOUS LANDMARKS',
    icon: '🗼',
    group: 'history',
    blurb: 'Taj Mahal, Machu Picchu, Great Wall & global architecture',
    clues: [
      {
        baseValue: 200,
        clue: 'Mughal emperor Shah Jahan constructed this shimmering white marble mausoleum in Agra, India as a monument of eternal love for his wife.',
        answer: 'Taj Mahal',
        accept: ['the taj mahal']
      },
      {
        baseValue: 200,
        clue: 'The Statue of Liberty, dedicated in New York Harbor in 1886, was a diplomatic gift to the American people from which European country?',
        answer: 'France',
        accept: ['the french']
      },
      {
        baseValue: 400,
        clue: 'Stretching over 13,000 miles across northern borders, this stone fortification was built by Chinese dynasties to protect against nomadic invaders.',
        answer: 'Great Wall of China',
        accept: ['the great wall', 'great wall']
      },
      {
        baseValue: 400,
        clue: 'Perched 7,970 feet up in the Peruvian Andes, this 15th-century Inca citadel was brought to international fame by Hiram Bingham in 1911.',
        answer: 'Machu Picchu',
        accept: ['machupicchu']
      },
      {
        baseValue: 600,
        clue: 'Sydney Opera House, with its iconic roof shaped like billowing sailboat sails, sits in the harbor of which Australian state capital?',
        answer: 'Sydney',
        accept: ['sydney australia']
      },
      {
        baseValue: 600,
        clue: 'The ancient desert city of Petra, famous for Al-Khazneh carved directly into rose-red sandstone cliffs, is located in this Middle Eastern country.',
        answer: 'Jordan',
        accept: ['hashemite kingdom of jordan']
      },
      {
        baseValue: 800,
        clue: 'The Christ the Redeemer statue overlooks the city and beaches of Rio de Janeiro from the summit of this granite mountain.',
        answer: 'Corcovado',
        accept: ['mount corcovado']
      },
      {
        baseValue: 800,
        clue: 'The prehistoric stone circle monument Stonehenge, constructed between 3000 and 2000 BC, stands on Salisbury Plain in this country.',
        answer: 'England',
        accept: ['united kingdom', 'uk', 'britain', 'great britain']
      },
      {
        baseValue: 1000,
        clue: 'Standing 2,717 feet tall, this Dubai skyscraper opened in 2010 and remains the tallest man-made structure in the world.',
        answer: 'Burj Khalifa',
        accept: ['burj dubai']
      },
      {
        baseValue: 1000,
        clue: 'The ancient step-pyramid temple of El Castillo, built by the Maya civilization and dedicated to the feathered serpent god Kukulkan, is located at this site.',
        answer: 'Chichen Itza',
        accept: ['chichén itzá']
      },
      {
        baseValue: 200,
        clue: 'What French wrought-iron lattice tower was built on the Champ de Mars for the 1889 World’s Fair?',
        answer: 'Eiffel Tower',
        accept: ['the eiffel tower']
      },
      {
        baseValue: 400,
        clue: 'The ancient ruins of the Acropolis and Parthenon tower over which European capital city?',
        answer: 'Athens',
        accept: ['athens greece']
      },
      {
        baseValue: 600,
        clue: 'What famous bell tower in Pisa, Italy is world-renowned for its unintended four-degree tilt caused by an inadequate foundation?',
        answer: 'Leaning Tower of Pisa',
        accept: ['leaning tower', 'tower of pisa']
      },
      {
        baseValue: 800,
        clue: 'The Golden Gate Bridge, finished in 1937 and painted in "International Orange", spans the entrance to which California bay?',
        answer: 'San Francisco Bay',
        accept: ['san francisco', 'golden gate strait']
      },
      {
        baseValue: 1000,
        clue: 'What red sandstone island fortress in Moscow serves as the official residence of the President of the Russian Federation?',
        answer: 'The Kremlin',
        accept: ['kremlin', 'moscow kremlin']
      }
    ]
  },
  {
    id: 'where-is-that',
    name: 'WAIT, WHERE IS THAT?',
    icon: '🧭',
    group: 'history',
    blurb: 'Counter-intuitive geography, enclave kingdoms & weird maps',
    clues: [
      {
        baseValue: 200,
        clue: 'It isn’t Florida! Jutting farthest east into the Atlantic, this New England lobster-loving US state is actually the closest to Africa.',
        answer: 'Maine',
        accept: ['state of maine']
      },
      {
        baseValue: 200,
        clue: 'The Sahara Desert spans across the northern third of which continent?',
        answer: 'Africa',
        accept: ['north africa']
      },
      {
        baseValue: 400,
        clue: 'Containing more lakes than the rest of the world combined, this massive country borders three oceans and only one land neighbor.',
        answer: 'Canada',
        accept: ['dominion of canada']
      },
      {
        baseValue: 400,
        clue: 'The Amazon Rainforest and the Amazon River are located primarily on which continent?',
        answer: 'South America',
        accept: ['south american continent']
      },
      {
        baseValue: 600,
        clue: 'Divided by the Bosphorus Strait, this Turkish metropolis is famous for straddling two continents: Europe and Asia.',
        answer: 'Istanbul',
        accept: ['constantinople']
      },
      {
        baseValue: 600,
        clue: 'The world\'s highest uninterrupted waterfall, Angel Falls with a drop of 3,212 feet, is hidden deep in the jungles of which country?',
        answer: 'Venezuela',
        accept: ['republic of venezuela']
      },
      {
        baseValue: 800,
        clue: 'Named after Jules Verne’s submarine captain, "Point ___" in the South Pacific is the farthest spot on Earth from any dry land.',
        answer: 'Nemo',
        accept: ['point nemo']
      },
      {
        baseValue: 800,
        clue: 'Lake Baikal, containing roughly 20% of the world’s unfrozen surface fresh water, is located in the Siberian region of which country?',
        answer: 'Russia',
        accept: ['russian federation']
      },
      {
        baseValue: 1000,
        clue: 'Along with Vatican City and San Marino, this mountainous African kingdom completely surrounded by South Africa is one of only three enclaved countries.',
        answer: 'Lesotho',
        accept: ['kingdom of lesotho']
      },
      {
        baseValue: 1000,
        clue: 'The Strait of Gibraltar connects the Atlantic Ocean to the Mediterranean Sea, separating Spain from which North African country?',
        answer: 'Morocco',
        accept: ['kingdom of morocco']
      },
      {
        baseValue: 200,
        clue: 'Which U.S. state is both the westernmost and easternmost state because its Aleutian Islands cross the 180th meridian?',
        answer: 'Alaska',
        accept: ['state of alaska']
      },
      {
        baseValue: 400,
        clue: 'Mount Kilimanjaro, the highest peak in Africa at 19,341 feet, is located in this East African country.',
        answer: 'Tanzania',
        accept: ['republic of tanzania']
      },
      {
        baseValue: 600,
        clue: 'The Panama Canal cuts through the Isthmus of Panama, connecting the Atlantic Ocean with which other vast ocean?',
        answer: 'Pacific Ocean',
        accept: ['pacific', 'the pacific']
      },
      {
        baseValue: 800,
        clue: 'The world’s largest island that is not a continent is this icy territory of the Kingdom of Denmark.',
        answer: 'Greenland',
        accept: ['kalaallit nunaat']
      },
      {
        baseValue: 1000,
        clue: 'The Dead Sea, the lowest land elevation on Earth at 1,410 feet below sea level, borders Israel, the West Bank, and which kingdom?',
        answer: 'Jordan',
        accept: ['hashemite kingdom of jordan']
      }
    ]
  },
  {
    id: 'dumb-laws',
    name: 'WEIRD LAWS & RULES',
    icon: '📜',
    group: 'history',
    blurb: 'Strange historical ordinances, bizarre prohibitions & legal oddities',
    clues: [
      {
        baseValue: 200,
        clue: 'To keep subways and sidewalks spotless, importing and selling this stretchy minty candy has been restricted in Singapore since 1992.',
        answer: 'Chewing gum',
        accept: ['gum', 'bubble gum', 'bubblegum']
      },
      {
        baseValue: 200,
        clue: 'In Milan, Italy, an ancient legal statute technically requires citizens to maintain this facial expression at all times in public, except at funerals.',
        answer: 'A smile',
        accept: ['smiling', 'smile']
      },
      {
        baseValue: 400,
        clue: 'Because they get terribly lonely without a buddy, animal welfare laws in Switzerland forbid owning just a single one of these squeaky pet rodents.',
        answer: 'Guinea pig',
        accept: ['guinea pigs']
      },
      {
        baseValue: 400,
        clue: 'In Venice, Italy, tourists face hefty municipal fines if they are caught feeding these ubiquitous birds in St. Mark\'s Square.',
        answer: 'Pigeons',
        accept: ['pigeon', 'doves']
      },
      {
        baseValue: 600,
        clue: 'Famous stretches of this German federal highway system carry an advisory speed of 130 km/h — and no general upper speed limit.',
        answer: 'The Autobahn',
        accept: ['autobahn']
      },
      {
        baseValue: 600,
        clue: 'In France, a bizarre law passed in 1954 prohibited flying saucers, flying cigars, and what extraterrestrial craft from landing in vineyards?',
        answer: 'UFOs',
        accept: ['ufo', 'flying saucers', 'alien ships']
      },
      {
        baseValue: 800,
        clue: 'A 1961 publicity ordinance in Gainesville, Georgia — the "Poultry Capital of the World" — declared it illegal to eat fried chicken using anything except these.',
        answer: 'Your fingers',
        accept: ['fingers', 'hands', 'your hands', 'bare hands']
      },
      {
        baseValue: 800,
        clue: 'Under the 1986 Salmon Act in the United Kingdom, it is an official criminal offense to handle salmon in what manner?',
        answer: 'Suspiciously',
        accept: ['suspicious circumstances', 'suspicious manner', 'suspicious']
      },
      {
        baseValue: 1000,
        clue: 'Since a 1997 Texas bill passed for NASA crewmembers, American astronauts orbiting aboard the ISS have legally been able to cast these electronically from space.',
        answer: 'Votes',
        accept: ['ballots', 'a vote', 'election ballots', 'absentee ballots']
      },
      {
        baseValue: 1000,
        clue: 'In Victoria, Australia, until legal modernization, it was legally required that a person changing an electric light bulb possess a license in what trade?',
        answer: 'Electrician',
        accept: ['licensed electrician']
      },
      {
        baseValue: 200,
        clue: 'In Canada, federal currency regulations prohibit paying for a retail purchase with more than 25 of these 1-cent coins at once.',
        answer: 'Pennies',
        accept: ['penny', 'one cent coins']
      },
      {
        baseValue: 400,
        clue: 'In Thailand, stepping on any banknote or coin is a serious legal offense because the currency displays the face of whom?',
        answer: 'The King',
        accept: ['king', 'monarch', 'the king of thailand']
      },
      {
        baseValue: 600,
        clue: 'In ancient Rome, sumptuary laws strictly forbade ordinary commoners from wearing clothing dyed in this royal color.',
        answer: 'Purple',
        accept: ['tyrian purple']
      },
      {
        baseValue: 800,
        clue: 'In Blyth, California, a city ordinance stipulates that you may not wear cowboy boots in public unless you personally own at least two head of what animal?',
        answer: 'Cattle',
        accept: ['cows', 'cow']
      },
      {
        baseValue: 1000,
        clue: 'In the British Parliament, dying inside the Palace of Westminster was once falsely rumored to entitle you to what expensive state ceremony?',
        answer: 'State funeral',
        accept: ['a state funeral']
      }
    ]
  }
];

module.exports = { HISTORY_CATEGORIES };

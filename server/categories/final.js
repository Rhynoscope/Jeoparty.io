'use strict';

/**
 * FINAL JEOPARDY QUESTION POOL
 * High-stakes, dramatic, multi-disciplinary trivia clues for the championship wager phase.
 */

const FINAL_JEOPARDY_POOL = [
  {
    category: 'INVENTIONS & ACCIDENTS',
    clue: 'Engineer Percy Spencer invented the microwave oven in 1945 after noticing radar waves had melted a bar of this treat inside his pocket.',
    answer: 'Chocolate',
    accept: ['candy bar', 'chocolate bar', 'peanut cluster bar']
  },
  {
    category: 'WORLD LANDMARKS',
    clue: 'Because metal expands in summer heat, this 1,083-foot Parisian landmark grows up to six inches taller every July than in winter.',
    answer: 'The Eiffel Tower',
    accept: ['eiffel tower']
  },
  {
    category: 'MOVIE HISTORY',
    clue: 'Released in 1995 by Pixar, this buddy adventure starring Woody and Buzz was the very first feature-length film animated 100% on computers.',
    answer: 'Toy Story',
    accept: ['toy story 1']
  },
  {
    category: 'WORD ORIGINS',
    clue: 'Coined in a 1920 Czech sci-fi stage play called R.U.R., this everyday tech noun comes from the Slavic word "robota," meaning forced labor.',
    answer: 'Robot',
    accept: ['robots']
  },
  {
    category: 'ANIMAL KINGDOM',
    clue: 'Weighing as much as an elephant on its own, the tongue of this marine giant belongs to the largest animal ever known to have lived on Earth.',
    answer: 'Blue whale',
    accept: ['the blue whale']
  },
  {
    category: 'INTERNET HISTORY',
    clue: 'Uploaded on April 23, 2005 and titled "Me at the ___," an 18-second clip in front of elephant trunks became the very first video on YouTube.',
    answer: 'Zoo',
    accept: ['me at the zoo', 'san diego zoo']
  },
  {
    category: 'POP CULTURE RECORDS',
    clue: 'Released in 1982 and featuring "Billie Jean" and "Beat It," this remains the bestselling studio album in global music history.',
    answer: 'Thriller',
    accept: ['michael jackson thriller']
  },
  {
    category: 'HUMAN BODY',
    clue: 'Located inside your middle ear and named for a saddle stirrup, the stapes is the smallest one of these in the human body.',
    answer: 'Bone',
    accept: ['bones']
  },
  {
    category: 'SPACE EXPLORATION',
    clue: 'On July 20, 1969, Neil Armstrong and Buzz Aldrin landed the Apollo 11 lunar module Eagle in this basaltic moon plain.',
    answer: 'Sea of Tranquility',
    accept: ['mare tranquillitatis', 'the sea of tranquility']
  },
  {
    category: 'CLASSIC LITERATURE',
    clue: 'Published in 1818 by an 18-year-old author, this gothic masterpiece bears the subtitle "The Modern Prometheus".',
    answer: 'Frankenstein',
    accept: ['frankenstein or the modern prometheus']
  },
  {
    category: 'ANCIENT WONDERS',
    clue: 'Of the original Seven Wonders of the Ancient World, this limestone structure in Egypt is the only one that still remains intact today.',
    answer: 'Great Pyramid of Giza',
    accept: ['pyramid of khufu', 'great pyramid', 'giza pyramid']
  },
  {
    category: 'VIDEO GAME ICONS',
    clue: 'In 1980, Japanese game designer Toru Iwatani was inspired to create this iconic arcade character after looking at a pizza with a slice removed.',
    answer: 'Pac-Man',
    accept: ['pacman', 'puck man']
  },
  {
    category: 'GLOBAL GEOGRAPHY',
    clue: 'Though surrounded by Italy, this tiny enclave perched on Mount Titano claims to be the oldest surviving sovereign republic in the world.',
    answer: 'San Marino',
    accept: ['republic of san marino']
  },
  {
    category: 'CHEMISTRY & ELEMENTS',
    clue: 'With the chemical symbol Fe derived from the Latin "ferrum", this element forms the molten outer and solid inner core of planet Earth.',
    answer: 'Iron',
    accept: ['fe']
  },
  {
    category: 'FAMOUS SHIPS',
    clue: 'In 1620, this English merchant fluyt ship transported 102 Pilgrim passengers across the Atlantic to establish Plymouth Colony.',
    answer: 'The Mayflower',
    accept: ['mayflower']
  },
  {
    category: 'ICONIC MONUMENTS',
    clue: 'Sculptor Gutzon Borglum spent 14 years carving the 60-foot heads of four U.S. presidents into the granite face of this South Dakota mountain.',
    answer: 'Mount Rushmore',
    accept: ['rushmore', 'mt rushmore']
  },
  {
    category: 'MUSIC LEGENDS',
    clue: 'In 1965, Bob Dylan caused an international scandal among folk purists by walking onto the Newport Folk Festival stage with this type of guitar.',
    answer: 'Electric guitar',
    accept: ['electric', 'an electric guitar']
  },
  {
    category: 'MEDIEVAL MYSTERIES',
    clue: 'Penned in the 15th century in an undeciphered script with surreal plant drawings, this enigmatic manuscript is named for the Polish book dealer who bought it in 1912.',
    answer: 'Voynich Manuscript',
    accept: ['voynich']
  },
  {
    category: 'OCEAN DISASTERS',
    clue: 'On April 14, 1912, the RMS Titanic struck an iceberg in the North Atlantic and sank in under three hours with the loss of over this many lives.',
    answer: '1,500',
    accept: ['1500', 'fifteen hundred', '1514', 'over 1500']
  },
  {
    category: 'FOOD ORIGINS',
    clue: 'Despite common belief, French fries did not originate in France, but are historically traced to French-speaking street vendors in this neighboring nation.',
    answer: 'Belgium',
    accept: ['belgian']
  },
  {
    category: 'ASTRONOMY',
    clue: 'First recorded by Chinese astronomers in 1054 AD, the brilliant supernova explosion in the constellation Taurus created this famous nebula.',
    answer: 'Crab Nebula',
    accept: ['the crab nebula', 'm1']
  },
  {
    category: 'WORLD FLAGS',
    clue: 'Nepal is famous for having the only national flag that is not a quadrilateral; its unique design consists of two stacked what?',
    answer: 'Triangles',
    accept: ['pennants', 'two triangles', 'triangular pennants']
  },
  {
    category: 'THE RENAISSANCE',
    clue: 'Leonardo da Vinci created this famous 1490 ink drawing illustrating the ideal geometric proportions of the human body inscribed inside a circle and square.',
    answer: 'Vitruvian Man',
    accept: ['the vitruvian man']
  },
  {
    category: 'DISNEY CLASSICS',
    clue: 'In 1937, Walt Disney took a massive gamble on this film, the very first full-length cel-animated feature film in history, dubbed "Disney\'s Folly" by critics.',
    answer: 'Snow White and the Seven Dwarfs',
    accept: ['snow white', 'snow white and the seven dwarfs']
  },
  {
    category: 'ANCIENT PHILOSOPHY',
    clue: 'In The Republic, Plato described prisoners chained inside this subterranean structure who only saw shadows on a wall, mistaking them for reality.',
    answer: 'A cave',
    accept: ['cave', 'the cave', 'allegory of the cave']
  },
  {
    category: 'SCIENTIFIC DISCOVERIES',
    clue: 'In 1953 at Cambridge University, James Watson and Francis Crick determined the double-helix molecular structure of this genetic blueprint.',
    answer: 'DNA',
    accept: ['deoxyribonucleic acid']
  },
  {
    category: 'FAMOUS PLAYS',
    clue: '"To be, or not to be, that is the question" is spoken by the Prince of Denmark in Act 3, Scene 1 of this Shakespearean tragedy.',
    answer: 'Hamlet',
    accept: ['the tragedy of hamlet']
  },
  {
    category: 'PRESIDENTIAL TRIVIA',
    clue: 'He is the only person in American history to serve as both Vice President and President without ever being elected to either office.',
    answer: 'Gerald Ford',
    accept: ['ford']
  },
  {
    category: 'NATURAL WONDERS',
    clue: 'Stretching over 1,400 miles off the northeastern coast of Queensland, Australia, this is the largest living structure on planet Earth.',
    answer: 'Great Barrier Reef',
    accept: ['the great barrier reef']
  },
  {
    category: 'AVIATION MILESTONES',
    clue: 'In 1927, Charles Lindbergh made the first solo non-stop transatlantic flight from New York to Paris aboard this custom monoplane.',
    answer: 'Spirit of St. Louis',
    accept: ['the spirit of st louis']
  },
  {
    category: 'WORLD CAPITAL CITIES',
    clue: 'With an elevation of 9,350 feet in the Andes mountains, this capital of Ecuador is the closest national capital to the equator.',
    answer: 'Quito',
    accept: ['city of quito']
  },
  {
    category: 'MYTHOLOGICAL BEASTS',
    clue: 'In Greek mythology, King Minos kept this half-man, half-bull monster trapped inside an intricate subterranean labyrinth designed by Daedalus.',
    answer: 'The Minotaur',
    accept: ['minotaur']
  },
  {
    category: 'WAR HISTORY',
    clue: 'On June 6, 1944, Allied forces launched Operation Overlord, the largest amphibious invasion in history, landing on the beaches of this French region.',
    answer: 'Normandy',
    accept: ['normandy beaches', 'd-day']
  },
  {
    category: 'BOARD GAME ORIGINS',
    clue: 'Monopoly was originally patented in 1904 by feminist anti-monopolist Lizzie Magie under this ironic title designed to teach the evils of land monopolies.',
    answer: 'The Landlord\'s Game',
    accept: ['landlords game', 'the landlords game']
  },
  {
    category: 'FAMOUS SCIENTISTS',
    clue: 'She is the only person in history to win Nobel Prizes in two different scientific fields: Physics in 1903 and Chemistry in 1911.',
    answer: 'Marie Curie',
    accept: ['curie', 'madame curie']
  }
];

module.exports = { FINAL_JEOPARDY_POOL };

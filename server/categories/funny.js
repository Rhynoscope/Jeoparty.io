'use strict';

/**
 * FUNNY & RIDICULOUS CATEGORIES
 * Designed for comedy, weird facts, memes, internet culture, and bizarre trivia.
 */

const FUNNY_CATEGORIES = [
  {
    id: 'nature-is-broken',
    name: 'WHAT IS WRONG WITH NATURE?',
    icon: '🐸',
    group: 'funny',
    blurb: 'Bizarre biological adaptations, weird animal facts & broken evolution',
    clues: [
      {
        baseValue: 200,
        clue: 'Wombats are the only known creatures in the world whose poop comes out in this geometric shape.',
        answer: 'Cube',
        accept: ['cubes', 'cubic', 'square', 'squares', 'cube shaped']
      },
      {
        baseValue: 200,
        clue: 'When threatened, this slow-moving South American mammal can hold its breath underwater for up to 40 minutes — longer than dolphins.',
        answer: 'Sloth',
        accept: ['sloths', 'three toed sloth', 'two toed sloth']
      },
      {
        baseValue: 400,
        clue: 'Horned lizards can defend themselves against predators by shooting this bodily fluid directly from their eyes.',
        answer: 'Blood',
        accept: ['their blood', 'eye blood', 'bloody stream']
      },
      {
        baseValue: 400,
        clue: 'To avoid being swept away while sleeping, sea otters hold each other\'s what?',
        answer: 'Paws',
        accept: ['hands', 'feet', 'front paws']
      },
      {
        baseValue: 600,
        clue: 'This freshwater creature is technically immortal because its cells can perpetually regenerate without aging.',
        answer: 'Hydra',
        accept: ['hydras', 'freshwater hydra']
      },
      {
        baseValue: 600,
        clue: 'Male nursery web spiders wrap gifts of dead flies in silk to present to females, but often wrap this disappointing substitute when lazy.',
        answer: 'Empty seed',
        accept: ['twigs', 'seeds', 'empty silk', 'rocks', 'pebbles', 'nothing']
      },
      {
        baseValue: 800,
        clue: 'The wood frog survives harsh Alaskan winters by allowing up to two-thirds of its body water to do this completely.',
        answer: 'Freeze',
        accept: ['freeze solid', 'turn to ice', 'freeze into ice', 'ice']
      },
      {
        baseValue: 800,
        clue: 'Butterflies taste their potential food using taste receptors located on which body parts?',
        answer: 'Feet',
        accept: ['their feet', 'legs', 'foot', 'their legs']
      },
      {
        baseValue: 1000,
        clue: 'When attacked, the sea cucumber can defensively eject its own what out of its rear end to tangle predators, then regrow them later?',
        answer: 'Internal organs',
        accept: ['organs', 'intestines', 'guts', 'viscera']
      },
      {
        baseValue: 1000,
        clue: 'The Greenland shark can live for over 400 years, but doesn\'t even reach sexual maturity until around this century milestone age.',
        answer: '150',
        accept: ['150 years', '150 years old', '140', '160', 'a hundred and fifty']
      },
      {
        baseValue: 200,
        clue: 'Because of their neck anatomy, cows are physically capable of walking upstairs, but cannot walk in this direction.',
        answer: 'Downstairs',
        accept: ['down', 'down stairs', 'down the stairs']
      },
      {
        baseValue: 400,
        clue: 'Unlike mammals whose teeth grow in their mouths, this crustacean has teeth located inside its stomach to grind food.',
        answer: 'Lobster',
        accept: ['lobsters', 'crab', 'crabs']
      },
      {
        baseValue: 600,
        clue: 'Koalas eat eucalyptus leaves which are so low in nutrients that koalas must spend up to how many hours sleeping each day?',
        answer: '20',
        accept: ['20 hours', '18', '22', 'eighteen to twenty-two', 'twenty']
      },
      {
        baseValue: 800,
        clue: 'A group of wild flamingos is officially and fabulously known by this noun.',
        answer: 'Flamboyance',
        accept: ['a flamboyance', 'flamboyancy']
      },
      {
        baseValue: 1000,
        clue: 'The axolotl can regenerate limbs, heart tissue, and even portions of this vital thinking organ without scarring.',
        answer: 'Brain',
        accept: ['the brain', 'its brain', 'head']
      }
    ]
  },
  {
    id: 'internet-brainrot',
    name: 'INTERNET BRAINROT',
    icon: '🗿',
    group: 'funny',
    blurb: 'Memes, absurd TikTok trends, viral soundbites & modern net lore',
    clues: [
      {
        baseValue: 200,
        clue: 'Originating as an Easter Island statue emoji, this stone face emoji represents stoicism, deadpan humor, or "Chad" energy.',
        answer: 'Moai',
        accept: ['moyai', 'moai emoji', 'stone face', 'easter island', 'easter island head']
      },
      {
        baseValue: 200,
        clue: 'The viral YouTube series by DaFuq!?Boom featuring animated heads singing inside toilets is named this.',
        answer: 'Skibidi Toilet',
        accept: ['skibidi', 'skibidi toilets']
      },
      {
        baseValue: 400,
        clue: 'In Gen Z and Gen Alpha slang, having natural charisma or flirtation skills is abbreviated to this 4-letter word derived from "charisma".',
        answer: 'Rizz',
        accept: ['riz']
      },
      {
        baseValue: 400,
        clue: 'Internet meme culture dubbed this midwestern U.S. state the ultimate chaotic wasteland where impossible supernatural events occur.',
        answer: 'Ohio',
        accept: ['only in ohio', 'the state of ohio']
      },
      {
        baseValue: 600,
        clue: 'The viral animated cat singing a relentless loop of "chipi chipi chapa chapa" hails from a 2003 song by Chilean singer Christell named this.',
        answer: 'Dubidubidu',
        accept: ['chipi chipi', 'dubi dubi du', 'chipi chipi chapa chapa']
      },
      {
        baseValue: 600,
        clue: 'When an online streamer or gamer dominates an opponent thoroughly, they are said to be "cooking", while the loser took this single letter loss.',
        answer: 'L',
        accept: ['an l', 'the l', 'take an l']
      },
      {
        baseValue: 800,
        clue: 'The surreal meme of a spinning blue Smurf-cat creature with mushrooms was set to the melody of Alan Walker\'s song titled this.',
        answer: 'The Spectre',
        accept: ['spectre', 'we live we love we lie']
      },
      {
        baseValue: 800,
        clue: 'Twitch chat spam of this iconic frog character created by Matt Furie expresses virtually every human emotion from sadness to smug joy.',
        answer: 'Pepe',
        accept: ['pepe the frog']
      },
      {
        baseValue: 1000,
        clue: 'The nonsensical TikTok phrase "Grimace Shake at 3 AM" referenced a marketing campaign by this fast-food giant.',
        answer: 'McDonald\'s',
        accept: ['mcdonalds', 'maccas', 'golden arches']
      },
      {
        baseValue: 1000,
        clue: 'The slang verb meaning to assert dominance by flexing one\'s jawline and facial structure was popularized by orthodontist John Mew under this name.',
        answer: 'Mewing',
        accept: ['mew', 'mewed']
      },
      {
        baseValue: 200,
        clue: 'To declare that someone is lying or telling an untruth online, gamers say "That\'s ___" using a word that also means headwear.',
        answer: 'Cap',
        accept: ['capp', 'capping']
      },
      {
        baseValue: 400,
        clue: 'What popular streamer is famous for his chaotic live reactions, barking at cameras, and accidentally setting off fireworks indoors?',
        answer: 'IShowSpeed',
        accept: ['speed', 'ishowspeed']
      },
      {
        baseValue: 600,
        clue: 'The expression "touch ___" is commonly told to chronically online gamers who urgently need to disconnect and go outside.',
        answer: 'Grass',
        accept: ['touch grass', 'some grass']
      },
      {
        baseValue: 800,
        clue: 'The term "backrooms" describes an eerie, endless maze of empty yellow office rooms with buzzing fluorescent lights representing this architecture concept.',
        answer: 'Liminal space',
        accept: ['liminal', 'liminal spaces']
      },
      {
        baseValue: 1000,
        clue: 'In 2021, the viral meme "Bing Chilling" featured which WWE superstar-turned-actor speaking Mandarin while eating ice cream?',
        answer: 'John Cena',
        accept: ['cena']
      }
    ]
  },
  {
    id: 'why-does-this-exist',
    name: 'WHY DOES THIS EXIST?',
    icon: '🤔',
    group: 'funny',
    blurb: 'Questionable inventions, weird products & head-scratching human choices',
    clues: [
      {
        baseValue: 200,
        clue: 'In 1975, Gary Dahl became an instant millionaire by selling ordinary Mexican beach stones in cardboard boxes as these hassle-free companions.',
        answer: 'Pet Rock',
        accept: ['pet rocks', 'a pet rock', 'rock']
      },
      {
        baseValue: 200,
        clue: 'The "Snuggie" was a massive cultural hit in the 2000s, though detractors pointed out it was essentially this item worn backwards.',
        answer: 'Bathrobe',
        accept: ['robe', 'blanket with sleeves', 'dressing gown']
      },
      {
        baseValue: 400,
        clue: 'In 2017, Juicero raised over $120 million for a high-tech WiFi juice press, until reporters discovered the juice pouches could be squeezed by what?',
        answer: 'Bare hands',
        accept: ['hands', 'hand', 'human hands', 'your hands']
      },
      {
        baseValue: 400,
        clue: 'Frito-Lay once attempted to make potato chip bags 100% biodegradable, but had to pull them because the crinkling bags were as loud as this.',
        answer: 'Lawnmower',
        accept: ['jet engine', 'chainsaw', 'subway', 'siren', 'traffic']
      },
      {
        baseValue: 600,
        clue: 'In 1996, Nintendo released this red, headache-inducing tabletop console with monochrome stereoscopic 3D graphics that flopped immediately.',
        answer: 'Virtual Boy',
        accept: ['the virtual boy', 'nintendo virtual boy']
      },
      {
        baseValue: 600,
        clue: 'The "Shoe Umbrella" is an infamous novelty product invented in this island nation known for its art of "Chindogu" (useless inventions).',
        answer: 'Japan',
        accept: ['japanese']
      },
      {
        baseValue: 800,
        clue: 'In 2006, Coca-Cola introduced "Coca-Cola Blak", a short-lived beverage that infused soda with what morning beverage?',
        answer: 'Coffee',
        accept: ['espresso', 'coffee flavor']
      },
      {
        baseValue: 800,
        clue: 'The Segway was hyped as an invention that would reshape cities, but its company owner tragically died in 2010 after riding one off of what?',
        answer: 'A cliff',
        accept: ['cliff', 'a cliff into a river', 'riverbank']
      },
      {
        baseValue: 1000,
        clue: 'In 1982, Apple released a clothing and home decor lifestyle line called the "Apple Collection", including sailboards and graphic tees with what logo?',
        answer: 'Rainbow apple',
        accept: ['apple', 'rainbow apple logo', 'rainbow']
      },
      {
        baseValue: 1000,
        clue: 'Colgate famously alienated grocery shoppers in the 1980s when the toothpaste brand attempted to sell frozen microwaveable what?',
        answer: 'Dinners',
        accept: ['meals', 'lasagna', 'frozen food', 'frozen dinners', 'tv dinners']
      },
      {
        baseValue: 200,
        clue: 'This novelty singing plastic fish mounted on a plaque was a 1999 holiday sensation that serenaded buyers with "Take Me to the River".',
        answer: 'Big Mouth Billy Bass',
        accept: ['billy bass', 'singing fish']
      },
      {
        baseValue: 400,
        clue: 'In 2018, Elon Musk raised $5 million for The Boring Company by selling 20,000 branded devices that shot what from nozzles?',
        answer: 'Fire',
        accept: ['flames', 'flamethrower', 'flamethrowers']
      },
      {
        baseValue: 600,
        clue: 'What popular 1990s desktop computer accessory was an interactive anthropomorphic paperclip that constantly interrupted users?',
        answer: 'Clippy',
        accept: ['clippy the paperclip', 'paperclip', 'clippit']
      },
      {
        baseValue: 800,
        clue: 'Subway once introduced round deli meats to prevent the culinary tragedy known as "meat-free" what?',
        answer: 'Corners',
        accept: ['crusts', 'edges', 'bites']
      },
      {
        baseValue: 1000,
        clue: 'In Victorian England, men wore mustache cups designed with a special ceramic guard to protect what substance from melting into hot tea?',
        answer: 'Mustache wax',
        accept: ['wax', 'hair wax']
      }
    ]
  },
  {
    id: 'animals-are-weird',
    name: 'ANIMALS ARE WEIRD',
    icon: '🦥',
    group: 'funny',
    blurb: 'Absurd animal behaviors, weird bodies & zoological oddities',
    clues: [
      {
        baseValue: 200,
        clue: 'Despite having necks up to 6 feet long, giraffes have the exact same number of neck vertebrae as humans: this single digit number.',
        answer: '7',
        accept: ['seven', '7 vertebrae']
      },
      {
        baseValue: 200,
        clue: 'A group of crows is famously and ominously designated by this legal term.',
        answer: 'Murder',
        accept: ['a murder', 'murder of crows']
      },
      {
        baseValue: 400,
        clue: 'Cows have best friends and will suffer measurable increases in this emotion when separated from them.',
        answer: 'Stress',
        accept: ['anxiety', 'sadness', 'depression', 'stress levels']
      },
      {
        baseValue: 400,
        clue: 'Because of their buoyancy and lack of fins, sloths move three times faster when doing this activity compared to walking on land.',
        answer: 'Swimming',
        accept: ['swim', 'in water']
      },
      {
        baseValue: 600,
        clue: 'Sea otters have a specialized skin pouch under their forelegs used specifically to store their favorite what?',
        answer: 'Rock',
        accept: ['rocks', 'favorite rock', 'stone']
      },
      {
        baseValue: 600,
        clue: 'Pigeons can be trained by pathologists to detect this human disease in biopsy scans with over 85% accuracy.',
        answer: 'Cancer',
        accept: ['breast cancer', 'tumors']
      },
      {
        baseValue: 800,
        clue: 'Octopuses have nine brains, blue blood, and this number of beating hearts.',
        answer: '3',
        accept: ['three', '3 hearts']
      },
      {
        baseValue: 800,
        clue: 'To impress potential mates, male Adelie penguins search stony Antarctic beaches to present the female with the smoothest what?',
        answer: 'Pebble',
        accept: ['rock', 'stone', 'pebbles', 'stones']
      },
      {
        baseValue: 1000,
        clue: 'The mantis shrimp strikes with the speed of a .22 caliber bullet, creating heat nearly as hot as the surface of what celestial object?',
        answer: 'The Sun',
        accept: ['sun', 'surface of the sun']
      },
      {
        baseValue: 1000,
        clue: 'Female ferrets will tragically perish from aplastic anemia if they enter heat and are unable to do this.',
        answer: 'Mate',
        accept: ['breed', 'reproduce', 'find a mate']
      },
      {
        baseValue: 200,
        clue: 'A newborn baby kangaroo is approximately the size of this sweet round snack food.',
        answer: 'Jellybean',
        accept: ['jelly bean', 'grape', 'penny']
      },
      {
        baseValue: 400,
        clue: 'Goats and sheep have horizontal rectangular pupils that grant them a panoramic field of view of up to this many degrees.',
        answer: '320',
        accept: ['320 to 340', '300', '340', '360', 'three hundred twenty']
      },
      {
        baseValue: 600,
        clue: 'The sound made by the blue whale can travel through the ocean for hundreds of miles, registering at over 180 of these sound units.',
        answer: 'Decibels',
        accept: ['db', 'decibel']
      },
      {
        baseValue: 800,
        clue: 'Woodpeckers wrap their extremely long what around the back of their skull inside their head to cushion against brain damage?',
        answer: 'Tongue',
        accept: ['tongues', 'their tongue']
      },
      {
        baseValue: 1000,
        clue: 'This semi-aquatic Australian mammal sweats milk out of its abdomen skin because it possesses no nipples.',
        answer: 'Platypus',
        accept: ['duck billed platypus', 'echidna']
      }
    ]
  },
  {
    id: 'cursed-food',
    name: 'CURSED FOOD COMBINATIONS',
    icon: '🌭',
    group: 'funny',
    blurb: 'Questionable snacks, strange culinary history & wild recipes',
    clues: [
      {
        baseValue: 200,
        clue: 'A popular comfort food debate in America asks whether this tropical fruit belongs on pizza with ham.',
        answer: 'Pineapple',
        accept: ['pineapples', 'hawaiian pineapple']
      },
      {
        baseValue: 200,
        clue: 'Casu Marzu is an infamous traditional Sardinian cheese that contains thousands of live wriggling what?',
        answer: 'Maggots',
        accept: ['larvae', 'worms', 'insect larvae', 'fly larvae']
      },
      {
        baseValue: 400,
        clue: 'In the 1950s, American cookbooks obsessed over suspending meats, boiled eggs, and vegetables inside savory lime-flavored what?',
        answer: 'Jell-O',
        accept: ['jello', 'gelatin', 'aspic']
      },
      {
        baseValue: 400,
        clue: 'In Scotland, the infamous "Deep-Fried ___ Bar" wraps a popular caramel-and-nougat chocolate confection in batter and deep-fries it.',
        answer: 'Mars',
        accept: ['mars bar']
      },
      {
        baseValue: 600,
        clue: 'Icelandic fermented shark, notorious for its overpowering ammonia odor and rubbery texture, goes by this traditional name.',
        answer: 'Hakarl',
        accept: ['hákarl', 'fermented shark']
      },
      {
        baseValue: 600,
        clue: 'Surstromming is a famously smelly Swedish delicacy consisting of fermented Baltic what?',
        answer: 'Herring',
        accept: ['fish', 'herrings', 'sour herring']
      },
      {
        baseValue: 800,
        clue: 'What yellow condiment was originally sold in the 1830s by doctor John Cook Bennett as a medicine to cure indigestion and diarrhea?',
        answer: 'Ketchup',
        accept: ['tomato ketchup', 'catsup']
      },
      {
        baseValue: 800,
        clue: 'A beloved regional sandwich in St. Louis and Louisville features thin slices of fried calves\' or pigs\' this internal organ.',
        answer: 'Brain',
        accept: ['brains', 'fried brain']
      },
      {
        baseValue: 1000,
        clue: 'Kopi Luwak is one of the world\'s most expensive coffees, brewed from beans that have been eaten and defecated by this small mammal.',
        answer: 'Civet',
        accept: ['palm civet', 'asian palm civet', 'civet cat']
      },
      {
        baseValue: 1000,
        clue: 'The Victorian delicacy "mock turtle soup" was created using what substitute organ from calves because green sea turtles were too rare?',
        answer: 'Calf brains',
        accept: ['calf head', 'calfs head', 'calf brain', 'veal head']
      },
      {
        baseValue: 200,
        clue: 'The classic midwestern "Fluffernutter" sandwich pairs peanut butter with this sticky sweet white spread.',
        answer: 'Marshmallow fluff',
        accept: ['fluff', 'marshmallow creme', 'marshmallow']
      },
      {
        baseValue: 400,
        clue: 'In Sweden, "Flygande Jakob" (Flying Jacob) is a casserole made of chicken, cream, chili sauce, bananas, and these roasted salty nuts.',
        answer: 'Peanuts',
        accept: ['peanut']
      },
      {
        baseValue: 600,
        clue: 'In Utah, dipping French fries into a mixture of equal parts mayonnaise and ketchup is celebrated under this two-word name.',
        answer: 'Fry sauce',
        accept: ['frysauce']
      },
      {
        baseValue: 800,
        clue: 'Which fruit is banned from many Southeast Asian public transit systems and hotels due to its intensely pungent, sulfuric aroma?',
        answer: 'Durian',
        accept: ['durian fruit']
      },
      {
        baseValue: 1000,
        clue: 'In Australia, the savory dark brown yeast extract spread famously slapped on toast is known as what?',
        answer: 'Vegemite',
        accept: ['marmite']
      }
    ]
  },
  {
    id: 'useless-knowledge',
    name: 'ABSOLUTELY USELESS KNOWLEDGE',
    icon: '🪓',
    group: 'funny',
    blurb: '100% genuine trivia that will not help you in life whatsoever',
    clues: [
      {
        baseValue: 200,
        clue: 'The plastic or metal coating on the tip of a shoelace is officially known by this 6-letter name.',
        answer: 'Aglet',
        accept: ['aglets', 'an aglet']
      },
      {
        baseValue: 200,
        clue: 'Oxford University in England is older than this legendary Mesoamerican empire whose capital was Tenochtitlan.',
        answer: 'Aztec Empire',
        accept: ['aztecs', 'the aztecs', 'aztec']
      },
      {
        baseValue: 400,
        clue: 'If you fold a standard piece of paper in half this many times, its thickness would theoretically reach the Moon.',
        answer: '42',
        accept: ['42 times', 'forty two', 'forty-two']
      },
      {
        baseValue: 400,
        clue: 'Cotton candy was co-invented in 1897 by William Morrison, who ironically practiced this dental profession.',
        answer: 'Dentist',
        accept: ['dentistry', 'a dentist']
      },
      {
        baseValue: 600,
        clue: 'The dot that sits directly above a lowercase letter "i" or "j" is formally called a what?',
        answer: 'Tittle',
        accept: ['a tittle']
      },
      {
        baseValue: 600,
        clue: 'Vending machines statistically kill approximately four times as many people annually as this ocean predator.',
        answer: 'Shark',
        accept: ['sharks', 'great white shark']
      },
      {
        baseValue: 800,
        clue: 'Nintendo was originally founded all the way back in 1889 as a company that manufactured these traditional Japanese playing cards.',
        answer: 'Hanafuda',
        accept: ['hanafuda cards', 'flower cards', 'playing cards']
      },
      {
        baseValue: 800,
        clue: 'The small indentation located directly beneath the human nose and above the upper lip is called the what?',
        answer: 'Philtrum',
        accept: ['the philtrum']
      },
      {
        baseValue: 1000,
        clue: 'In 2006, a man legally changed his name to "Bubba Bubba Bubba" and ran for county sheriff in this U.S. state.',
        answer: 'Kentucky',
        accept: ['ky']
      },
      {
        baseValue: 1000,
        clue: 'The rumble sound your stomach makes when you are hungry is known medically by this Greek onomatopoeic word.',
        answer: 'Borborygmus',
        accept: ['borborygmi', 'borborygmos']
      },
      {
        baseValue: 200,
        clue: 'What breakfast cereal mascot’s full name is officially "Cap’n Horatio Magellan Crunch"?',
        answer: 'Cap’n Crunch',
        accept: ['captain crunch', 'capn crunch']
      },
      {
        baseValue: 400,
        clue: 'The cardboard sleeve placed around a hot coffee cup to protect your fingers is commonly known as a "coffee ___".',
        answer: 'Clutch',
        accept: ['sleeve', 'zarf', 'coffee sleeve']
      },
      {
        baseValue: 600,
        clue: 'Bananas are botanically classified as berries, while strawberries botanically are not. True or False?',
        answer: 'True',
        accept: ['t']
      },
      {
        baseValue: 800,
        clue: 'The plastic three-legged table placed in the middle of a pizza delivery box to stop the lid from touching cheese is called a "pizza ___".',
        answer: 'Saver',
        accept: ['pizza saver', 'pizza table', 'package saver']
      },
      {
        baseValue: 1000,
        clue: 'What word is defined as the fear of long words, ironically spelled with 36 letters starting with "hippopoto-"?',
        answer: 'Hippopotomonstrosesquippedaliophobia',
        accept: ['sesquipedaliophobia', 'hippopotomonstrosesquipedaliophobia']
      }
    ]
  },
  {
    id: 'terrible-superpowers',
    name: 'TERRIBLE SUPERPOWERS',
    icon: '🦸',
    group: 'funny',
    blurb: 'Worst superhero abilities, weird comic characters & useless powers',
    clues: [
      {
        baseValue: 200,
        clue: 'DC Comics hero "Matter-Eater Lad" hails from the planet Bismoll and possesses the uncanny superpower to do what to literally any solid substance?',
        answer: 'Eat it',
        accept: ['eat', 'eat anything', 'consume it', 'chew and swallow']
      },
      {
        baseValue: 200,
        clue: 'Marvel mutant "ForgetMeNot" possesses the tragic power that whenever someone looks away from him, they instantly do what?',
        answer: 'Forget him',
        accept: ['forget who he is', 'forget', 'lose memory of him']
      },
      {
        baseValue: 400,
        clue: 'The classic Legion of Super-Heroes member "Arm-Fall-Off-Boy" fights crime by doing what with his own limbs?',
        answer: 'Detaching them',
        accept: ['taking off his arms', 'pulling his arms off', 'using his arm as a club', 'detachable arms']
      },
      {
        baseValue: 400,
        clue: 'Marvel hero "Bailey Hoskins" was declared the "Worst X-Man Ever" because his mutant superpower allows him to explode with nuclear force, but only this many times.',
        answer: 'Once',
        accept: ['1 time', 'one time', 'single time']
      },
      {
        baseValue: 600,
        clue: 'Batman villain "The Condiment King" terrorizes Gotham City by spraying crimefighters with mustard and this other condiment.',
        answer: 'Ketchup',
        accept: ['catsup', 'relish']
      },
      {
        baseValue: 600,
        clue: 'Marvel hero "Squirrel Girl" is famously undefeated in combat, having canonically defeated which purple cosmic titan solo?',
        answer: 'Thanos',
        accept: ['the mad titan thanos']
      },
      {
        baseValue: 800,
        clue: 'DC Comics character "Bouncing Boy" gained his superpower of inflating into a massive rubbery sphere after accidentally drinking what beverage?',
        answer: 'Soda',
        accept: ['soft drink', 'plastic fluid', 'pop', 'super plastic']
      },
      {
        baseValue: 800,
        clue: 'X-Men mutant "Cypher" was originally considered useless by readers in the 1980s because his only superpower was understanding any what?',
        answer: 'Language',
        accept: ['languages', 'spoken language', 'translation']
      },
      {
        baseValue: 1000,
        clue: 'Section 8 superhero "Dogwelder" fights evil in Gotham City by using an acetylene torch to do what horrifying action?',
        answer: 'Weld dogs to faces',
        accept: ['welding dogs', 'weld dogs', 'welding dead dogs to criminals']
      },
      {
        baseValue: 1000,
        clue: 'The Marvel mutant "Skin" had approximately six extra feet of this organ that he could stretch and manipulate like silly putty.',
        answer: 'Skin',
        accept: ['epidermis']
      },
      {
        baseValue: 200,
        clue: 'Aquaman was ridiculed in early cartoons because his primary superpower was talking telepathically to what creatures?',
        answer: 'Fish',
        accept: ['marine life', 'sea creatures', 'sharks']
      },
      {
        baseValue: 400,
        clue: 'Spider-Man villain "The Wall" was literally an ordinary brick what that walked around tripping people?',
        answer: 'Wall',
        accept: ['brick wall']
      },
      {
        baseValue: 600,
        clue: 'Green Lantern’s original Golden Age weakness was not the color yellow, but ordinary objects made out of what organic material?',
        answer: 'Wood',
        accept: ['lumber', 'trees']
      },
      {
        baseValue: 800,
        clue: 'What Batman enemy leaves clues in the form of puzzles, brain teasers, and question marks?',
        answer: 'The Riddler',
        accept: ['riddler', 'edward nygma']
      },
      {
        baseValue: 1000,
        clue: 'In Mystery Men, hero "The Spleen" incapacitates enemies using what gaseous bodily function?',
        answer: 'Flatulence',
        accept: ['farting', 'farts', 'fart']
      }
    ]
  },
  {
    id: 'game-logic-fails',
    name: 'GAME LOGIC MAKES NO SENSE',
    icon: '🎮',
    group: 'funny',
    blurb: 'Funny video game physics, weird tropes & hilarious gaming mechanics',
    clues: [
      {
        baseValue: 200,
        clue: 'In Grand Theft Auto, committing armed robbery and causing high-speed crashes is completely forgiven if you spray-paint your vehicle at this garage.',
        answer: 'Pay \'n\' Spray',
        accept: ['pay and spray', 'los santos customs', 'pay n spray']
      },
      {
        baseValue: 200,
        clue: 'In Minecraft, dropping from the stratosphere into a single bucket of this fluid negates 100% of your fall damage.',
        answer: 'Water',
        accept: ['water bucket', 'a water bucket']
      },
      {
        baseValue: 400,
        clue: 'In Skyrim, placing this common kitchen container over an NPC shopkeeper\'s head blinds them completely, letting you rob them blind.',
        answer: 'Bucket',
        accept: ['pot', 'kettle', 'a bucket', 'baskets', 'basket']
      },
      {
        baseValue: 400,
        clue: 'In Pokemon, tiny Pidgey can fly an adult human across an entire continent using HM02, while which 6-foot bipedal dragon initially could not learn Fly in Gen 1?',
        answer: 'Charizard',
        accept: ['charizard']
      },
      {
        baseValue: 600,
        clue: 'In classic Resident Evil games, finding this colored botanical herb restores your health back to full vitality.',
        answer: 'Green herb',
        accept: ['green', 'herb', 'green herbs']
      },
      {
        baseValue: 600,
        clue: 'In stealth games like Metal Gear Solid, protagonist Solid Snake infiltrates top-secret military facilities while hiding under what everyday object?',
        answer: 'Cardboard box',
        accept: ['box', 'cardboard', 'a box']
      },
      {
        baseValue: 800,
        clue: 'In the original 1996 Tomb Raider, Lara Croft could survive high falls and monster bites, but instantly perished upon touching what glowing obstacle?',
        answer: 'Spikes',
        accept: ['spike pit', 'spikes']
      },
      {
        baseValue: 800,
        clue: 'In Mario games, jumping on a mushroom doubles your height, while jumping on a green mushroom awards this.',
        answer: 'An extra life',
        accept: ['1up', '1 up', 'extra life', 'life']
      },
      {
        baseValue: 1000,
        clue: 'In Animal Crossing, carrying three full-grown oak trees and a living whale in your pocket only requires this clothing accessory.',
        answer: 'Pockets',
        accept: ['inventory', 'backpack']
      },
      {
        baseValue: 1000,
        clue: 'In Dark Souls, opening a treasure chest without hitting it with a sword first carries the risk of being devoured by this monster.',
        answer: 'Mimic',
        accept: ['a mimic', 'mimics']
      },
      {
        baseValue: 200,
        clue: 'In classic DOOM, the protagonist can sprint at 57 miles per hour while carrying how many heavy weapons simultaneously?',
        answer: '8',
        accept: ['eight', 'all of them', 'seven', 'nine']
      },
      {
        baseValue: 400,
        clue: 'In The Sims, removing this object from a swimming pool tragically condemns the swimming sim to swimming until exhaustion.',
        answer: 'The ladder',
        accept: ['ladder', 'pool ladder']
      },
      {
        baseValue: 600,
        clue: 'In Street Fighter, eating an entire roasted chicken found inside what street container completely heals your brawler?',
        answer: 'Trash can',
        accept: ['barrel', 'garbage can', 'trash', 'crate']
      },
      {
        baseValue: 800,
        clue: 'In Assassin’s Creed, falling 500 feet from a cathedral tower into a wagon filled with this agricultural item guarantees zero damage.',
        answer: 'Hay',
        accept: ['haystack', 'straw', 'a haystack']
      },
      {
        baseValue: 1000,
        clue: 'In Sonic the Hedgehog, having at least one of these golden collectibles prevents Sonic from dying when injured by hazards.',
        answer: 'Ring',
        accept: ['rings', 'gold ring', 'a ring']
      }
    ]
  },
  {
    id: 'movies-are-weird',
    name: 'MOVIES ARE WEIRD',
    icon: '🍿',
    group: 'funny',
    blurb: 'Bizarre movie facts, unbelievable behind-the-scenes & Hollywood lore',
    clues: [
      {
        baseValue: 200,
        clue: 'In Jurassic Park, the iconic terrifying roar of the Tyrannosaurus Rex was created by mixing the audio of a tiger, an alligator, and a baby what?',
        answer: 'Elephant',
        accept: ['baby elephant', 'elephants']
      },
      {
        baseValue: 200,
        clue: 'In Star Wars: The Empire Strikes Back, during an asteroid field scene, special effects artists secretly threw what potato-derived item into the shot?',
        answer: 'Potato',
        accept: ['a potato', 'shoe', 'tennis shoe']
      },
      {
        baseValue: 400,
        clue: 'In 2003\'s infamous cult film "The Room", director Tommy Wiseau famously demanded that every framed photo in the living room feature pictures of what utensil?',
        answer: 'Spoons',
        accept: ['spoon', 'a spoon']
      },
      {
        baseValue: 400,
        clue: 'The mask worn by serial killer Michael Myers in the 1978 horror film Halloween was an inside-out, painted $2 mask of which Star Trek actor?',
        answer: 'William Shatner',
        accept: ['shatner', 'captain kirk']
      },
      {
        baseValue: 600,
        clue: 'During filming of The Wizard of Oz, the snow that fell upon Dorothy and the characters in the poppy field was made of 100% pure toxic what?',
        answer: 'Asbestos',
        accept: ['white asbestos', 'asbestos powder']
      },
      {
        baseValue: 600,
        clue: 'In Titanic, director James Cameron himself drew the famous charcoal sketch of Rose wearing what jewel necklace?',
        answer: 'Heart of the Ocean',
        accept: ['the heart of the ocean', 'blue diamond']
      },
      {
        baseValue: 800,
        clue: 'For the sound effects in Psycho\'s shower stabbing scene, Alfred Hitchcock auditioned sound engineers stabbing dozens of different types of what fruit?',
        answer: 'Melons',
        accept: ['casaba melon', 'watermelon', 'melon']
      },
      {
        baseValue: 800,
        clue: 'In 1993\'s Super Mario Bros movie, Bob Hoskins and John Leguizamo admitted they survived the miserable shoot by constantly drinking what?',
        answer: 'Alcohol',
        accept: ['whiskey', 'beer', 'scotch', 'booze']
      },
      {
        baseValue: 1000,
        clue: 'In Back to the Future, the time machine was originally written as this common kitchen appliance before changing to a DeLorean.',
        answer: 'Refrigerator',
        accept: ['fridge', 'a refrigerator']
      },
      {
        baseValue: 1000,
        clue: 'In Lord of the Rings: The Two Towers, Viggo Mortensen\'s genuine scream of anguish when kicking an orc helmet occurred because he broke two of his what?',
        answer: 'Toes',
        accept: ['toe', 'his toes']
      },
      {
        baseValue: 200,
        clue: 'In Willy Wonka & the Chocolate Factory, the chocolate river was made of 150,000 gallons of water mixed with real chocolate that quickly began to do what?',
        answer: 'Rot',
        accept: ['spoil', 'smell', 'stink', 'go bad']
      },
      {
        baseValue: 400,
        clue: 'In The Matrix, the iconic flowing green digital code seen in the intro sequence was actually scanned recipes for what Japanese dish?',
        answer: 'Sushi',
        accept: ['sushi recipes', 'noodles']
      },
      {
        baseValue: 600,
        clue: 'In Fight Club, director David Fincher claimed that at least one cup from this ubiquitous coffee chain appears in every single scene.',
        answer: 'Starbucks',
        accept: ['starbucks cup']
      },
      {
        baseValue: 800,
        clue: 'What Disney animated movie was the first animated film in history to earn an Academy Award nomination for Best Picture?',
        answer: 'Beauty and the Beast',
        accept: ['beauty and the beast']
      },
      {
        baseValue: 1000,
        clue: 'In Alien (1979), the actors\' terrified reactions during the chestburster scene were genuine because director Ridley Scott had not told them what would happen. True or False?',
        answer: 'True',
        accept: ['t']
      }
    ]
  },
  {
    id: 'common-sense-test',
    name: 'COMMON SENSE TEST',
    icon: '🧐',
    group: 'funny',
    blurb: 'Tricky logic, cognitive traps & clever everyday reasoning',
    clues: [
      {
        baseValue: 200,
        clue: 'Some months have 31 days, and some have 30 days. How many months have 28 days?',
        answer: '12',
        accept: ['all of them', 'twelve', 'all 12', '12 months']
      },
      {
        baseValue: 200,
        clue: 'A rooster lays an egg on top of a barn roof peak sloping east and west. Which side does the egg roll down?',
        answer: 'Neither',
        accept: ['roosters don\'t lay eggs', 'roosters do not lay eggs', 'none', 'neither side']
      },
      {
        baseValue: 400,
        clue: 'You are running in a foot race and pass the person running in 2nd place. What position are you in now?',
        answer: '2nd place',
        accept: ['second', '2nd', 'second place']
      },
      {
        baseValue: 400,
        clue: 'Mary\'s father has 5 daughters: Nana, Nene, Nini, Nono, and who is the 5th daughter?',
        answer: 'Mary',
        accept: ['mary herself']
      },
      {
        baseValue: 600,
        clue: 'If an electric train is traveling north at 60 mph and the wind is blowing west at 20 mph, which direction does the smoke blow?',
        answer: 'There is no smoke',
        accept: ['no smoke', 'electric trains have no smoke', 'nowhere', 'none']
      },
      {
        baseValue: 600,
        clue: 'How many cubic feet of dirt are inside a hole that measures 3 feet deep, 3 feet wide, and 3 feet long?',
        answer: 'Zero',
        accept: ['0', 'none', 'there is no dirt in a hole', 'no dirt']
      },
      {
        baseValue: 800,
        clue: 'A doctor gives you 3 pills and tells you to take one every half hour. How many minutes will the pills last?',
        answer: '60',
        accept: ['60 minutes', 'one hour', '1 hour', 'sixty minutes']
      },
      {
        baseValue: 800,
        clue: 'A plane crashes precisely on the border of the United States and Canada. Where do they bury the survivors?',
        answer: 'Nowhere',
        accept: ['you don\'t bury survivors', 'do not bury survivors', 'nowhere they are alive', 'survivors are alive']
      },
      {
        baseValue: 1000,
        clue: 'Before Mount Everest was discovered and measured in 1856, what was the tallest mountain on Earth?',
        answer: 'Mount Everest',
        accept: ['everest', 'mt everest', 'the same mountain']
      },
      {
        baseValue: 1000,
        clue: 'If you have a 3-gallon bucket and a 5-gallon bucket, and endless water, how do you measure exactly 4 gallons?',
        answer: 'Fill 5, pour into 3, empty 3, pour 2 into 3, fill 5, fill 3',
        accept: ['fill 5 pour into 3', 'fill the 5 gallon bucket', 'with the buckets']
      },
      {
        baseValue: 200,
        clue: 'What word becomes shorter when you add two letters to it?',
        answer: 'Short',
        accept: ['the word short']
      },
      {
        baseValue: 400,
        clue: 'What can travel around the entire world while staying in the exact same corner?',
        answer: 'Stamp',
        accept: ['a stamp', 'postage stamp']
      },
      {
        baseValue: 600,
        clue: 'What has keys but opens no locks, space but no room, and allows you to enter but not exit?',
        answer: 'Keyboard',
        accept: ['a keyboard', 'computer keyboard']
      },
      {
        baseValue: 800,
        clue: 'If two is company and three is a crowd, what are four and five?',
        answer: '9',
        accept: ['nine', 'nine!']
      },
      {
        baseValue: 1000,
        clue: 'What English word has three consecutive sets of double letters in a row?',
        answer: 'Bookkeeper',
        accept: ['bookkeeping']
      }
    ]
  },
  {
    id: 'name-that-nonsense',
    name: 'NAME THAT NONSENSE',
    icon: '🤡',
    group: 'funny',
    blurb: 'Absurd idioms, weird vintage slang & hilarious linguistic gems',
    clues: [
      {
        baseValue: 200,
        clue: 'This rhyming 1920s jazz-era slang phrase describing something top-notch mentions a feline\'s nocturnal sleeping wear.',
        answer: 'The cat\'s pajamas',
        accept: ['cats pajamas', 'cat pajamas', 'the cats meow']
      },
      {
        baseValue: 200,
        clue: 'To reveal a confidential secret prematurely is to let this animal "out of the bag".',
        answer: 'Cat',
        accept: ['the cat', 'a cat']
      },
      {
        baseValue: 400,
        clue: 'The Victorian term "giggle-water" was a humorous euphemism for what alcoholic beverage with fizzing bubbles?',
        answer: 'Champagne',
        accept: ['sparkling wine', 'alcohol', 'wine', 'beer']
      },
      {
        baseValue: 400,
        clue: 'When an impossible event will never occur, cynical folks claim it will happen "when ___ fly".',
        answer: 'Pigs',
        accept: ['pigs fly', 'a pig flies']
      },
      {
        baseValue: 600,
        clue: 'The 19th-century slang word "bamboozle" means to do what to someone through trickery or deception?',
        answer: 'Deceive',
        accept: ['trick', 'fool', 'cheat', 'dupe', 'swindle']
      },
      {
        baseValue: 600,
        clue: 'If someone is said to have "bats in their belfry", they are being eccentrically accused of having what quality?',
        answer: 'Crazy',
        accept: ['insane', 'eccentric', 'nuts', 'mad', 'foolish']
      },
      {
        baseValue: 800,
        clue: 'In Irish slang, having good conversation, gossip, music, and fun with friends is referred to by this 4-letter word pronounced "crack".',
        answer: 'Craic',
        accept: ['the craic', 'crack']
      },
      {
        baseValue: 800,
        clue: 'The phrase "bite the bullet" comes from historical battlefield surgery when soldiers bit lead ammunition during surgery without what pain-killer?',
        answer: 'Anesthesia',
        accept: ['painkillers', 'anesthetic', 'morphine']
      },
      {
        baseValue: 1000,
        clue: 'The archaic word "defenestration" specifically defines the dramatic act of throwing someone out of a what?',
        answer: 'Window',
        accept: ['a window', 'windows']
      },
      {
        baseValue: 1000,
        clue: 'The 18th-century medical term "callipygian" describes a person possessing an exceptionally shapely and beautiful what?',
        answer: 'Buttocks',
        accept: ['butt', 'rear end', 'backside', 'rear', 'ass']
      },
      {
        baseValue: 200,
        clue: 'To "spill the ___" means to reveal secret or scandalous information to your friends.',
        answer: 'Beans',
        accept: ['tea', 'spill the beans', 'the beans']
      },
      {
        baseValue: 400,
        clue: 'In Australian slang, what barbecue-cooked pork or beef sausage is affectionately called a "snag"?',
        answer: 'Sausage',
        accept: ['hot dog', 'hotdog', 'bratwurst']
      },
      {
        baseValue: 600,
        clue: 'If someone is caught red-handed, the expression originally referred to being caught with literal blood on their hands from what illegal rural act?',
        answer: 'Poaching',
        accept: ['hunting', 'stealing livestock', 'butchering stolen livestock', 'poaching deer']
      },
      {
        baseValue: 800,
        clue: 'The nonsense term "flummoxed" means completely and utter what?',
        answer: 'Confused',
        accept: ['bewildered', 'baffled', 'perplexed', 'puzzled']
      },
      {
        baseValue: 1000,
        clue: 'The word "quockerwodger" was 19th-century slang for a wooden puppet on a string, commonly used to insult what group of people?',
        answer: 'Politicians',
        accept: ['politician', 'corrupt politicians']
      }
    ]
  },
  {
    id: 'school-trivia',
    name: 'YOU LEARNED THAT IN SCHOOL?',
    icon: '🎒',
    group: 'funny',
    blurb: 'Wild historical, mathematical & scientific truths they glossed over',
    clues: [
      {
        baseValue: 200,
        clue: 'In 1807, Napoleon Bonaparte was humorously attacked and swarmed by a horde of thousands of these fluffy domesticated animals during a hunt.',
        answer: 'Rabbits',
        accept: ['bunnies', 'bunny', 'hare', 'hares']
      },
      {
        baseValue: 200,
        clue: 'This famous Italian astronomer reportedly never dropped balls from the Leaning Tower of Pisa despite popular elementary school textbook myths.',
        answer: 'Galileo Galilei',
        accept: ['galileo']
      },
      {
        baseValue: 400,
        clue: 'In 1932, the Australian military fought a declared war against twenty-thousand of these flightless birds — and the military lost.',
        answer: 'Emus',
        accept: ['emu', 'the emu war']
      },
      {
        baseValue: 400,
        clue: 'Isaac Newton did not get bonked on the head by a falling apple, but was inspired by watching an apple fall while quarantined from what disease outbreak in 1665?',
        answer: 'The Plague',
        accept: ['bubonic plague', 'black plague', 'the great plague']
      },
      {
        baseValue: 600,
        clue: 'In 1386, a court in Falaise, France formally put what domesticated farm animal on trial for murder, sentencing it to public execution?',
        answer: 'A pig',
        accept: ['pig', 'sow', 'swine']
      },
      {
        baseValue: 600,
        clue: 'President Abraham Lincoln is enshrined in the National Wrestling Hall of Fame after losing only one match out of approximately how many bouts?',
        answer: '300',
        accept: ['three hundred', 'around 300']
      },
      {
        baseValue: 800,
        clue: 'Cleopatra lived closer in time to the Moon landing than she did to the construction of what Egyptian wonder?',
        answer: 'Great Pyramid of Giza',
        accept: ['pyramids', 'the pyramids', 'the great pyramid', 'giza pyramids']
      },
      {
        baseValue: 800,
        clue: 'In 1859, the United States and Great Britain nearly engaged in a shooting war over the accidental shooting of what farm animal on San Juan Island?',
        answer: 'A pig',
        accept: ['pig', 'the pig war']
      },
      {
        baseValue: 1000,
        clue: 'The ancient Greek philosopher Chrysippus famously perished from uncontrollable laughter after watching a donkey try to eat what fruit?',
        answer: 'Figs',
        accept: ['fig', 'figs and wine']
      },
      {
        baseValue: 1000,
        clue: 'The shortest war in recorded history occurred on August 27, 1896 between Britain and Zanzibar, lasting approximately this many minutes.',
        answer: '38',
        accept: ['38 minutes', 'thirty eight', '40', '38 to 45 minutes']
      },
      {
        baseValue: 200,
        clue: 'George Washington’s famous false teeth were not made of wood, but of gold, lead, hippopotamus ivory, and teeth from what?',
        answer: 'Humans',
        accept: ['human teeth', 'enslaved people', 'cows']
      },
      {
        baseValue: 400,
        clue: 'Albert Einstein did not fail high school math; in fact, he had mastered college-level calculus by what teenage age?',
        answer: '15',
        accept: ['fifteen', '14', '16']
      },
      {
        baseValue: 600,
        clue: 'Before adopting the dollar, colonial Americans often used Spanish silver coins cut into pieces called "bits", where two bits equaled how many cents?',
        answer: '25',
        accept: ['25 cents', 'a quarter', 'twenty five']
      },
      {
        baseValue: 800,
        clue: 'What ancient Roman emperor declared his favorite horse, Incitatus, to be a senator of Rome?',
        answer: 'Caligula',
        accept: ['emperor caligula']
      },
      {
        baseValue: 1000,
        clue: 'King Henry VIII of England employed a trusted servant whose official court title was the "Groom of the ___", tasked with assisting the King on the toilet.',
        answer: 'Stool',
        accept: ['groom of the stool']
      }
    ]
  },
  {
    id: 'absurd-animals',
    name: 'ABSURD ANIMAL SHOWDOWNS',
    icon: '🦘',
    group: 'funny',
    blurb: 'Wild animal stats, overpowered biological perks & nature match-ups',
    clues: [
      {
        baseValue: 200,
        clue: 'The cheetah is the fastest land animal on Earth, capable of accelerating from 0 to 60 mph in roughly this many seconds.',
        answer: '3',
        accept: ['three', '3 seconds']
      },
      {
        baseValue: 200,
        clue: 'If a human had the proportional leg strength of this common household insect, they could leap over a 30-story skyscraper.',
        answer: 'Flea',
        accept: ['fleas', 'a flea']
      },
      {
        baseValue: 400,
        clue: 'Despite its gentle reputation, this African mammal is responsible for more human fatalities annually than lions, leopards, and crocodiles combined.',
        answer: 'Hippopotamus',
        accept: ['hippo', 'hippos']
      },
      {
        baseValue: 400,
        clue: 'The dung beetle is proportionally the strongest creature on the planet, capable of rolling balls up to this many times its own body weight.',
        answer: '1000',
        accept: ['1141', 'over 1000', 'a thousand', 'one thousand']
      },
      {
        baseValue: 600,
        clue: 'The Peregrine Falcon dives after prey at record-shattering speeds exceeding how many miles per hour?',
        answer: '200',
        accept: ['240', 'over 200', '200 mph', '240 mph', 'two hundred']
      },
      {
        baseValue: 600,
        clue: 'The blue whale is the largest animal to ever exist on Earth; its tongue alone weighs approximately as much as what adult land mammal?',
        answer: 'Elephant',
        accept: ['an elephant', 'asian elephant', 'african elephant']
      },
      {
        baseValue: 800,
        clue: 'The Honey Badger is notoriously immune to deadly venom from cobra snakes because of a specialized mutation in its cellular what?',
        answer: 'Receptors',
        accept: ['blood', 'acetylcholine receptors', 'dna', 'nervous system']
      },
      {
        baseValue: 800,
        clue: 'The electric eel can generate an electric shock of up to how many volts to stun prey in the Amazon river?',
        answer: '860',
        accept: ['600', '800', '600 to 860 volts', '860 volts', 'around 800']
      },
      {
        baseValue: 1000,
        clue: 'The tiny golden poison frog of Colombia contains enough batrachotoxin in its skin to eliminate up to how many adult humans?',
        answer: '10',
        accept: ['ten', '10 to 20', 'around 10']
      },
      {
        baseValue: 1000,
        clue: 'The Pistol Shrimp snaps its claw so quickly that it creates a collapsing cavitation bubble that produces sound louder than what heavy weapon?',
        answer: 'Gunshot',
        accept: ['a gun', 'jet engine', 'bullet']
      },
      {
        baseValue: 200,
        clue: 'A grizzly bear and polar bear hybrid born in the wild is commonly referred to by this adorable mashup name.',
        answer: 'Pizzly bear',
        accept: ['pizzly', 'grolar bear', 'grolar']
      },
      {
        baseValue: 400,
        clue: 'Ostriches can sprint at sustained speeds of 45 mph and possess a kick powerful enough to eliminate which apex savannah cat?',
        answer: 'Lion',
        accept: ['a lion', 'lions']
      },
      {
        baseValue: 600,
        clue: 'The vampire bat feeds entirely on blood, and must feed at least once every how many days or it will starve to death?',
        answer: '2',
        accept: ['two', '3', 'two or three days', '48 hours']
      },
      {
        baseValue: 800,
        clue: 'Which tiny cephalopod native to Pacific tide pools contains neurotoxin strong enough to paralyze 26 humans in minutes, signaled by glowing rings?',
        answer: 'Blue-ringed octopus',
        accept: ['blue ringed octopus', 'blue ring octopus']
      },
      {
        baseValue: 1000,
        clue: 'The archerfish hunts land bugs resting on overhanging branches by shooting a high-pressure stream of what from its mouth?',
        answer: 'Water',
        accept: ['water droplets', 'water jet']
      }
    ]
  },
  {
    id: 'strange-internet',
    name: 'THE INTERNET IS A STRANGE PLACE',
    icon: '💾',
    group: 'funny',
    blurb: 'Weird corners of the web, viral mysteries & internet oddities',
    clues: [
      {
        baseValue: 200,
        clue: 'In 2005, student Alex Tew paid for his university education by creating "The Million Dollar Homepage", selling what 10x10 units for $1 each?',
        answer: 'Pixels',
        accept: ['pixel', 'ad pixels', 'banner pixels']
      },
      {
        baseValue: 400,
        clue: 'The bizarre 2010s urban legend of an unnaturally tall, featureless humanoid wearing a black suit who stalks people in forests is named what?',
        answer: 'Slender Man',
        accept: ['slenderman']
      },
      {
        baseValue: 600,
        clue: 'The eerie online community database describing thousands of classified anomalous objects and monsters is known by this 3-letter acronym.',
        answer: 'SCP',
        accept: ['scp foundation', 'secure contain protect']
      },
      {
        baseValue: 800,
        clue: 'What classic viral flash animation from 2003 featured looping cartoon badgers, mushrooms, and a terrifying snake?',
        answer: 'Badger Badger Badger',
        accept: ['the badger song', 'badgers', 'badger']
      },
      {
        baseValue: 1000,
        clue: 'In 2006, Kyle MacDonald traded a single red paperclip over 14 online barters until he finally received what major property prize?',
        answer: 'A house',
        accept: ['house', 'two story house', 'a two-story farmhouse']
      }
    ]
  },
  {
    id: 'rather-know',
    name: 'WHAT WOULD YOU RATHER KNOW?',
    icon: '🔮',
    group: 'funny',
    blurb: 'Wild hypothetical trivia with objective, fascinating real-world answers',
    clues: [
      {
        baseValue: 200,
        clue: 'If you fell into a black hole, the gravitational tidal force stretching you into a thin noodle is scientifically called what food term?',
        answer: 'Spaghettification',
        accept: ['the noodle effect', 'spaghetti effect']
      },
      {
        baseValue: 400,
        clue: 'Would you survive eating polar bear liver? No, because it contains lethal toxic concentrations of which vitamin?',
        answer: 'Vitamin A',
        accept: ['vit a', 'a']
      },
      {
        baseValue: 600,
        clue: 'How long can a decapitated cockroach survive without its head before it dies of dehydration?',
        answer: 'A week',
        accept: ['one week', '7 days', 'several days', 'up to a week', '9 days']
      },
      {
        baseValue: 800,
        clue: 'If Earth stopped spinning completely for one second, atmospheric inertia would instantly create winds of over how many miles per hour at the equator?',
        answer: '1000',
        accept: ['1000 mph', 'one thousand', 'a thousand']
      },
      {
        baseValue: 1000,
        clue: 'Could you technically breathe liquid? Yes, humans can breathe perfluorocarbon liquid, which was famously demonstrated on a rat in which 1989 James Cameron movie?',
        answer: 'The Abyss',
        accept: ['abyss']
      }
    ]
  }
];

module.exports = { FUNNY_CATEGORIES };

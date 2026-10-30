'use strict';

/**
 * SCIENCE & NATURE CATEGORIES
 * Space, dinosaurs, ocean biology, weather, inventions, chemistry, and technology.
 */

const SCIENCE_CATEGORIES = [
  {
    id: 'space-reality',
    name: 'SPACE & COSMIC FACTS',
    icon: '🚀',
    group: 'science',
    blurb: 'Black holes, alien moons, solar flares & cosmic wonders',
    clues: [
      {
        baseValue: 200,
        clue: 'It’s not Mercury — thanks to a runaway greenhouse atmosphere, this second planet from the Sun is actually the hottest in our solar system.',
        answer: 'Venus',
        accept: ['planet venus']
      },
      {
        baseValue: 200,
        clue: 'Our home galaxy is a barred spiral containing over 100 billion stars known by this sweet name.',
        answer: 'Milky Way',
        accept: ['the milky way', 'milky way galaxy']
      },
      {
        baseValue: 400,
        clue: 'Olympus Mons, a shield volcano nearly three times taller than Mount Everest, towers over the surface of this planet.',
        answer: 'Mars',
        accept: ['red planet', 'the red planet']
      },
      {
        baseValue: 400,
        clue: 'A day on this ringed gas giant lasts only about 10.7 hours despite it being the second-largest planet in the solar system.',
        answer: 'Saturn',
        accept: ['planet saturn']
      },
      {
        baseValue: 600,
        clue: 'Cross this boundary around a black hole and not even light moves fast enough to escape its gravitational pull.',
        answer: 'Event horizon',
        accept: ['the event horizon']
      },
      {
        baseValue: 600,
        clue: 'The largest moon in our solar system, orbiting Jupiter and larger than the planet Mercury, is named this.',
        answer: 'Ganymede',
        accept: ['jupiter moon ganymede']
      },
      {
        baseValue: 800,
        clue: 'Extreme atmospheric pressure crushes carbon into literal falling rain made of these precious gemstones deep inside Neptune and Uranus.',
        answer: 'Diamonds',
        accept: ['diamond', 'diamond rain']
      },
      {
        baseValue: 800,
        clue: 'Neutron stars rotate hundreds of times per second; a single sugar-cube-sized chunk of neutron star matter would weigh about a billion of these units on Earth.',
        answer: 'Tons',
        accept: ['ton', 'tonnes', 'metric tons']
      },
      {
        baseValue: 1000,
        clue: 'Launched in 1977 and now in interstellar space, NASA’s twin probes carry copper phonograph discs called the Golden Records under this mission name.',
        answer: 'Voyager',
        accept: ['voyager 1', 'voyager 2', 'voyager probes']
      },
      {
        baseValue: 1000,
        clue: 'Light from the Sun takes approximately this many minutes and twenty seconds to travel through the vacuum of space and reach Earth.',
        answer: '8',
        accept: ['8 minutes', 'eight', 'eight minutes', '8.3 minutes']
      },
      {
        baseValue: 200,
        clue: 'In 2006, the International Astronomical Union controversially demoted this ninth planetary body to "dwarf planet".',
        answer: 'Pluto',
        accept: ['planet pluto']
      },
      {
        baseValue: 400,
        clue: 'What massive infrared space telescope launched on Christmas Day 2021 as the successor to Hubble?',
        answer: 'James Webb Space Telescope',
        accept: ['jwst', 'james webb', 'webb telescope', 'webb']
      },
      {
        baseValue: 600,
        clue: 'Because the Moon has no atmosphere, liquid water, or wind, footsteps left by Apollo astronauts will remain intact for how many millions of years?',
        answer: 'Millions',
        accept: ['millions of years', 'a million', '10 to 100 million years', 'forever']
      },
      {
        baseValue: 800,
        clue: 'What glowing green and purple atmospheric light show occurs near the North Pole when solar wind particles collide with Earth’s magnetic field?',
        answer: 'Aurora Borealis',
        accept: ['northern lights', 'aurora', 'the northern lights']
      },
      {
        baseValue: 1000,
        clue: 'Which moon of Saturn has geysers erupting water vapor from a subsurface ocean into space, making it a prime candidate for extraterrestrial life?',
        answer: 'Enceladus',
        accept: ['saturns moon enceladus']
      }
    ]
  },
  {
    id: 'dinosaurs-prehistoric',
    name: 'DINOSAURS & PREHISTORIC LIFE',
    icon: '🦖',
    group: 'science',
    blurb: 'Apex predators, prehistoric beasts, fossils & ancient earth',
    clues: [
      {
        baseValue: 200,
        clue: 'The famous "T-Rex" stands for Tyrannosaurus Rex, where the Latin word "Rex" translates to this royal title.',
        answer: 'King',
        accept: ['the king', 'tyrant king']
      },
      {
        baseValue: 200,
        clue: 'Modern paleontologists agree that living descendants of theropod dinosaurs are fluttering around us today as these feathered creatures.',
        answer: 'Birds',
        accept: ['bird', 'avian dinosaurs']
      },
      {
        baseValue: 400,
        clue: 'This herbivorous horned dinosaur from the late Cretaceous possessed three prominent facial horns and a large bony frill.',
        answer: 'Triceratops',
        accept: ['a triceratops']
      },
      {
        baseValue: 400,
        clue: 'Velociraptors in real life were not 6 feet tall like in Jurassic Park; they were roughly the size of this barnyard bird.',
        answer: 'Turkey',
        accept: ['a turkey', 'chicken', 'large chicken']
      },
      {
        baseValue: 600,
        clue: 'The massive 6-mile-wide asteroid that triggered the extinction of non-avian dinosaurs 66 million years ago crashed into this Mexican peninsula.',
        answer: 'Yucatan Peninsula',
        accept: ['yucatan', 'chicxulub', 'gulf of mexico']
      },
      {
        baseValue: 600,
        clue: 'This massive long-necked sauropod was once mistakenly named "Brontosaurus", meaning "thunder lizard".',
        answer: 'Apatosaurus',
        accept: ['brontosaurus', 'sauropod']
      },
      {
        baseValue: 800,
        clue: 'The armored Stegosaurus had bony plates along its back, and four sharp tail spikes formally dubbed the what by cartoonist Gary Larson?',
        answer: 'Thagomizer',
        accept: ['the thagomizer']
      },
      {
        baseValue: 800,
        clue: 'What terrifying apex predator shark from the Cenozoic era grew up to 50 feet long with teeth the size of a human hand?',
        answer: 'Megalodon',
        accept: ['otodus megalodon', 'carcharocles megalodon']
      },
      {
        baseValue: 1000,
        clue: 'The largest land animal that ever walked the Earth was this titanosaur found in South America, weighing over 70 tons.',
        answer: 'Argentinosaurus',
        accept: ['patagotitan', 'titanosaur']
      },
      {
        baseValue: 1000,
        clue: 'The flying reptile Quetzalcoatlus was not a dinosaur, but belonged to this order of flying archosaurs, with a wingspan equal to a fighter jet.',
        answer: 'Pterosaur',
        accept: ['pterosaurs', 'pterodactyl']
      },
      {
        baseValue: 200,
        clue: 'Fossilized dinosaur poop studied by scientists to discover prehistoric diets is scientifically called what?',
        answer: 'Coprolite',
        accept: ['coprolites']
      },
      {
        baseValue: 400,
        clue: 'The Spinosaurus was longer than T-Rex and is believed by paleontologists to be the first known dinosaur adapted for doing what in water?',
        answer: 'Swimming',
        accept: ['swim', 'hunting aquatic prey', 'aquatic hunting']
      },
      {
        baseValue: 600,
        clue: 'What saber-toothed mammal of the Ice Age is famously, though incorrectly, referred to as a "saber-toothed tiger"?',
        answer: 'Smilodon',
        accept: ['saber toothed cat', 'sabre tooth tiger', 'saber-tooth cat']
      },
      {
        baseValue: 800,
        clue: 'Dinosaur fossils have been found on every single continent on Earth, including which freezing polar continent?',
        answer: 'Antarctica',
        accept: ['the south pole']
      },
      {
        baseValue: 1000,
        clue: 'What ancient armored fish of the Devonian period possessed scissor-like bony jaw plates that bit with 1,100 pounds of force?',
        answer: 'Dunkleosteus',
        accept: ['dunkleosteus']
      }
    ]
  },
  {
    id: 'ocean-life',
    name: 'DEEP SEA & OCEAN LIFE',
    icon: '🐙',
    group: 'science',
    blurb: 'Abyssal depths, bioluminescent beasts & marine marvels',
    clues: [
      {
        baseValue: 200,
        clue: 'Reaching a depth of nearly 36,000 feet, Challenger Deep is the deepest known point on Earth, located in this western Pacific trench.',
        answer: 'Mariana Trench',
        accept: ['the mariana trench', 'marianas trench']
      },
      {
        baseValue: 200,
        clue: 'Coral reefs look like colorful sea rocks or underwater plants, but are biologically classified as colonies of tiny what?',
        answer: 'Animals',
        accept: ['invertebrates', 'polyps', 'coral polyps', 'sea animals']
      },
      {
        baseValue: 400,
        clue: 'The deep-sea anglerfish uses a glowing fleshy lure called an esca protruding from its head, powered by symbiotic what?',
        answer: 'Bacteria',
        accept: ['bioluminescent bacteria', 'luminescent bacteria']
      },
      {
        baseValue: 400,
        clue: 'What predatory marine mammal, actually the largest member of the dolphin family, is nicknamed the "killer whale"?',
        answer: 'Orca',
        accept: ['orcinus orca', 'killer whale']
      },
      {
        baseValue: 600,
        clue: 'The giant squid possesses the largest eyes in the animal kingdom, measuring up to the diameter of this common sports ball.',
        answer: 'Basketball',
        accept: ['a basketball', 'dinner plate', 'soccer ball', 'volleyball']
      },
      {
        baseValue: 600,
        clue: 'Unlike bony fish, sharks and stingrays have skeletons composed entirely of this flexible tissue found in human noses and ears.',
        answer: 'Cartilage',
        accept: ['cartilaginous']
      },
      {
        baseValue: 800,
        clue: 'What pink, gelatinous deep-sea creature was voted the "World’s Ugliest Animal" in 2013, though it looks normal under extreme underwater pressure?',
        answer: 'Blobfish',
        accept: ['the blobfish']
      },
      {
        baseValue: 800,
        clue: 'Hydrothermal vents on the ocean floor spew superheated mineral-rich water at temperatures exceeding 700°F without boiling due to intense what?',
        answer: 'Pressure',
        accept: ['water pressure', 'atmospheric pressure', 'high pressure']
      },
      {
        baseValue: 1000,
        clue: 'The Turritopsis dohrnii jellyfish can repeatedly revert from its adult medusa stage back into an immature polyp, earning it what mythical nickname?',
        answer: 'Immortal jellyfish',
        accept: ['immortal', 'the immortal jellyfish']
      },
      {
        baseValue: 1000,
        clue: 'The colossal squid has tentacle suckers armed not just with suction cups, but with sharp rotating what?',
        answer: 'Hooks',
        accept: ['claws', 'swiveling hooks', 'barbs']
      },
      {
        baseValue: 200,
        clue: 'Sharks must swim constantly forward to keep water flowing across these respiratory organs so they don’t suffocate.',
        answer: 'Gills',
        accept: ['their gills', 'gill slits']
      },
      {
        baseValue: 400,
        clue: 'Male seahorses, rather than females, are the ones that carry and give birth to baby seahorses in this abdominal feature.',
        answer: 'Pouch',
        accept: ['brood pouch', 'their pouch']
      },
      {
        baseValue: 600,
        clue: 'More than what percentage of Earth\'s vast oceans remain completely unexplored and unmapped by human eyes?',
        answer: '80%',
        accept: ['80', '80 percent', 'eighty percent', 'over 80%']
      },
      {
        baseValue: 800,
        clue: 'The narwhal\'s iconic spiral horn protruding from its head is actually an overgrown, sensory-packed left what?',
        answer: 'Tooth',
        accept: ['canine tooth', 'incisor', 'tusk']
      },
      {
        baseValue: 1000,
        clue: 'What deep-sea cephalopod has the scientific name Vampyroteuthis infernalis, translating to "vampire squid from hell"?',
        answer: 'Vampire squid',
        accept: ['the vampire squid']
      }
    ]
  },
  {
    id: 'human-biology',
    name: 'HUMAN BIOLOGY & WEIRD BODIES',
    icon: '🧠',
    group: 'science',
    blurb: 'Brain wiring, organ superpowers & anatomical weirdness',
    clues: [
      {
        baseValue: 200,
        clue: 'The human brain makes up only about 2% of total body weight, but consumes approximately this percentage of the body’s oxygen and energy.',
        answer: '20%',
        accept: ['20', 'twenty percent', 'one fifth', '20 percent']
      },
      {
        baseValue: 200,
        clue: 'The hardest substance in the human body is not bone, but this protective outer layer coating your teeth.',
        answer: 'Enamel',
        accept: ['tooth enamel']
      },
      {
        baseValue: 400,
        clue: 'Your heart beats approximately this many times in an average single day.',
        answer: '100,000',
        accept: ['100000', 'one hundred thousand', 'a hundred thousand', '80000 to 100000']
      },
      {
        baseValue: 400,
        clue: 'Adult humans have 206 bones, while human infants are born with around this higher number of bones that later fuse together.',
        answer: '300',
        accept: ['three hundred', 'around 300', '270 to 300']
      },
      {
        baseValue: 600,
        clue: 'The largest internal organ in the human body, capable of regenerating itself even if up to 75% is removed, is the what?',
        answer: 'Liver',
        accept: ['the liver']
      },
      {
        baseValue: 600,
        clue: 'The tiny "stapes" (or stirrup) bone, the smallest bone in the human body, is located inside which sensory organ?',
        answer: 'Ear',
        accept: ['middle ear', 'the ear', 'inner ear']
      },
      {
        baseValue: 800,
        clue: 'If you uncoiled and stretched out all the blood vessels in an adult human body end-to-end, they would wrap around Earth how many times?',
        answer: '2.5',
        accept: ['2', '3', 'two to three times', 'twice', 'two and a half']
      },
      {
        baseValue: 800,
        clue: 'Humans shed approximately 30,000 to 40,000 dead cells of this tissue every single minute, making up much of household dust.',
        answer: 'Skin',
        accept: ['skin cells', 'epidermis']
      },
      {
        baseValue: 1000,
        clue: 'The stomach produces a brand-new lining of protective mucus every few days to prevent its own digestive acid from doing what to itself?',
        answer: 'Digesting itself',
        accept: ['eating itself', 'dissolving itself', 'burning through']
      },
      {
        baseValue: 1000,
        clue: 'The longest single nerve in the human body, running from the lower spinal cord all the way down to the big toe, is named this.',
        answer: 'Sciatic nerve',
        accept: ['sciatic']
      },
      {
        baseValue: 200,
        clue: 'Like fingerprints, every human being has a unique pattern and imprint on this muscular organ inside the mouth.',
        answer: 'Tongue',
        accept: ['tongue print', 'the tongue']
      },
      {
        baseValue: 400,
        clue: 'The human eye can distinguish approximately how many millions of different color hues?',
        answer: '10',
        accept: ['10 million', 'ten million', '7 to 10 million']
      },
      {
        baseValue: 600,
        clue: 'Goosebumps on human skin are an evolutionary leftover from when our ancestors had thick coats of what?',
        answer: 'Hair',
        accept: ['fur', 'body hair']
      },
      {
        baseValue: 800,
        clue: 'What type of blood cells are responsible for carrying oxygen from the lungs to the rest of the body?',
        answer: 'Red blood cells',
        accept: ['erythrocytes', 'rbc', 'red cells']
      },
      {
        baseValue: 1000,
        clue: 'What horseshoe-shaped bone in the human neck is the only bone in the entire body that is not articulated to any other bone?',
        answer: 'Hyoid bone',
        accept: ['hyoid']
      }
    ]
  },
  {
    id: 'weather-disasters',
    name: 'WILD WEATHER & VOLCANOES',
    icon: '🌪️',
    group: 'science',
    blurb: 'Tornadoes, supervolcanoes, ball lightning & seismic fury',
    clues: [
      {
        baseValue: 200,
        clue: 'The scale used by meteorologists to rate tornado intensity based on damage caused is called the Enhanced ___ Scale.',
        answer: 'Fujita',
        accept: ['fujita scale', 'ef scale']
      },
      {
        baseValue: 200,
        clue: 'The calm, clear center of a rotating tropical hurricane or cyclone is known by this anatomical name.',
        answer: 'The eye',
        accept: ['eye', 'eye of the storm']
      },
      {
        baseValue: 400,
        clue: 'In 1883, the catastrophic eruption of this Indonesian island volcano produced the loudest sound in recorded human history, heard 3,000 miles away.',
        answer: 'Krakatoa',
        accept: ['krakatau']
      },
      {
        baseValue: 400,
        clue: 'Earthquakes that occur underneath the ocean floor displace billions of gallons of water, generating this deadly harbor wave.',
        answer: 'Tsunami',
        accept: ['tsunamis', 'tidal wave']
      },
      {
        baseValue: 600,
        clue: 'Lake Maracaibo in this South American country experiences lightning strikes approximately 260 days a year, earning it the title "Lightning Capital of the World".',
        answer: 'Venezuela',
        accept: ['republic of venezuela']
      },
      {
        baseValue: 600,
        clue: 'The horseshoe-shaped zone around the Pacific Ocean basin prone to 90% of the world\'s earthquakes and 75% of volcanoes is called the Ring of what?',
        answer: 'Fire',
        accept: ['ring of fire', 'pacific ring of fire']
      },
      {
        baseValue: 800,
        clue: 'In 1816, the massive eruption of Mount Tambora blocked sunlight worldwide, causing a global disaster nicknamed "The Year Without a ___".',
        answer: 'Summer',
        accept: ['a summer']
      },
      {
        baseValue: 800,
        clue: 'The mysterious, rare meteorological phenomenon where a glowing orb of plasma drifts slowly indoors during thunderstorms is called ___ lightning.',
        answer: 'Ball lightning',
        accept: ['ball']
      },
      {
        baseValue: 1000,
        clue: 'The highest natural air temperature ever reliably recorded on Earth reached 134°F (56.7°C) in this California national park in 1913.',
        answer: 'Death Valley',
        accept: ['death valley national park', 'furnace creek']
      },
      {
        baseValue: 1000,
        clue: 'Supervolcano caldera eruptions, such as the one sleeping beneath this U.S. national park, can eject over 240 cubic miles of volcanic material.',
        answer: 'Yellowstone',
        accept: ['yellowstone national park']
      },
      {
        baseValue: 200,
        clue: 'What white crystalline precipitation occurs when atmospheric water vapor freezes directly into ice crystals without becoming liquid first?',
        answer: 'Snow',
        accept: ['snowflakes', 'ice crystals']
      },
      {
        baseValue: 400,
        clue: 'What instrument invented by Evangelista Torricelli measures atmospheric air pressure to help forecast weather changes?',
        answer: 'Barometer',
        accept: ['a barometer']
      },
      {
        baseValue: 600,
        clue: 'Clouds with a dark, towering anvil shape associated with severe hail, wind, and tornadoes are called cumulonimbus clouds. True or False?',
        answer: 'True',
        accept: ['t']
      },
      {
        baseValue: 800,
        clue: 'The Atacama Desert, one of the driest places on Earth where some weather stations have never recorded rain, is located primarily in this country.',
        answer: 'Chile',
        accept: ['republic of chile']
      },
      {
        baseValue: 1000,
        clue: 'A rotating column of air over a body of water, often appearing like a tornado over a lake or ocean, is called a what?',
        answer: 'Waterspout',
        accept: ['water spout']
      }
    ]
  },
  {
    id: 'inventions-world',
    name: 'INVENTIONS THAT CHANGED THE WORLD',
    icon: '💡',
    group: 'science',
    blurb: 'Breakthrough ideas, printing presses, electricity & steam engines',
    clues: [
      {
        baseValue: 200,
        clue: 'Around 1440 in Mainz, Germany, Johannes Gutenberg revolutionized human communication by inventing the movable-type what?',
        answer: 'Printing press',
        accept: ['printing', 'press']
      },
      {
        baseValue: 200,
        clue: 'In 1879, Thomas Edison patented a commercially viable incandescent version of this glass object with a carbonized filament.',
        answer: 'Lightbulb',
        accept: ['light bulb', 'electric light']
      },
      {
        baseValue: 400,
        clue: 'In 1928, Scottish physician Alexander Fleming accidentally discovered this mold-derived antibiotic that saved millions from bacterial infections.',
        answer: 'Penicillin',
        accept: ['penicillium']
      },
      {
        baseValue: 400,
        clue: 'On December 17, 1903 in Kitty Hawk, North Carolina, Orville and Wilbur Wright achieved the first sustained, powered heavier-than-air flight of this vehicle.',
        answer: 'Airplane',
        accept: ['aeroplane', 'plane', 'aircraft', 'flyer']
      },
      {
        baseValue: 600,
        clue: 'In 1989, British computer scientist Tim Berners-Lee invented the World Wide Web while working at this European particle physics laboratory.',
        answer: 'CERN',
        accept: ['cern laboratory']
      },
      {
        baseValue: 600,
        clue: 'Nikola Tesla championed alternating current (AC) electricity over the direct current (DC) system backed by his former employer, this famous inventor.',
        answer: 'Thomas Edison',
        accept: ['edison']
      },
      {
        baseValue: 800,
        clue: 'In 1876, Alexander Graham Bell was awarded the first patent for this device after speaking the famous words "Mr. Watson, come here, I want to see you."',
        answer: 'Telephone',
        accept: ['phone']
      },
      {
        baseValue: 800,
        clue: 'In 1947 at Bell Labs, John Bardeen, Walter Brattain, and William Shockley invented this miniature semiconductor switch that powers all modern computers.',
        answer: 'Transistor',
        accept: ['the transistor']
      },
      {
        baseValue: 1000,
        clue: 'In 1796, English physician Edward Jenner developed the world’s very first vaccine, using cowpox blisters to inoculate children against this lethal disease.',
        answer: 'Smallpox',
        accept: ['variola']
      },
      {
        baseValue: 1000,
        clue: 'Swedish chemist Alfred Nobel invented this explosive in 1867 by stabilizing nitroglycerin in diatomaceous earth, later funding prestigious prizes with his fortune.',
        answer: 'Dynamite',
        accept: ['dynamite explosive']
      },
      {
        baseValue: 200,
        clue: 'What ancient Chinese invention, one of the "Four Great Inventions", used a magnetized needle to point toward magnetic north?',
        answer: 'Compass',
        accept: ['magnetic compass']
      },
      {
        baseValue: 400,
        clue: 'James Watt revolutionized the Industrial Revolution in the 1760s by dramatically improving the efficiency of this engine.',
        answer: 'Steam engine',
        accept: ['steam']
      },
      {
        baseValue: 600,
        clue: 'In 1973, Motorola engineer Martin Cooper made the first public handheld call from the street using this revolutionary device.',
        answer: 'Mobile phone',
        accept: ['cell phone', 'cellular phone', 'cellphone']
      },
      {
        baseValue: 800,
        clue: 'The first successful steam locomotive, named the "Rocket", was designed in 1829 by British engineer George who?',
        answer: 'Stephenson',
        accept: ['george stephenson', 'robert stephenson']
      },
      {
        baseValue: 1000,
        clue: 'In 1908, Henry Ford began mass production of which affordable automobile on an automated moving assembly line?',
        answer: 'Model T',
        accept: ['ford model t', 'the model t', 'tin lizzie']
      }
    ]
  },
  {
    id: 'freaky-animals',
    name: 'FREAKY ANIMAL FACTS',
    icon: '🦎',
    group: 'science',
    blurb: 'Square poop, blue blood, regenerating limbs & biological oddities',
    clues: [
      {
        baseValue: 200,
        clue: 'Flamingos hatch with gray-white feathers and turn pink thanks to pigments in the algae and these tiny crustaceans they eat.',
        answer: 'Shrimp',
        accept: ['brine shrimp', 'prawns']
      },
      {
        baseValue: 200,
        clue: 'A chameleon’s tongue can snap out to snatch an insect prey at a distance of up to twice its entire body length. True or False?',
        answer: 'True',
        accept: ['t']
      },
      {
        baseValue: 400,
        clue: 'This clever eight-armed ocean creature pumps blue blood through not one, not two, but three hearts.',
        answer: 'Octopus',
        accept: ['octopuses', 'octopi']
      },
      {
        baseValue: 400,
        clue: 'Frogs actually close and retract these sensory organs down into their mouth to help physically push swallowed food down their throat.',
        answer: 'Eyes',
        accept: ['eyeballs', 'their eyes']
      },
      {
        baseValue: 600,
        clue: 'To keep its territorial droppings from rolling off rocks, this stocky Australian marsupial famously poops in cubes.',
        answer: 'Wombat',
        accept: ['wombats']
      },
      {
        baseValue: 600,
        clue: 'Electric eels are not true eels, but are actually a type of knifefish related to catfish and carps. True or False?',
        answer: 'True',
        accept: ['t']
      },
      {
        baseValue: 800,
        clue: 'This duck-billed, egg-laying Australian mammal glows bluish-green under UV light and packs venomous ankle spurs.',
        answer: 'Platypus',
        accept: ['duck billed platypus']
      },
      {
        baseValue: 800,
        clue: 'The pistol shrimp snaps its specialized claw so rapidly it generates a bubble temperature nearly as hot as the surface of what star?',
        answer: 'The Sun',
        accept: ['sun', 'our sun']
      },
      {
        baseValue: 1000,
        clue: 'Nicknamed a "thumb splitter," this colorful marine crustacean punches prey so fast it boils the surrounding water and creates light.',
        answer: 'Mantis shrimp',
        accept: ['peacock mantis shrimp']
      },
      {
        baseValue: 1000,
        clue: 'The Greenland shark has the longest known lifespan of any vertebrate animal, capable of living for at least this many centuries.',
        answer: '4',
        accept: ['4 centuries', 'four', '400 years', 'over 400 years']
      },
      {
        baseValue: 200,
        clue: 'What black-and-white aquatic bird from the Southern Hemisphere cannot fly in the air, but swims like an underwater torpedo?',
        answer: 'Penguin',
        accept: ['penguins', 'emperor penguin']
      },
      {
        baseValue: 400,
        clue: 'Bat wings are made of skin stretched between elongated bones that correspond to which human body parts?',
        answer: 'Fingers',
        accept: ['finger bones', 'hands', 'digits']
      },
      {
        baseValue: 600,
        clue: 'A group of wild porcupines is playfully known as a what?',
        answer: 'Prickle',
        accept: ['a prickle']
      },
      {
        baseValue: 800,
        clue: 'Female spotted hyenas are larger and more aggressive than males, and possess higher levels of which hormone?',
        answer: 'Testosterone',
        accept: ['androgens']
      },
      {
        baseValue: 1000,
        clue: 'What flightless New Zealand bird has nostrils located at the very tip of its long beak to sniff out worms underground?',
        answer: 'Kiwi',
        accept: ['kiwi bird', 'the kiwi']
      }
    ]
  },
  {
    id: 'everyday-science',
    name: 'EVERYDAY SCIENCE & CHEMISTRY',
    icon: '🧪',
    group: 'science',
    blurb: 'Molecules, chemical reactions, elements & kitchen experiments',
    clues: [
      {
        baseValue: 200,
        clue: 'Spooky fog at Halloween parties often comes from "dry ice," which is simply the frozen solid form of this gas we exhale.',
        answer: 'Carbon dioxide',
        accept: ['co2']
      },
      {
        baseValue: 200,
        clue: 'Water reaches its maximum boiling point at sea level at 100 degrees on this temperature scale.',
        answer: 'Celsius',
        accept: ['centigrade', 'c']
      },
      {
        baseValue: 400,
        clue: 'Botanically speaking, strawberries are NOT berries — while this curved yellow potassium-rich fruit actually IS a berry.',
        answer: 'Banana',
        accept: ['bananas']
      },
      {
        baseValue: 400,
        clue: 'When you cut into an onion, it releases sulfuric compounds that mix with your tears to produce mild sulfuric what?',
        answer: 'Acid',
        accept: ['sulfuric acid']
      },
      {
        baseValue: 600,
        clue: 'Derived from the Latin word "aurum," these two letters represent gold on the periodic table.',
        answer: 'Au',
        accept: []
      },
      {
        baseValue: 600,
        clue: 'Table salt is formed by the ionic bonding of sodium (Na) and which halogen element?',
        answer: 'Chlorine',
        accept: ['chloride', 'cl']
      },
      {
        baseValue: 800,
        clue: 'Reaching around 50,000°F (30,000°C), a bolt of this weather phenomenon is roughly five times hotter than the surface of the Sun.',
        answer: 'Lightning',
        accept: ['lightning bolt']
      },
      {
        baseValue: 800,
        clue: 'Diamonds and graphite in pencils are both made of 100% pure atoms of this single chemical element.',
        answer: 'Carbon',
        accept: ['c']
      },
      {
        baseValue: 1000,
        clue: 'Chubby microscopic survivors nicknamed "water bears" or "moss piglets" that can survive outer space are formally called these.',
        answer: 'Tardigrades',
        accept: ['tardigrade']
      },
      {
        baseValue: 1000,
        clue: 'What noble gas with the atomic number 2 is the second most abundant element in the universe, discovered on the Sun before Earth?',
        answer: 'Helium',
        accept: ['he']
      },
      {
        baseValue: 200,
        clue: 'Plants convert sunlight, water, and carbon dioxide into oxygen and glucose through this biological process.',
        answer: 'Photosynthesis',
        accept: ['photosynthesize']
      },
      {
        baseValue: 400,
        clue: 'What is the only metal element that remains liquid at standard room temperature and pressure?',
        answer: 'Mercury',
        accept: ['hg', 'quicksilver']
      },
      {
        baseValue: 600,
        clue: 'Mixing baking soda and vinegar produces bubbling fizz caused by the rapid release of what gas?',
        answer: 'Carbon dioxide',
        accept: ['co2']
      },
      {
        baseValue: 800,
        clue: 'On the pH scale of 0 to 14, pure neutral distilled water has a pH value of exactly this number.',
        answer: '7',
        accept: ['seven']
      },
      {
        baseValue: 1000,
        clue: 'What subatomic particles orbit the nucleus of an atom and carry a negative electrical charge?',
        answer: 'Electrons',
        accept: ['electron']
      }
    ]
  },
  {
    id: 'tech-gadgets',
    name: 'TECH & GADGETS',
    icon: '💻',
    group: 'science',
    blurb: 'Silicon chips, operating systems, internet history & gadget lore',
    clues: [
      {
        baseValue: 200,
        clue: 'Look at the top-left letter row on a standard English keyboard to spell out this six-letter layout name.',
        answer: 'QWERTY',
        accept: ['qwerty keyboard']
      },
      {
        baseValue: 200,
        clue: 'In computer memory, how many bits make up a single byte?',
        answer: '8',
        accept: ['eight', '8 bits']
      },
      {
        baseValue: 400,
        clue: 'Hit a broken link on the web and the server usually greets you with this three-digit HTTP "Not Found" status code.',
        answer: '404',
        accept: ['error 404', '404 not found']
      },
      {
        baseValue: 400,
        clue: 'What open-source mobile operating system developed by Google is symbolized by a friendly green robot?',
        answer: 'Android',
        accept: ['android os']
      },
      {
        baseValue: 600,
        clue: 'In 1947, Grace Hopper’s team taped an actual trapped insect of this nocturnal winged type into their logbook — popularizing the term "debugging."',
        answer: 'Moth',
        accept: ['a moth']
      },
      {
        baseValue: 600,
        clue: 'The first Apple iPhone, announced by Steve Jobs in January 2007, went on sale later that year in this summer month.',
        answer: 'June',
        accept: ['june 2007', 'june 29']
      },
      {
        baseValue: 800,
        clue: 'This short-range wireless tech for headphones and controllers was named after 10th-century Viking King Harald — whose runic initials form its logo!',
        answer: 'Bluetooth',
        accept: ['harald bluetooth']
      },
      {
        baseValue: 800,
        clue: 'What company was originally founded in 1994 as an online bookstore operating out of Jeff Bezos\'s garage?',
        answer: 'Amazon',
        accept: ['amazon.com']
      },
      {
        baseValue: 1000,
        clue: 'Those "click all the traffic lights to prove you’re human" web tests go by this seven-letter acronym.',
        answer: 'CAPTCHA',
        accept: ['recaptcha']
      },
      {
        baseValue: 1000,
        clue: 'What Finnish software engineer created the open-source Linux kernel in 1991 while a university student?',
        answer: 'Linus Torvalds',
        accept: ['torvalds']
      },
      {
        baseValue: 200,
        clue: 'What is the primary computer processing component often described as the "brain" of the computer, abbreviated CPU?',
        answer: 'Central Processing Unit',
        accept: ['processor', 'cpu']
      },
      {
        baseValue: 400,
        clue: 'What file format created by CompuServe in 1987 famously sparked endless internet debates over whether it is pronounced with a hard "G" or soft "J"?',
        answer: 'GIF',
        accept: ['gif format', '.gif']
      },
      {
        baseValue: 600,
        clue: 'In 1997, IBM supercomputer Deep Blue made history by defeating reigning World Champion Garry Kasparov at which board game?',
        answer: 'Chess',
        accept: ['world chess']
      },
      {
        baseValue: 800,
        clue: 'The world\'s very first computer programmer was this 19th-century English mathematician who wrote algorithms for Charles Babbage’s Analytical Engine.',
        answer: 'Ada Lovelace',
        accept: ['lovelace', 'augusta ada king']
      },
      {
        baseValue: 1000,
        clue: 'What popular peer-to-peer music-sharing service founded in 1999 by Shawn Fanning was shut down in 2001 after lawsuits from Metallica and the RIAA?',
        answer: 'Napster',
        accept: ['napster music']
      }
    ]
  }
];

module.exports = { SCIENCE_CATEGORIES };

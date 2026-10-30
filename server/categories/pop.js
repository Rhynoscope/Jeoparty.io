'use strict';

/**
 * POP CULTURE & ENTERTAINMENT CATEGORIES
 * Video games, memes, anime, cartoons, cinema, movie quotes, streaming TV, and retro nostalgia.
 */

const POP_CATEGORIES = [
  {
    id: 'internet-memes',
    name: 'INTERNET LORE & MEMES',
    icon: '🌐',
    group: 'pop',
    blurb: 'Viral videos, classic meme formats & iconic internet culture',
    clues: [
      {
        baseValue: 200,
        clue: 'Tricking someone into clicking a disguised link to a 1987 Rick Astley music video goes by this verb.',
        answer: 'Rickrolling',
        accept: ['rickroll', 'rick rolling', 'rick roll', 'rickrolled']
      },
      {
        baseValue: 400,
        clue: 'A Shiba Inu named Kabosu inspired this iconic meme — and a cryptocurrency of the exact same name.',
        answer: 'Doge',
        accept: ['dogecoin', 'doge meme']
      },
      {
        baseValue: 600,
        clue: 'In 2015, the entire internet argued whether a photographed striped dress was black-and-blue or these two colors.',
        answer: 'White and gold',
        accept: ['gold and white', 'white gold', 'gold white']
      },
      {
        baseValue: 800,
        clue: 'In KC Green’s famous comic meme, a cartoon dog wearing a bowler hat sips coffee in a burning room and says this 3-word phrase.',
        answer: 'This is fine',
        accept: ['its fine']
      },
      {
        baseValue: 1000,
        clue: 'A 2011 viral pixel-art cat with a cherry Pop-Tart body zoomed across space trailing a rainbow under this name.',
        answer: 'Nyan Cat',
        accept: ['nyancat']
      },
      {
        baseValue: 400,
        clue: 'In 2023, McDonald’s released a purple berry shake celebrating this fuzzy mascot’s birthday that became a viral horror-trend meme.',
        answer: 'Grimace',
        accept: ['grimace shake', 'grimace birthday']
      },
      {
        baseValue: 600,
        clue: 'A Turkish chef nicknamed "Salt ___" went viral worldwide for dramatically dropping seasoning crystals down his forearm.',
        answer: 'Bae',
        accept: ['salt bae', 'saltbae', 'nusret']
      },
      {
        baseValue: 800,
        clue: 'The iconic stock photo of a man walking with his girlfriend while rubbernecking at another woman in red is the "___ Boyfriend" meme.',
        answer: 'Distracted',
        accept: ['distracted boyfriend', 'distracted boyfriend meme']
      },
      {
        baseValue: 200,
        clue: 'What popular 2012 Korean music video by Psy became the first video in YouTube history to hit one billion views?',
        answer: 'Gangnam Style',
        accept: ['gangnam']
      },
      {
        baseValue: 400,
        clue: 'What viral catchphrase was uttered in 2007 by Chris Crocker in a tearful YouTube video defending pop star Britney Spears?',
        answer: 'Leave Britney alone',
        accept: ['leave britney alone!', 'leave her alone']
      },
      {
        baseValue: 600,
        clue: 'In the classic "Woman Yelling at a Cat" meme, who is the white cat sitting at a dinner table in front of a plate of salad?',
        answer: 'Smudge',
        accept: ['smudge the cat', 'smudge']
      },
      {
        baseValue: 800,
        clue: 'What 2007 viral video featured a baby biting his older brother\'s finger, followed by the quote "Charlie bit my finger!"?',
        answer: 'Charlie bit my finger',
        accept: ['charlie', 'charlie bit me']
      },
      {
        baseValue: 1000,
        clue: 'What 4-panel comic meme template, created by Tim Buckley in 2008 for his gaming webcomic Ctrl+Alt+Del, became an immortal internet inside joke?',
        answer: 'Loss',
        accept: ['loss comic', 'is this loss', 'cad loss']
      },
      {
        baseValue: 200,
        clue: 'In the iconic "They\'re the same picture" meme, which character from The Office is holding two photos for Creed Bratton to evaluate?',
        answer: 'Pam',
        accept: ['pam beesly', 'pam halpert']
      },
      {
        baseValue: 1000,
        clue: 'What was the real name of "Grumpy Cat", the beloved internet feline known for her permanently unimpressed facial expression caused by feline dwarfism?',
        answer: 'Tardar Sauce',
        accept: ['tardar sauce', 'tarder sauce']
      }
    ]
  },
  {
    id: 'video-games',
    name: 'VIDEO GAME WORLDS',
    icon: '🎮',
    group: 'pop',
    blurb: 'Gaming legends, speedruns, lore, boss fights & iconic franchises',
    clues: [
      {
        baseValue: 200,
        clue: 'Watch out for hissing green Creepers while punching trees and mining diamonds in this bestselling sandbox game.',
        answer: 'Minecraft',
        accept: ['mine craft']
      },
      {
        baseValue: 400,
        clue: 'In The Legend of Zelda series, Zelda is the princess — while the green-tunic hero you actually play as is named this.',
        answer: 'Link',
        accept: []
      },
      {
        baseValue: 600,
        clue: 'Before Nintendo named him Mario, the mustachioed hero of 1981’s Donkey Kong went by this bouncy job title.',
        answer: 'Jumpman',
        accept: ['jump man']
      },
      {
        baseValue: 800,
        clue: 'Town guards in The Elder Scrolls V: Skyrim endlessly complain that they used to be an adventurer like you until taking an arrow here.',
        answer: 'In the knee',
        accept: ['knee', 'the knee', 'to the knee', 'my knee']
      },
      {
        baseValue: 1000,
        clue: 'Blinky, Pinky, Inky, and this orange fourth ghost chase Pac-Man around the arcade maze.',
        answer: 'Clyde',
        accept: []
      },
      {
        baseValue: 400,
        clue: 'In 2005, a World of Warcraft paladin named ___ Jenkins shouted his own name and charged a dragon rookery, wiping out his entire guild.',
        answer: 'Leeroy',
        accept: ['leeroy jenkins', 'leroy jenkins', 'leroy']
      },
      {
        baseValue: 600,
        clue: 'In Star Fox 64, Peppy Hare screams this famous spinning combat maneuver at Fox McCloud.',
        answer: 'Do a barrel roll',
        accept: ['barrel roll', 'do a barrel roll!']
      },
      {
        baseValue: 200,
        clue: 'What battle royale sensation by Epic Games drops 100 players from a flying Battle Bus onto an island to build and fight?',
        answer: 'Fortnite',
        accept: ['fortnite battle royale']
      },
      {
        baseValue: 400,
        clue: 'Master Chief John-117 and his AI companion Cortana fight the alien Covenant in this flagship Xbox shooter franchise.',
        answer: 'Halo',
        accept: ['halo combat evolved', 'halo franchise']
      },
      {
        baseValue: 600,
        clue: 'What block-stacking puzzle game was created in 1984 by Soviet computer programmer Alexey Pajitnov?',
        answer: 'Tetris',
        accept: ['tetris game']
      },
      {
        baseValue: 800,
        clue: 'In Valve\'s 2007 puzzle masterpiece Portal, GLaDOS repeatedly motivates the player with the promise of this confection, which turns out to be a lie.',
        answer: 'Cake',
        accept: ['the cake', 'a cake']
      },
      {
        baseValue: 1000,
        clue: 'The classic cheat code "Up, Up, Down, Down, Left, Right, Left, Right, B, A" is named after this Japanese video game developer.',
        answer: 'Konami',
        accept: ['konami code']
      },
      {
        baseValue: 200,
        clue: 'What high-speed blue hedgehog collects gold rings and battles Dr. Eggman for Sega?',
        answer: 'Sonic',
        accept: ['sonic the hedgehog']
      },
      {
        baseValue: 800,
        clue: 'In Dark Souls, players rest, level up, and kindle flames at these sword-impaled campfires scattered throughout Lordran.',
        answer: 'Bonfires',
        accept: ['bonfire', 'a bonfire']
      },
      {
        baseValue: 1000,
        clue: 'In Red Dead Redemption 2, what is the full name of the Dutch van der Linde gang member who serves as the main protagonist?',
        answer: 'Arthur Morgan',
        accept: ['arthur', 'morgan']
      }
    ]
  },
  {
    id: 'nintendo-mario',
    name: 'NINTENDO & MARIO LORE',
    icon: '🍄',
    group: 'pop',
    blurb: 'Mushroom Kingdom, Yoshi, Kirby, Smash Bros & Nintendo trivia',
    clues: [
      {
        baseValue: 200,
        clue: 'Mario\'s taller, green-clad younger brother who stars in his own haunted mansion ghost-hunting series is named what?',
        answer: 'Luigi',
        accept: ['luigi mario']
      },
      {
        baseValue: 200,
        clue: 'What spiked-shelled Koopa monarch repeatedly kidnaps Princess Peach and breathes fire at Mario?',
        answer: 'Bowser',
        accept: ['king bowser', 'king koopa']
      },
      {
        baseValue: 400,
        clue: 'In Super Mario World, Mario gains a faithful green dinosaur mount that can swallow enemies and flutter-jump, named what?',
        answer: 'Yoshi',
        accept: ['yoshis']
      },
      {
        baseValue: 400,
        clue: 'What pink, round puffball hero from Planet Popstar can inhale enemies to copy their abilities?',
        answer: 'Kirby',
        accept: ['kirby the pink puffball']
      },
      {
        baseValue: 600,
        clue: 'In Mario Kart races, this winged blue weapon flies directly toward the player currently in first place, exploding on impact.',
        answer: 'Blue Shell',
        accept: ['spiny shell', 'the blue shell', 'blue spiny shell']
      },
      {
        baseValue: 600,
        clue: 'In Super Smash Bros, what legendary fighting-game tournament creator also served as the director and voice of King Dedede?',
        answer: 'Masahiro Sakurai',
        accept: ['sakurai']
      },
      {
        baseValue: 800,
        clue: 'Mario and Luigi originally worked as carpenters in Donkey Kong, but switched to this subterranean trade in 1983.',
        answer: 'Plumbers',
        accept: ['plumbing', 'plumber']
      },
      {
        baseValue: 800,
        clue: 'What mischievous, garlic-loving anti-hero with yellow overalls and a jagged mustache made his debut in Super Mario Land 2?',
        answer: 'Wario',
        accept: ['wario!']
      },
      {
        baseValue: 1000,
        clue: 'In The Legend of Zelda: Ocarina of Time, what is the name of Link\'s talkative fairy companion who famously advises "Hey! Listen!"?',
        answer: 'Navi',
        accept: ['navi the fairy']
      },
      {
        baseValue: 1000,
        clue: 'Nintendo\'s 2006 motion-controlled home console that revolutionized gaming with bowling, tennis, and a wireless remote was called the what?',
        answer: 'Wii',
        accept: ['nintendo wii', 'the wii']
      },
      {
        baseValue: 200,
        clue: 'What glowing yellow item in Mario games makes Mario completely invulnerable to enemies for a limited time accompanied by high-tempo music?',
        answer: 'Starman',
        accept: ['super star', 'star', 'invincibility star']
      },
      {
        baseValue: 400,
        clue: 'The monarch who rules over Sarasaland, sporting orange robes and sports gear in spin-offs, is Princess who?',
        answer: 'Daisy',
        accept: ['princess daisy']
      },
      {
        baseValue: 600,
        clue: 'What space explorer captain crash-lands on a strange planet and commands hordes of tiny plant-like creatures in an eponymous strategy franchise?',
        answer: 'Captain Olimar',
        accept: ['olimar', 'pikmin olimar']
      },
      {
        baseValue: 800,
        clue: 'Donkey Kong\'s chimpanzee nephew and sidekick, who wears a red baseball cap and stars in Donkey Kong Country, is named what?',
        answer: 'Diddy Kong',
        accept: ['diddy']
      },
      {
        baseValue: 1000,
        clue: 'What is the full canon name of the Mushroom Kingdom ruler whose original English localization name was "Princess Toadstool"?',
        answer: 'Princess Peach',
        accept: ['peach', 'princess peach toadstool']
      }
    ]
  },
  {
    id: 'superheroes',
    name: 'SUPERHEROES & VILLAINS',
    icon: '🦸‍♂️',
    group: 'pop',
    blurb: 'Marvel, DC, Infinity Stones, mutant powers & comic lore',
    clues: [
      {
        baseValue: 200,
        clue: 'Glowing green chunks of Superman’s exploded home planet form this famous mineral weakness.',
        answer: 'Kryptonite',
        accept: ['green kryptonite']
      },
      {
        baseValue: 400,
        clue: 'Batman prowls the gargoyles and alleyways of this crime-ridden fictional city.',
        answer: 'Gotham',
        accept: ['gotham city']
      },
      {
        baseValue: 600,
        clue: 'Captain America’s round shield and Black Panther’s Wakandan suit are both forged from this fictional shock-absorbing metal.',
        answer: 'Vibranium',
        accept: ['vibranium alloy']
      },
      {
        baseValue: 800,
        clue: '\"With great power comes great responsibility\" is forever tied to this beloved uncle of Peter Parker.',
        answer: 'Uncle Ben',
        accept: ['ben parker', 'ben']
      },
      {
        baseValue: 1000,
        clue: 'Wade Wilson — better known as Deadpool — constantly talks directly to the audience, a theatrical trope called breaking this numbered barrier.',
        answer: 'The fourth wall',
        accept: ['fourth wall', '4th wall']
      },
      {
        baseValue: 200,
        clue: 'Bitten by a radioactive arachnid on a high-school field trip, high schooler Peter Parker fights crime as this Marvel hero.',
        answer: 'Spider-Man',
        accept: ['spiderman', 'spider man']
      },
      {
        baseValue: 400,
        clue: 'Billionaire playboy Tony Stark powers his high-tech armored suits using this chest-mounted energy reactor.',
        answer: 'Arc reactor',
        accept: ['arc', 'the arc reactor']
      },
      {
        baseValue: 600,
        clue: 'In Marvel Comics, what adamantium-clawed Canadian mutant has superhuman cellular regeneration and goes by the name Logan?',
        answer: 'Wolverine',
        accept: ['logan', 'weapon x']
      },
      {
        baseValue: 800,
        clue: 'What purple warlord collected all six Infinity Stones in Avengers: Infinity War to wipe out half of all life in the universe?',
        answer: 'Thanos',
        accept: ['the mad titan']
      },
      {
        baseValue: 1000,
        clue: 'What is the name of Thor’s magical enchanted war hammer, which only those who are "worthy" can lift?',
        answer: 'Mjolnir',
        accept: ['mjölnir']
      },
      {
        baseValue: 200,
        clue: 'The Joker, Penguin, Two-Face, and Harley Quinn are archenemies of which caped DC superhero?',
        answer: 'Batman',
        accept: ['bruce wayne', 'the dark knight']
      },
      {
        baseValue: 400,
        clue: 'Diana Prince, an Amazonian warrior princess from the hidden island of Themyscira, is known to the world as who?',
        answer: 'Wonder Woman',
        accept: ['princess diana']
      },
      {
        baseValue: 600,
        clue: 'What green-skinned Marvel superhero gets physically stronger the angrier he becomes, famously shouting "Hulk Smash!"?',
        answer: 'The Hulk',
        accept: ['hulk', 'bruce banner', 'incredible hulk']
      },
      {
        baseValue: 800,
        clue: 'Barry Allen gained super-speed after being struck by lightning in a laboratory filled with chemicals, becoming which DC speedster?',
        answer: 'The Flash',
        accept: ['flash', 'barry allen']
      },
      {
        baseValue: 1000,
        clue: 'What mutant master of magnetism and former friend of Professor Charles Xavier leads the Brotherhood of Mutants?',
        answer: 'Magneto',
        accept: ['erik lehnsherr', 'max eisenhardt']
      }
    ]
  },
  {
    id: 'blockbuster-movies',
    name: 'BLOCKBUSTER MOVIES',
    icon: '🎬',
    group: 'pop',
    blurb: 'Hollywood classics, Oscars, sci-fi epics & box office kings',
    clues: [
      {
        baseValue: 200,
        clue: 'In this 2001 animated hit, an ogre teams up with a talking Donkey to rescue Princess Fiona and reclaim his swamp.',
        answer: 'Shrek',
        accept: ['shrek 1']
      },
      {
        baseValue: 400,
        clue: 'Scientists in Jurassic Park clone dinosaurs using ancient blood extracted from a prehistoric mosquito trapped in this tree resin.',
        answer: 'Amber',
        accept: ['fossilized amber']
      },
      {
        baseValue: 600,
        clue: 'In The Matrix, Morpheus offers Neo a choice: take the blue pill to wake up in bed, or take this color pill to see the truth.',
        answer: 'Red',
        accept: ['red pill', 'the red pill']
      },
      {
        baseValue: 800,
        clue: 'Doc Brown’s DeLorean time machine in Back to the Future must hit this exact speed in miles per hour to travel through time.',
        answer: '88',
        accept: ['88 mph', '88 miles per hour', 'eighty eight']
      },
      {
        baseValue: 1000,
        clue: 'In Citizen Kane — one of cinema’s most famous spoilers — the dying tycoon’s mysterious final word "Rosebud" turns out to be his childhood one of these.',
        answer: 'Sled',
        accept: ['snow sled', 'toboggan', 'sleigh']
      },
      {
        baseValue: 200,
        clue: 'In Star Wars: A New Hope, who is the young moisture farmer from Tatooine who destroys the Death Star?',
        answer: 'Luke Skywalker',
        accept: ['luke', 'skywalker']
      },
      {
        baseValue: 400,
        clue: 'What 1997 James Cameron epic starring Leonardo DiCaprio and Kate Winslet won 11 Oscars and chronicled an ill-fated ocean liner?',
        answer: 'Titanic',
        accept: ['rms titanic']
      },
      {
        baseValue: 600,
        clue: 'In The Lord of the Rings, what hobbit is tasked with carrying the One Ring to Mount Doom to destroy it in the fires?',
        answer: 'Frodo Baggins',
        accept: ['frodo']
      },
      {
        baseValue: 800,
        clue: 'What 1994 prison drama starring Tim Robbins and Morgan Freeman holds the #1 ranking of all time on IMDb\'s Top 250 Movies?',
        answer: 'The Shawshank Redemption',
        accept: ['shawshank redemption', 'shawshank']
      },
      {
        baseValue: 1000,
        clue: 'In Christopher Nolan\'s 2010 film Inception, Dom Cobb uses what spinning tabletop toy as his totem to determine if he is dreaming?',
        answer: 'A top',
        accept: ['spinning top', 'a spinning top', 'top']
      },
      {
        baseValue: 200,
        clue: 'What 1975 Steven Spielberg thriller about a man-eating great white shark terrorizing Amity Island created the summer blockbuster?',
        answer: 'Jaws',
        accept: ['jaws movie']
      },
      {
        baseValue: 400,
        clue: 'In The Lion King, who is Simba’s evil uncle who betrays Mufasa and takes over the Pride Lands with hyenas?',
        answer: 'Scar',
        accept: ['uncle scar']
      },
      {
        baseValue: 600,
        clue: 'What 2023 biographical drama directed by Christopher Nolan swept the Academy Awards telling the story of the father of the atomic bomb?',
        answer: 'Oppenheimer',
        accept: ['j robert oppenheimer']
      },
      {
        baseValue: 800,
        clue: 'In Pulp Fiction, what mysterious item glows inside the briefcase when Vincent Vega opens it, captivating him completely?',
        answer: 'We never see it',
        accept: ['it is never revealed', 'unknown', 'gold light', 'marcellus wallace soul']
      },
      {
        baseValue: 1000,
        clue: 'What 1968 Stanley Kubrick sci-fi masterpiece featured a rogue, sentient supercomputer named HAL 9000?',
        answer: '2001: A Space Odyssey',
        accept: ['2001 a space odyssey', 'a space odyssey', '2001']
      }
    ]
  },
  {
    id: 'cartoons-anime',
    name: 'CARTOONS & ANIME',
    icon: '🍜',
    group: 'pop',
    blurb: 'Studio Ghibli, shonen legends, SpongeBob & Saturday morning hits',
    clues: [
      {
        baseValue: 200,
        clue: 'Entry #025 in the Pokédex, this electric mouse mascot refuses to stay inside Ash Ketchum’s Poké Ball.',
        answer: 'Pikachu',
        accept: []
      },
      {
        baseValue: 400,
        clue: 'In Avatar: The Last Airbender, benders manipulate Water, Earth, Fire, and Air — while an unlucky street vendor constantly loses his cart of these vegetables.',
        answer: 'Cabbages',
        accept: ['cabbage', 'my cabbages']
      },
      {
        baseValue: 600,
        clue: 'Collect all seven mystical orange-starred orbs in Goku’s anime universe to summon the wish-granting dragon named Shenron — or name the orbs!',
        answer: 'Dragon Balls',
        accept: ['dragon ball', 'dragonballs']
      },
      {
        baseValue: 800,
        clue: 'Hayao Miyazaki won an Academy Award for this Studio Ghibli masterpiece where young Chihiro works in a bathhouse for spirits after her parents turn into pigs.',
        answer: 'Spirited Away',
        accept: ['sen to chihiro']
      },
      {
        baseValue: 1000,
        clue: 'Genius scientist Rick Sanchez briefly turns himself into this briny green food item purely to avoid family therapy — \"funniest thing\" fans ever saw.',
        answer: 'A pickle',
        accept: ['pickle', 'pickle rick']
      },
      {
        baseValue: 200,
        clue: 'In SpongeBob SquarePants, what type of ocean home does SpongeBob live in at 124 Conch Street?',
        answer: 'Pineapple',
        accept: ['a pineapple', 'pineapple under the sea']
      },
      {
        baseValue: 400,
        clue: 'Monkey D. Luffy dreams of becoming the King of the Pirates and finding the legendary treasure in which massive anime series?',
        answer: 'One Piece',
        accept: ['onepiece']
      },
      {
        baseValue: 600,
        clue: 'In Naruto, what nine-tailed fox beast was sealed inside Naruto Uzumaki\'s stomach when he was a newborn baby?',
        answer: 'Kurama',
        accept: ['nine tails', 'nine tailed fox', 'kyuubi']
      },
      {
        baseValue: 800,
        clue: 'In Attack on Titan, humanity shelters behind three massive concentric stone walls: Wall Maria, Wall Rose, and Wall who?',
        answer: 'Sina',
        accept: ['sheena', 'sina']
      },
      {
        baseValue: 1000,
        clue: 'What popular 1990s anime follows high schooler Shinji Ikari piloting a biomechanical mecha to defend Tokyo-3 against Angels?',
        answer: 'Neon Genesis Evangelion',
        accept: ['evangelion', 'eva']
      },
      {
        baseValue: 200,
        clue: 'What mystery-solving Great Dane loves eating snack treats with his human best friend Norville "Shaggy" Rogers?',
        answer: 'Scooby-Doo',
        accept: ['scooby doo', 'scooby']
      },
      {
        baseValue: 400,
        clue: 'What classic Hanna-Barbera cartoon duo featured an endlessly chasing house cat and a clever brown mouse?',
        answer: 'Tom and Jerry',
        accept: ['tom & jerry']
      },
      {
        baseValue: 600,
        clue: 'In Phineas and Ferb, what semi-aquatic egg-laying mammal secretly operates as Secret Agent P for the O.W.C.A.?',
        answer: 'Perry the Platypus',
        accept: ['perry', 'agent p', 'platypus']
      },
      {
        baseValue: 800,
        clue: 'In Death Note, what Shinigami death god loves eating juicy red human apples and drops his supernatural notebook to Earth?',
        answer: 'Ryuk',
        accept: ['shinigami ryuk']
      },
      {
        baseValue: 1000,
        clue: 'What 1998 jazz-infused space Western anime directed by Shinichiro Watanabe follows bounty hunter Spike Spiegel aboard the ship Bebop?',
        answer: 'Cowboy Bebop',
        accept: ['cowboy bebop']
      }
    ]
  },
  {
    id: 'binge-tv',
    name: 'BINGE-WORTHY TV',
    icon: '📺',
    group: 'pop',
    blurb: 'Prestige television, sitcom quotes, plot twists & streaming hits',
    clues: [
      {
        baseValue: 200,
        clue: 'Plankton spends every waking moment trying to steal the secret formula for this burger sold at the Krusty Krab.',
        answer: 'Krabby Patty',
        accept: ['krabby patties', 'crabby patty']
      },
      {
        baseValue: 400,
        clue: 'In Stranger Things, Eleven and her friends in Hawkins battle monsters from an eerie parallel dimension given this name.',
        answer: 'The Upside Down',
        accept: ['upside down']
      },
      {
        baseValue: 600,
        clue: 'Chemistry teacher Walter White adopts this physicist-inspired alias when building his empire on Breaking Bad.',
        answer: 'Heisenberg',
        accept: ['werner heisenberg']
      },
      {
        baseValue: 800,
        clue: 'On The Office, regional manager Michael Scott hosts an annual Chili’s trophy ceremony named these awards.',
        answer: 'The Dundies',
        accept: ['dundies', 'dundie', 'dundie awards']
      },
      {
        baseValue: 1000,
        clue: 'In Netflix’s Squid Game, protagonist Seong Gi-hun wears a green tracksuit stamped with this three-digit final player number.',
        answer: '456',
        accept: ['player 456']
      },
      {
        baseValue: 200,
        clue: 'What yellow animated family has lived at 742 Evergreen Terrace in Springfield since 1989?',
        answer: 'The Simpsons',
        accept: ['simpsons']
      },
      {
        baseValue: 400,
        clue: 'In Game of Thrones, what is the motto of House Stark, warning of harsh northern times ahead?',
        answer: 'Winter is Coming',
        accept: ['winter is coming']
      },
      {
        baseValue: 600,
        clue: 'In Friends, what is the name of the Central Perk coffee shop couch-dweller who famously shouts "Pivot!" when moving a sofa?',
        answer: 'Ross Geller',
        accept: ['ross']
      },
      {
        baseValue: 800,
        clue: 'In HBO\'s Succession, what is the name of the ruthless family media conglomerate patriarch played by Brian Cox?',
        answer: 'Logan Roy',
        accept: ['logan']
      },
      {
        baseValue: 1000,
        clue: 'In The Sopranos, New Jersey mob boss Tony Soprano routinely visits which psychiatrist played by Lorraine Bracco?',
        answer: 'Dr. Melfi',
        accept: ['jennifer melfi', 'melfi']
      },
      {
        baseValue: 200,
        clue: 'What animated sitcom created by Seth MacFarlane follows Peter, Lois, Meg, Chris, Stewie, and talking dog Brian in Quahog?',
        answer: 'Family Guy',
        accept: ['family guy']
      },
      {
        baseValue: 400,
        clue: 'In Parks and Recreation, what breakfast food does libertarian parks director Ron Swanson endlessly crave at diners?',
        answer: 'Bacon and eggs',
        accept: ['all the bacon and eggs', 'bacon', 'eggs', 'steak']
      },
      {
        baseValue: 600,
        clue: 'What dystopian anthology series created by Charlie Brooker explores the dark, unexpected consequences of near-future technology?',
        answer: 'Black Mirror',
        accept: ['black mirror']
      },
      {
        baseValue: 800,
        clue: 'In Brooklyn Nine-Nine, detective Jake Peralta is obsessed with which 1988 Bruce Willis action movie set in Nakatomi Plaza?',
        answer: 'Die Hard',
        accept: ['die hard']
      },
      {
        baseValue: 1000,
        clue: 'In Better Call Saul, what is the birth name of the fast-talking lawyer who eventually adopts the moniker Saul Goodman?',
        answer: 'Jimmy McGill',
        accept: ['james mcgill', 'jimmy']
      }
    ]
  },
  {
    id: 'nostalgia-90s-00s',
    name: '90s & 2000s NOSTALGIA',
    icon: '📼',
    group: 'pop',
    blurb: 'Tamagotchis, Blockbuster, dial-up sounds & Y2K cultural relics',
    clues: [
      {
        baseValue: 200,
        clue: 'Forget to feed this keychain egg-shaped Japanese digital pet from 1996 during school and you’d come home to pixel poop — or worse.',
        answer: 'Tamagotchi',
        accept: ['tamagotchis']
      },
      {
        baseValue: 400,
        clue: '\"Be Kind, Rewind\" stickers covered VHS rental cases at this blue-and-yellow video store chain that once had 9,000 locations.',
        answer: 'Blockbuster',
        accept: ['blockbuster video']
      },
      {
        baseValue: 600,
        clue: 'Released in the year 2000, this legendary Finnish cell phone came preloaded with Snake II and became a meme for being physically indestructible.',
        answer: 'Nokia 3310',
        accept: ['nokia', 'nokia brick']
      },
      {
        baseValue: 800,
        clue: 'Titled \"Bliss,\" the rolling green Sonoma hill beneath a blue sky and fluffy clouds was the default desktop wallpaper of this 2001 Microsoft OS.',
        answer: 'Windows XP',
        accept: ['xp']
      },
      {
        baseValue: 1000,
        clue: 'Before Spotify, early-2000s teens risked giving the family PC 47 viruses downloading MP3s on peer-to-peer apps like Napster and this citrus-named program.',
        answer: 'LimeWire',
        accept: ['lime wire']
      },
      {
        baseValue: 200,
        clue: 'What popular stuffed animal line by Ty Inc. featured heart-shaped tags and drove collectors into a 1990s speculative craze?',
        answer: 'Beanie Babies',
        accept: ['beanie baby', 'beanies']
      },
      {
        baseValue: 400,
        clue: 'What classic dial-up internet service provider sent millions of free trial CD-ROMs in the mail greeted by the voice saying "You\'ve Got Mail!"?',
        answer: 'AOL',
        accept: ['america online']
      },
      {
        baseValue: 600,
        clue: 'What electronic robotic owl-like creature with glowing eyes caused holiday shopping panics in 1998 speaking "Furbish"?',
        answer: 'Furby',
        accept: ['furbies']
      },
      {
        baseValue: 800,
        clue: 'What circular cardboard bottle cap game was a massive 1990s schoolyard craze involving a heavy plastic or metal "slammer"?',
        answer: 'Pogs',
        accept: ['pog', 'milk caps']
      },
      {
        baseValue: 1000,
        clue: 'What social networking website launched in 2003 by Tom Anderson allowed users to customize HTML profiles and choose their "Top 8" friends?',
        answer: 'MySpace',
        accept: ['myspace.com']
      },
      {
        baseValue: 200,
        clue: 'What portable handheld gaming device released by Nintendo in 1989 came bundled with Tetris and ran on 4 AA batteries?',
        answer: 'Game Boy',
        accept: ['gameboy', 'the game boy']
      },
      {
        baseValue: 400,
        clue: 'What springy coiled toy could "walk" down stairs by itself when nudged off the top step?',
        answer: 'Slinky',
        accept: ['a slinky']
      },
      {
        baseValue: 600,
        clue: 'What 1999 computer glitch hysteria predicted global infrastructure collapses when clocks rolled over from 1999 to 2000?',
        answer: 'Y2K bug',
        accept: ['y2k', 'year 2000 problem']
      },
      {
        baseValue: 800,
        clue: 'What popular portable MP3 music player introduced by Apple in 2001 promised "1,000 songs in your pocket" with a mechanical scroll wheel?',
        answer: 'iPod',
        accept: ['apple ipod', 'the ipod']
      },
      {
        baseValue: 1000,
        clue: 'What French electronic music duo consisting of Guy-Manuel and Thomas Bangalter wore iconic gold and silver robot helmets starting in 2001?',
        answer: 'Daft Punk',
        accept: ['daft punk duo']
      }
    ]
  }
];

module.exports = { POP_CATEGORIES };

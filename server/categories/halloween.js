'use strict';

/**
 * Jeoparty 🎃 Halloween Mayhem Dedicated Database
 * 20 Handcrafted Halloween Categories with over 200+ unique, rich trivia clues
 * plus 16 Grand Halloween Final Jeoparty Clues.
 */

const HALLOWEEN_CATEGORIES = [
  {
    "id": "halloween-history",
    "name": "HALLOWEEN HISTORY",
    "icon": "halloween-history",
    "group": "halloween",
    "blurb": "Ancient Celtic roots, Samhain traditions & how Oct 31 evolved",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Halloween traces its earliest roots back to this ancient Celtic festival celebrating the end of harvest and onset of winter.",
        "answer": "Samhain",
        "accept": [
          "samhain",
          "sam hain",
          "samhuin"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Before pumpkins became popular in North America, people in Ireland and Scotland carved scary faces into these root vegetables.",
        "answer": "Turnips",
        "accept": [
          "turnip",
          "turnips",
          "large turnip",
          "rutabaga",
          "rutabagas",
          "mangolds"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The word Halloween is a contraction of All Hallows' Evening, the night before this Christian holy day on November 1st.",
        "answer": "All Saints' Day",
        "accept": [
          "all saints day",
          "all saints",
          "all hallows day",
          "all hallows",
          "feast of all saints"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Roman times, the festival of Feralia merged with Samhain to honor this goddess of fruit trees, leading to the tradition of bobbing for apples.",
        "answer": "Pomona",
        "accept": [
          "pomona"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "The Irish folk legend of Jack-o'-the-Lantern tells of a miserly blacksmith named Stingy Jack who repeatedly tricked this entity.",
        "answer": "The Devil",
        "accept": [
          "the devil",
          "devil",
          "satan",
          "lucifer"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In medieval Europe, poor citizens and children went door-to-door on All Souls' Day offering prayers for the dead in exchange for these sweet baked treats.",
        "answer": "Soul cakes",
        "accept": [
          "soul cakes",
          "soul cake",
          "soulcake",
          "soulcakes"
        ]
      },
      {
        "baseValue": 200,
        "clue": "The custom of wearing costumes on Halloween originated from ancient Celts disguising themselves so these otherworldly beings would mistake them for one of their own.",
        "answer": "Ghosts",
        "accept": [
          "ghosts",
          "spirits",
          "evil spirits",
          "demons",
          "dead souls",
          "wandering souls"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Large communal ones of these fires were lit by Druids on hilltops during Samhain to ward off dark spirits and provide protection for winter.",
        "answer": "Bonfires",
        "accept": [
          "bonfire",
          "bonfires",
          "sacred bonfires",
          "fire",
          "fires"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Halloween was largely brought to mainstream North America in the 1840s due to mass immigration from this European nation fleeing potato famine.",
        "answer": "Ireland",
        "accept": [
          "ireland",
          "the irish",
          "irish immigrants"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In early 20th-century America, communities organized parades and parties on October 31 specifically to curb this destructive teenager activity.",
        "answer": "Vandalism",
        "accept": [
          "vandalism",
          "pranks",
          "mischief",
          "destructive pranks",
          "rioting",
          "rowdiness"
        ]
      }
    ]
  },
  {
    "id": "horror-movies",
    "name": "HORROR MOVIES",
    "icon": "horror-movies",
    "group": "halloween",
    "blurb": "Iconic screamers, classic slashers & legendary cinematic frights",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Directed by John Carpenter in 1978, this quintessential slasher introduced silent masked killer Michael Myers stalking Laurie Strode.",
        "answer": "Halloween",
        "accept": [
          "halloween",
          "halloween 1978"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Stanley Kubrick's 1980 classic \"The Shining\", Jack Torrance hacks through a bathroom door and famously shouts this talk show intro.",
        "answer": "Here's Johnny!",
        "accept": [
          "heres johnny",
          "here is johnny",
          "heres johnny!"
        ]
      },
      {
        "baseValue": 600,
        "clue": "This 1996 Wes Craven meta-horror film opened with Drew Barrymore answering a terrifying phone call asking \"What's your favorite scary movie?\".",
        "answer": "Scream",
        "accept": [
          "scream",
          "scream 1996"
        ]
      },
      {
        "baseValue": 800,
        "clue": "The iconic tagline \"In space, no one can hear you scream\" introduced Ridley Scott's sci-fi horror masterpiece featuring the Xenomorph.",
        "answer": "Alien",
        "accept": [
          "alien",
          "alien 1979"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Jordan Peele made his acclaimed directorial debut with this 2017 psychological horror film about a young Black photographer visiting his girlfriend's family.",
        "answer": "Get Out",
        "accept": [
          "get out"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "The terrifying demon that possesses Regan MacNeil in the 1973 film \"The Exorcist\" is named after this Mesopotamian mythological wind spirit.",
        "answer": "Pazuzu",
        "accept": [
          "pazuzu"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Jason Voorhees terrorizes unlucky camp counselors at this fictional summer camp across the \"Friday the 13th\" franchise.",
        "answer": "Camp Crystal Lake",
        "accept": [
          "camp crystal lake",
          "crystal lake"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In \"A Nightmare on Elm Street\", Freddy Krueger targets high school teenagers within this vulnerable psychological state.",
        "answer": "Their dreams",
        "accept": [
          "dreams",
          "sleep",
          "their dreams",
          "in their sleep",
          "dream state"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Alfred Hitchcock famously broke cinema taboos by killing off his leading star Marion Crane in this shower-scene 1960 thriller.",
        "answer": "Psycho",
        "accept": [
          "psycho"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In \"The Silence of the Lambs\", Anthony Hopkins plays this brilliant psychiatrist and incarcerated cannibal.",
        "answer": "Dr. Hannibal Lecter",
        "accept": [
          "hannibal lecter",
          "dr hannibal lecter",
          "lecter",
          "hannibal"
        ]
      }
    ]
  },
  {
    "id": "halloween-traditions",
    "name": "HALLOWEEN TRADITIONS",
    "icon": "halloween-traditions",
    "group": "halloween",
    "blurb": "Trick-or-treating, jack-o'-lanterns, haunted hayrides & party games",
    "clues": [
      {
        "baseValue": 200,
        "clue": "The classic phrase shouted by costumed children when knocking on neighborhood doors on Halloween night.",
        "answer": "Trick or treat!",
        "accept": [
          "trick or treat",
          "trick or treat!",
          "trick-or-treat"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In this traditional party game, contestants plunge their faces into a tub of water to grab floating fruit without using hands.",
        "answer": "Bobbing for apples",
        "accept": [
          "bobbing for apples",
          "apple bobbing",
          "dunking for apples",
          "snap apple"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Halloween lore, seeing this common domestic creature cross your path on October 31st is widely believed to bring bad luck.",
        "answer": "A black cat",
        "accept": [
          "black cat",
          "black cats",
          "a black cat"
        ]
      },
      {
        "baseValue": 800,
        "clue": "A staple autumn attraction where visitors sit on straw bales pulled by a tractor through eerie fields or woods after dark.",
        "answer": "Haunted hayride",
        "accept": [
          "haunted hayride",
          "hayride",
          "haunted hay ride"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "The term \"guising\", an ancestor of trick-or-treating popular in Scotland and Ireland, required children to perform one of these before getting food.",
        "answer": "A trick or song",
        "accept": [
          "a song",
          "a trick",
          "song",
          "joke",
          "rhyme",
          "poem",
          "performance",
          "singing"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In parts of the United Kingdom and North America, the night of October 30th right before Halloween is often known by this chaotic moniker.",
        "answer": "Mischief Night",
        "accept": [
          "mischief night",
          "devil's night",
          "devils night",
          "goosey night",
          "cabbage night"
        ]
      },
      {
        "baseValue": 200,
        "clue": "The hollowed-out pumpkin with a carved face illuminated by an internal candle or LED light.",
        "answer": "Jack-o'-lantern",
        "accept": [
          "jack o lantern",
          "jack-o-lantern",
          "jackolantern",
          "carved pumpkin"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Many communities convert abandoned warehouses or outdoor farms into these scary walkthrough entertainment venues during October.",
        "answer": "Haunted houses",
        "accept": [
          "haunted house",
          "haunted houses",
          "haunted maze",
          "spookhouse"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Pranksters historically celebrated Halloween eve by throwing rolls of this bathroom hygiene product over trees and houses.",
        "answer": "Toilet paper",
        "accept": [
          "toilet paper",
          "tp",
          "tp'ing"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Dating back to Celtic times, unmarried people looked into these reflective glass objects at midnight on Halloween hoping to see their future spouse.",
        "answer": "Mirrors",
        "accept": [
          "mirror",
          "mirrors",
          "looking glass"
        ]
      }
    ]
  },
  {
    "id": "ghosts-spirits",
    "name": "GHOSTS & SPIRITS",
    "icon": "ghosts-spirits",
    "group": "halloween",
    "blurb": "Apparitions, poltergeists, banshees & paranormal phenomena",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Derived from German for \"rumbling or noisy ghost\", this type of spirit is notorious for throwing objects and making loud raps.",
        "answer": "Poltergeist",
        "accept": [
          "poltergeist",
          "poltergeists"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Irish folklore, this female wailing fairy spirit shrieks mournfully to herald an impending death in an ancient family.",
        "answer": "Banshee",
        "accept": [
          "banshee",
          "a banshee",
          "bean sidhe"
        ]
      },
      {
        "baseValue": 600,
        "clue": "This parlor board game trademarked in 1890 features alphabet letters, numbers, \"Yes\", \"No\", and a sliding teardrop planchette.",
        "answer": "Ouija board",
        "accept": [
          "ouija",
          "ouija board",
          "talking board",
          "spirit board"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Spiritualists coined this term for the translucent, viscous physical substance supposedly exuded from a medium's body during a trance.",
        "answer": "Ectoplasm",
        "accept": [
          "ectoplasm"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "In Mexican and Latin American folklore, \"The Weeping Woman\" who grieves eternally for her drowned children along riverbanks is known as this.",
        "answer": "La Llorona",
        "accept": [
          "la llorona",
          "llorona",
          "the weeping woman"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "This famous phantom ghost ship, doomed by captain Hendrik van der Decken to sail around the Cape of Good Hope forever, never makes port.",
        "answer": "The Flying Dutchman",
        "accept": [
          "flying dutchman",
          "the flying dutchman"
        ]
      },
      {
        "baseValue": 200,
        "clue": "A gathering of people led by a psychic medium attempting to communicate with deceased spirits is called this French-derived word.",
        "answer": "Seance",
        "accept": [
          "seance",
          "séance",
          "a seance"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In paranormal research, EVP stands for this audio phenomenon where unexplainable voices appear on recorded playback.",
        "answer": "Electronic Voice Phenomenon",
        "accept": [
          "electronic voice phenomenon",
          "electronic voice phenomena",
          "evp"
        ]
      },
      {
        "baseValue": 600,
        "clue": "A sudden, localized drop in ambient temperature often reported by ghost hunters when entering an alleged haunted area is called this.",
        "answer": "A cold spot",
        "accept": [
          "cold spot",
          "cold spots",
          "a cold spot"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In English folklore, the ghost of this second wife of King Henry VIII is said to wander the Tower of London carrying her severed head.",
        "answer": "Anne Boleyn",
        "accept": [
          "anne boleyn",
          "queen anne boleyn"
        ]
      }
    ]
  },
  {
    "id": "monsters-creatures",
    "name": "MONSTERS & CREATURES",
    "icon": "monsters-creatures",
    "group": "halloween",
    "blurb": "Frankenstein, mummies, gargoyles & mythological horrors",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Mary Shelley wrote about this obsessed scientist whose unnamed artificial creation was assembled from reanimated human corpses.",
        "answer": "Victor Frankenstein",
        "accept": [
          "frankenstein",
          "victor frankenstein",
          "dr frankenstein",
          "dr. frankenstein"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Preserved ancient Egyptian dead wrapped in linen bandages and awakened by ancient curses to terrorize archaeologists.",
        "answer": "Mummy",
        "accept": [
          "mummy",
          "mummies",
          "the mummy"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Jewish folklore, this animated anthropomorphic creature created entirely from clay or mud is brought to life by sacred Hebrew lettering.",
        "answer": "Golem",
        "accept": [
          "golem",
          "the golem",
          "golem of prague"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Greek mythology, anyone who makes direct eye contact with this snake-haired Gorgon monster turns instantly to solid stone.",
        "answer": "Medusa",
        "accept": [
          "medusa",
          "gorgon medusa"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "This amphibious gill-man starred in Universal's classic 1954 3D film lurking in the depths of the Amazon River.",
        "answer": "Creature from the Black Lagoon",
        "accept": [
          "creature from the black lagoon",
          "the creature from the black lagoon",
          "gill-man",
          "gillman"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "H.P. Lovecraft created this gargantuan cosmic entity with an octopus-like head, bat wings, and rubbery body slumbering in the sunken city of R'lyeh.",
        "answer": "Cthulhu",
        "accept": [
          "cthulhu",
          "great cthulhu"
        ]
      },
      {
        "baseValue": 200,
        "clue": "These stone carving water-spouts shaped like menacing beasts perch on gothic cathedrals to protect against evil spirits.",
        "answer": "Gargoyles",
        "accept": [
          "gargoyle",
          "gargoyles",
          "grotesques"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Greek legend, this half-man, half-bull monster dwelt at the center of the labyrinth on the island of Crete.",
        "answer": "Minotaur",
        "accept": [
          "the minotaur",
          "minotaur"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Sailors across Scandinavian lore dreaded this colossal multi-tentacled sea monster capable of pulling entire sailing ships beneath the waves.",
        "answer": "Kraken",
        "accept": [
          "the kraken",
          "kraken"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In European mythology, this legendary two-legged dragon possesses a rooster's head and can kill with a single glance or venomous breath.",
        "answer": "Basilisk / Cockatrice",
        "accept": [
          "basilisk",
          "cockatrice",
          "the basilisk"
        ]
      }
    ]
  },
  {
    "id": "vampires",
    "name": "VAMPIRES & BLOODSUCKERS",
    "icon": "vampires",
    "group": "halloween",
    "blurb": "Count Dracula, Nosferatu, garlic wards & nocturnal lore",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Bram Stoker's 1897 gothic horror novel cemented this fictional Transylvanian Count as history's most famous vampire.",
        "answer": "Count Dracula",
        "accept": [
          "dracula",
          "count dracula"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Vampire mythology frequently dictates that driving a stake made of this material directly through their heart will destroy them.",
        "answer": "Wood",
        "accept": [
          "wood",
          "wooden stake",
          "ash wood",
          "oak",
          "hawthorn"
        ]
      },
      {
        "baseValue": 600,
        "clue": "According to classic vampire lore, looking into one of these silvered glass surfaces will show no vampire reflection at all.",
        "answer": "A mirror",
        "accept": [
          "mirror",
          "mirrors",
          "a mirror"
        ]
      },
      {
        "baseValue": 800,
        "clue": "The historical 15th-century Prince of Wallachia known for his brutal impaling tactics who inspired elements of Dracula.",
        "answer": "Vlad the Impaler",
        "accept": [
          "vlad the impaler",
          "vlad tepes",
          "vlad iii",
          "vlad iii dracula"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "F.W. Murnau's 1922 unauthorized German silent adaptation of Dracula renamed the creepy rat-faced vampire Count Orlok in this movie.",
        "answer": "Nosferatu",
        "accept": [
          "nosferatu",
          "nosferatu a symphony of horror"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "Written by Sheridan Le Fanu in 1872 — 25 years before Dracula — this novella popularized the female vampire stalking Styria.",
        "answer": "Carmilla",
        "accept": [
          "carmilla"
        ]
      },
      {
        "baseValue": 200,
        "clue": "This pungent allium bulb is traditionally hung in doorways or worn around necks to repel vampires.",
        "answer": "Garlic",
        "accept": [
          "garlic",
          "clove of garlic"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Vampires cannot cross threshold boundaries into a mortal residence unless granted this courtesy first.",
        "answer": "An invitation",
        "accept": [
          "invitation",
          "an invitation",
          "invited in",
          "being invited",
          "permission"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Vampires frequently shapeshift into this nocturnal flying mammal when stalking nighttime prey.",
        "answer": "A bat",
        "accept": [
          "bat",
          "bats",
          "a bat",
          "vampire bat"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Bram Stoker's novel, this Dutch polymath and vampire hunter travels to England to defeat Dracula.",
        "answer": "Professor Abraham Van Helsing",
        "accept": [
          "van helsing",
          "abraham van helsing",
          "professor van helsing"
        ]
      }
    ]
  },
  {
    "id": "werewolves",
    "name": "WEREWOLVES & LYCANTHROPY",
    "icon": "werewolves",
    "group": "halloween",
    "blurb": "Moonlit transformations, silver ammo & wolfsbane myths",
    "clues": [
      {
        "baseValue": 200,
        "clue": "In classic horror fiction, a werewolf's violent involuntary transformation is triggered by this celestial lunar phase.",
        "answer": "A full moon",
        "accept": [
          "full moon",
          "a full moon",
          "the full moon"
        ]
      },
      {
        "baseValue": 400,
        "clue": "According to 20th-century Hollywood lore, a werewolf can be permanently killed only by a projectile made of this precious metal.",
        "answer": "Silver",
        "accept": [
          "silver",
          "silver bullet",
          "silver bullets"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The medical and psychological term for the rare psychiatric condition where a patient believes they can turn into a wolf.",
        "answer": "Lycanthropy",
        "accept": [
          "lycanthropy",
          "clinical lycanthropy"
        ]
      },
      {
        "baseValue": 800,
        "clue": "This toxic purple-flowered herbaceous plant in the genus Aconitum is famous in folklore for protecting against werewolves.",
        "answer": "Wolfsbane",
        "accept": [
          "wolfsbane",
          "wolf's bane",
          "aconite",
          "monkshood"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Lon Chaney Jr. portrayed Larry Talbot, doomed by a gypsy bite, in this landmark 1941 Universal horror movie.",
        "answer": "The Wolf Man",
        "accept": [
          "the wolf man",
          "the wolfman",
          "wolf man"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In French folklore from 1764 to 1767, this terrifying man-eating wolf creature terrorized the former province of Gévaudan.",
        "answer": "The Beast of Gévaudan",
        "accept": [
          "beast of gevaudan",
          "the beast of gevaudan",
          "la bête du gévaudan",
          "gevaudan"
        ]
      },
      {
        "baseValue": 200,
        "clue": "The most common way a mortal human contracts the curse of the werewolf in modern horror mythology.",
        "answer": "A werewolf bite",
        "accept": [
          "bite",
          "a bite",
          "being bitten",
          "scratched",
          "werewolf bite"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Rick Baker's Oscar-winning 1981 horror-comedy directed by John Landis, an American tourist transforms to wolves in this UK capital city.",
        "answer": "London",
        "accept": [
          "london",
          "an american werewolf in london"
        ]
      },
      {
        "baseValue": 600,
        "clue": "A pack of wolves or werewolves is traditionally led by this highest-ranking breeding male or female designated by the first Greek letter.",
        "answer": "Alpha",
        "accept": [
          "alpha",
          "the alpha",
          "alpha wolf"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In medieval European superstition, a human could turn into a werewolf by wrapping themselves in a belt made from this animal's hide.",
        "answer": "Wolf",
        "accept": [
          "wolf",
          "wolf skin",
          "wolf pelt",
          "wolf hide"
        ]
      }
    ]
  },
  {
    "id": "witches-magic",
    "name": "WITCHES & DARK MAGIC",
    "icon": "witches-magic",
    "group": "halloween",
    "blurb": "Salem trials, cauldrons, spellbooks & black cats",
    "clues": [
      {
        "baseValue": 200,
        "clue": "In 1692, this Massachusetts colonial town was gripped by mass hysteria leading to the execution of nineteen accused witches.",
        "answer": "Salem",
        "accept": [
          "salem",
          "salem massachusetts"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In the 1993 Disney film \"Hocus Pocus\", Bette Midler, Sarah Jessica Parker, and Kathy Najimy play this trio of resurrected witch sisters.",
        "answer": "The Sanderson Sisters",
        "accept": [
          "sanderson sisters",
          "the sanderson sisters",
          "sandersons"
        ]
      },
      {
        "baseValue": 600,
        "clue": "A large, deep cast-iron pot traditionally used by witches for brewing potions and enchanting elixirs over an open fire.",
        "answer": "A cauldron",
        "accept": [
          "cauldron",
          "a cauldron",
          "iron cauldron"
        ]
      },
      {
        "baseValue": 800,
        "clue": "A supernatural animal companion believed in folklore to assist a witch in performing magic is known as this.",
        "answer": "A familiar",
        "accept": [
          "familiar",
          "a familiar",
          "familiars",
          "familiar spirit"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "In Slavic folklore, this enigmatic witch lives in a strange woodland hut that stands and moves on giant chicken legs.",
        "answer": "Baba Yaga",
        "accept": [
          "baba yaga"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "Derived from Old French for grammar, this term refers specifically to a textbook of sorcery, curses, and magical incantations.",
        "answer": "Grimoire",
        "accept": [
          "grimoire",
          "a grimoire",
          "grimoires"
        ]
      },
      {
        "baseValue": 200,
        "clue": "The classic aerodynamic household cleaning tool that witches are stereotypically shown riding across the night sky.",
        "answer": "A broomstick",
        "accept": [
          "broom",
          "broomstick",
          "a broom",
          "besom"
        ]
      },
      {
        "baseValue": 400,
        "clue": "A gathered gathering or assembly of witches meeting for spellcraft and ritual is commonly referred to as this.",
        "answer": "A coven",
        "accept": [
          "coven",
          "a coven"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Shakespeare's \"Macbeth\", the three Weird Sisters chant \"Double, double toil and trouble\" over this boiling container.",
        "answer": "A cauldron / Fire",
        "accept": [
          "fire burn and cauldron bubble",
          "cauldron",
          "fire"
        ]
      },
      {
        "baseValue": 800,
        "clue": "This modern pagan religious movement founded in early 20th-century England celebrates witchcraft, nature, and the Horned God.",
        "answer": "Wicca",
        "accept": [
          "wicca",
          "wiccan",
          "neopaganism"
        ]
      }
    ]
  },
  {
    "id": "zombies",
    "name": "ZOMBIES & THE UNDEAD",
    "icon": "zombies",
    "group": "halloween",
    "blurb": "George Romero classics, viral outbreaks & reanimated hordes",
    "clues": [
      {
        "baseValue": 200,
        "clue": "George A. Romero launched the modern zombie apocalypse genre with this landmark 1968 black-and-white independent film.",
        "answer": "Night of the Living Dead",
        "accept": [
          "night of the living dead"
        ]
      },
      {
        "baseValue": 400,
        "clue": "According to pop culture lore established in 1985's \"Return of the Living Dead\", zombies groan incessantly for this specific human organ.",
        "answer": "Brains!",
        "accept": [
          "brains",
          "brain",
          "brains!"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The word \"zombie\" entered English folklore through spiritual traditions in this Caribbean island nation practiced in Vodou.",
        "answer": "Haiti",
        "accept": [
          "haiti",
          "haitian vodou",
          "haitian voodoo"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In AMC's \"The Walking Dead\", Sheriff Rick Grimes and fellow survivors commonly refer to the undead by this shuffling moniker.",
        "answer": "Walkers",
        "accept": [
          "walkers",
          "walker",
          "the walkers",
          "roamers",
          "biters"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Danny Boyle revolutionized the genre in 2002's \"28 Days Later\" by depicting terrifying fast-running victims infected by this virus.",
        "answer": "Rage Virus",
        "accept": [
          "rage",
          "rage virus",
          "the rage virus"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In Capcom's famous \"Resident Evil\" survival horror gaming franchise, this fictional pharmaceutical corporation created the T-Virus.",
        "answer": "Umbrella Corporation",
        "accept": [
          "umbrella",
          "umbrella corporation",
          "umbrella corp"
        ]
      },
      {
        "baseValue": 200,
        "clue": "The universal survival rule for putting down a zombie once and for all: destroy this anatomical command center.",
        "answer": "The head / brain",
        "accept": [
          "head",
          "the head",
          "brain",
          "the brain",
          "headshot",
          "destroy the brain"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Max Brooks wrote this 2006 bestselling oral history novel documenting a global geopolitical outbreak of the undead.",
        "answer": "World War Z",
        "accept": [
          "world war z",
          "wwz"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In the 2004 British parody \"Shaun of the Dead\", Shaun and Ed attempt to blend into a zombie horde by doing this physical action.",
        "answer": "Groaning and shuffling",
        "accept": [
          "acting like zombies",
          "groaning",
          "shuffling",
          "pretending to be zombies",
          "imitating zombies"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Minecraft, undead zombies burn and perish if exposed directly to this natural weather condition.",
        "answer": "Daylight / Sunlight",
        "accept": [
          "sunlight",
          "daylight",
          "the sun",
          "sun"
        ]
      }
    ]
  },
  {
    "id": "haunted-places",
    "name": "HAUNTED PLACES",
    "icon": "haunted-places",
    "group": "halloween",
    "blurb": "Winchester Mystery House, Paris Catacombs & eerie landmarks",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Sarah Winchester continuously built stairs to nowhere and doors into walls in this sprawling San Jose, California mansion.",
        "answer": "Winchester Mystery House",
        "accept": [
          "winchester mystery house",
          "the winchester house",
          "winchester mansion"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Miles of subterranean limestone tunnels beneath this French capital city hold the organized skeletal remains of over 6 million people.",
        "answer": "Paris",
        "accept": [
          "paris",
          "catacombs of paris",
          "paris catacombs"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Stephen King was inspired to write \"The Shining\" after spending a night in Room 217 of this historic hotel in Estes Park, Colorado.",
        "answer": "The Stanley Hotel",
        "accept": [
          "stanley hotel",
          "the stanley hotel",
          "stanley"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Located in the canals south of Mexico City, \"Isla de las Munecas\" is famous for hundreds of decaying toys of this kind hanging from trees.",
        "answer": "Dolls",
        "accept": [
          "dolls",
          "doll",
          "creepy dolls",
          "baby dolls"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "This former maximum security prison in Philadelphia, Pennsylvania pioneered total solitary confinement and housed Al Capone.",
        "answer": "Eastern State Penitentiary",
        "accept": [
          "eastern state penitentiary",
          "eastern state"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "Perched on the Thames, this historic London castle has served as a royal palace, prison, and execution site of three English queens.",
        "answer": "The Tower of London",
        "accept": [
          "tower of london",
          "the tower of london"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Long Island, New York home at 112 Ocean Avenue where Ronald DeFeo Jr. committed murders, inspiring books and horror movies.",
        "answer": "Amityville",
        "accept": [
          "amityville",
          "amityville horror",
          "the amityville house"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Aokigahara, a dense woodland forest located at the northwest base of Mount Fuji in Japan, is commonly known by this somber nickname.",
        "answer": "The Sea of Trees / Suicide Forest",
        "accept": [
          "sea of trees",
          "suicide forest",
          "aokigahara forest"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The RMS Queen Mary, a retired 1930s British ocean liner famous for ghost encounters and room B340, is permanently docked in this California port.",
        "answer": "Long Beach",
        "accept": [
          "long beach",
          "long beach california"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Edinburgh Castle in Scotland, visitors frequently report hearing ghostly notes played on this traditional Celtic wind instrument.",
        "answer": "Bagpipes",
        "accept": [
          "bagpipes",
          "bagpipe",
          "pipes"
        ]
      }
    ]
  },
  {
    "id": "urban-legends",
    "name": "URBAN LEGENDS",
    "icon": "urban-legends",
    "group": "halloween",
    "blurb": "Bloody Mary, phantom hitchhikers, calls from upstairs & eerie myths",
    "clues": [
      {
        "baseValue": 200,
        "clue": "According to schoolyard folklore, chanting this spooky name three or more times in front of a bathroom mirror summons a vengeful spirit.",
        "answer": "Bloody Mary",
        "accept": [
          "bloody mary",
          "bloodymary"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In this classic campfire tale, a teenage babysitter receives harassing phone calls only for police to trace them to this terrifying location.",
        "answer": "Inside the house / Upstairs",
        "accept": [
          "inside the house",
          "upstairs",
          "from inside the house",
          "from upstairs",
          "in the house"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In the legend of \"The Hook\", young lovers parked in a secluded lover's lane hear news of an escaped mental patient with this weapon for a hand.",
        "answer": "A hook",
        "accept": [
          "a hook",
          "hook",
          "prosthetic hook",
          "iron hook"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In the 1970s, widespread panic spread among parents that malicious strangers were concealing these sharp metal objects inside Halloween apples.",
        "answer": "Razor blades",
        "accept": [
          "razor blades",
          "razor blade",
          "needles",
          "pins"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "This modern internet cryptid created on Something Awful in 2009 is described as a tall, faceless man in a black suit with extending tentacles.",
        "answer": "Slender Man",
        "accept": [
          "slender man",
          "slenderman"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "According to this classic urban legend, a traveler accepts a drink from an attractive stranger and wakes up in an ice-filled bathtub missing this organ.",
        "answer": "A kidney",
        "accept": [
          "kidney",
          "a kidney",
          "kidneys"
        ]
      },
      {
        "baseValue": 200,
        "clue": "In the Vanishing Hitchhiker legend, drivers pick up a quiet young woman at night who disappears leaving behind only this garment in the back seat.",
        "answer": "A sweater or coat",
        "accept": [
          "jacket",
          "coat",
          "sweater",
          "cardigan"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Urban legend falsely claims that flushed pet reptiles in New York City grew into gigantic blind beasts living in these underground sewers.",
        "answer": "Alligators / Crocodiles",
        "accept": [
          "alligators",
          "crocodiles",
          "alligator",
          "sewer alligators"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The urban myth that mixing Pop Rocks candy with this fizzy carbonated beverage could cause a child's stomach to violently rupture.",
        "answer": "Coca-Cola / Soda",
        "accept": [
          "coca cola",
          "coke",
          "soda",
          "pop",
          "carbonated soda"
        ]
      },
      {
        "baseValue": 800,
        "clue": "The legend of Resurrection Mary claims the ghost of a young ballroom dancer hit by a car frequents Archer Avenue outside this Chicago suburb.",
        "answer": "Justice, Illinois",
        "accept": [
          "chicago",
          "justice",
          "justice illinois"
        ]
      }
    ]
  },
  {
    "id": "cryptids",
    "name": "MYSTERIOUS CRYPTIDS",
    "icon": "cryptids",
    "group": "halloween",
    "blurb": "Bigfoot, Mothman, Chupacabra, Jersey Devil & elusive beasts",
    "clues": [
      {
        "baseValue": 200,
        "clue": "The famous 1967 Patterson-Gimlin film clip purportedly shows this large bipedal ape-like creature walking through Bluff Creek, California.",
        "answer": "Bigfoot / Sasquatch",
        "accept": [
          "bigfoot",
          "sasquatch"
        ]
      },
      {
        "baseValue": 400,
        "clue": "This legendary Scottish freshwater lake monster, affectionately nicknamed \"Nessie\", is said to resemble a prehistoric plesiosaur.",
        "answer": "Loch Ness Monster",
        "accept": [
          "loch ness monster",
          "nessie",
          "loch ness"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In 1966 and 1967, residents of Point Pleasant, West Virginia reported sightings of this winged humanoid creature with glowing red eyes.",
        "answer": "Mothman",
        "accept": [
          "mothman",
          "the mothman"
        ]
      },
      {
        "baseValue": 800,
        "clue": "First reported in Puerto Rico in 1995, this creature's name translates from Spanish as \"goat-sucker\" for draining livestock blood.",
        "answer": "Chupacabra",
        "accept": [
          "chupacabra",
          "el chupacabra",
          "chupacabras"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "According to New Jersey folklore, Mother Leeds birthed this cursed 13th child in 1735, who grew wings and hooves to haunt the Pine Barrens.",
        "answer": "The Jersey Devil",
        "accept": [
          "jersey devil",
          "the jersey devil",
          "leeds devil"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In Algonquin folklore, this terrifying malevolent cannibal spirit possesses humans who consume human flesh during harsh frozen winters.",
        "answer": "Wendigo",
        "accept": [
          "wendigo",
          "windigo"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Also called the \"Abominable Snowman\", this ape-like entity is said to inhabit the Himalayan mountain range.",
        "answer": "The Yeti",
        "accept": [
          "yeti",
          "the yeti",
          "abominable snowman"
        ]
      },
      {
        "baseValue": 400,
        "clue": "The state animal of Scotland is this mythical horned creature, often celebrated alongside Scottish lore and coat of arms.",
        "answer": "The Unicorn",
        "accept": [
          "unicorn",
          "the unicorn"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Australian Aboriginal mythology, this large amphibious creature lurks in billabongs, swamps, and riverbeds to devour unwary travelers.",
        "answer": "Bunyip",
        "accept": [
          "bunyip",
          "the bunyip"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Cryptozoologists and locals in Texas report sightings of this jackrabbit variant endowed with antelope horns.",
        "answer": "Jackalope",
        "accept": [
          "jackalope",
          "the jackalope"
        ]
      }
    ]
  },
  {
    "id": "halloween-candy",
    "name": "HALLOWEEN CANDY",
    "icon": "halloween-candy",
    "group": "halloween",
    "blurb": "Candy corn, peanut butter cups, chocolate bars & sweet treats",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Invented in the 1880s by George Renninger, this three-colored striped treat of yellow, orange, and white remains a Halloween staple.",
        "answer": "Candy corn",
        "accept": [
          "candy corn",
          "candycorn"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Consistently ranked America's #1 favorite Halloween candy, this Hershey product combines milk chocolate with creamy peanut butter.",
        "answer": "Reese's Peanut Butter Cups",
        "accept": [
          "reeses",
          "reese's",
          "reeses peanut butter cups",
          "reese's peanut butter cups",
          "reese peanut butter cup"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Mars Inc. named this bestselling nougat, caramel, and peanut candy bar after the beloved favorite racehorse of Frank Mars.",
        "answer": "Snickers",
        "accept": [
          "snickers",
          "snickers bar"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In 1968, Mars introduced this smaller, bite-sized candy packaging terminology specifically tailored for Halloween trick-or-treating.",
        "answer": "Fun Size",
        "accept": [
          "fun size",
          "fun-size",
          "funsize"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Before it was rebranded as \"Candy Corn\", the Goelitz Confectionery Company sold the tri-color kernels under this agricultural name.",
        "answer": "Chicken Feed",
        "accept": [
          "chicken feed"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "Created in 1896 by Leo Hirschfield and named after his five-year-old daughter Clara, this was America's first wrapped penny candy.",
        "answer": "Tootsie Roll",
        "accept": [
          "tootsie roll",
          "tootsie rolls"
        ]
      },
      {
        "baseValue": 200,
        "clue": "This colorful button-shaped chocolate candy famously carries the slogan \"Melts in your mouth, not in your hand\".",
        "answer": "M&Ms",
        "accept": [
          "m&ms",
          "m&m",
          "m and ms",
          "mnms"
        ]
      },
      {
        "baseValue": 400,
        "clue": "The classic hard candy on a stick filled with chocolate chewy Tootsie Roll at its center asks \"How many licks does it take?\".",
        "answer": "Tootsie Pop",
        "accept": [
          "tootsie pop",
          "tootsie pops"
        ]
      },
      {
        "baseValue": 600,
        "clue": "This tangy, powdered sugar candy manufactured inside a straw-like paper tube is torn open and poured directly on the tongue.",
        "answer": "Pixy Stix",
        "accept": [
          "pixy stix",
          "pixie stix",
          "pixy sticks"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In the United Kingdom, trick-or-treaters often receive this nestle candy bar made of crisp wafer fingers covered in smooth milk chocolate.",
        "answer": "Kit Kat",
        "accept": [
          "kit kat",
          "kitkat"
        ]
      }
    ]
  },
  {
    "id": "spooky-animals",
    "name": "SPOOKY ANIMALS",
    "icon": "spooky-animals",
    "group": "halloween",
    "blurb": "Vampire bats, ravens, black cats, tarantulas & eerie fauna",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Native to the Americas, this is the only mammalian mammal species that feeds exclusively on the fresh blood of other animals.",
        "answer": "Vampire bat",
        "accept": [
          "vampire bat",
          "vampire bats",
          "desmodontinae"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Edgar Allan Poe immortalized this large black bird repeating the grim omen \"Nevermore\" perched upon a bust of Pallas.",
        "answer": "The Raven",
        "accept": [
          "raven",
          "the raven",
          "ravens"
        ]
      },
      {
        "baseValue": 600,
        "clue": "With eight legs and hairy bodies, these large arachnids frequently decorate haunted houses and Halloween webs.",
        "answer": "Tarantulas / Spiders",
        "accept": [
          "tarantula",
          "tarantulas",
          "spider",
          "spiders"
        ]
      },
      {
        "baseValue": 800,
        "clue": "This nocturnal bird of prey is capable of rotating its head up to 270 degrees and emits an eerie hunting screech.",
        "answer": "An owl",
        "accept": [
          "owl",
          "owls",
          "barn owl",
          "screech owl"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Native to Madagascar, this bizarre nocturnal lemur with giant ears uses an elongated, bony middle finger to tap tree trunks for grubs.",
        "answer": "Aye-aye",
        "accept": [
          "aye-aye",
          "aye aye"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "When threatened, this horned desert lizard defends itself by rupturing capillaries in its eyelids to squirt blood from its eyes up to 5 feet.",
        "answer": "Horned lizard",
        "accept": [
          "horned lizard",
          "horned toad",
          "phrynosoma",
          "texas horned lizard"
        ]
      },
      {
        "baseValue": 200,
        "clue": "These scavenging birds with bald heads are often depicted circling ominously over dying animals or spooky desolate landscapes.",
        "answer": "Vultures",
        "accept": [
          "vulture",
          "vultures",
          "buzzard",
          "buzzards"
        ]
      },
      {
        "baseValue": 400,
        "clue": "The deadly spider recognized by an unmistakable bright red hourglass marking on the underside of its black abdomen.",
        "answer": "Black widow",
        "accept": [
          "black widow",
          "black widow spider",
          "latrodectus"
        ]
      },
      {
        "baseValue": 600,
        "clue": "This blind cave-dwelling fish and amphibian has pale translucent skin because it evolved in pitch darkness without sunlight.",
        "answer": "Cave salamander / Olm",
        "accept": [
          "olm",
          "cave salamander",
          "cavefish",
          "blind salamander"
        ]
      },
      {
        "baseValue": 800,
        "clue": "A group of ravens is colloquially referred to as an \"unkindness\", while a group of crows is famously called this.",
        "answer": "A murder",
        "accept": [
          "murder",
          "a murder",
          "murder of crows"
        ]
      }
    ]
  },
  {
    "id": "supernatural-folklore",
    "name": "SUPERNATURAL FOLKLORE",
    "icon": "supernatural-folklore",
    "group": "halloween",
    "blurb": "Headless Horsemen, Krampus, Dullahans & mythical dread",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Washington Irving's \"The Legend of Sleepy Hollow\" features this terrifying decapitated Hessian mercenary pursuing Ichabod Crane.",
        "answer": "The Headless Horseman",
        "accept": [
          "headless horseman",
          "the headless horseman"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Irish folklore, this headless fairy rider rides a black stallion carrying their own grinning severed head tucked under one arm.",
        "answer": "The Dullahan",
        "accept": [
          "dullahan",
          "the dullahan",
          "durahan"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Central European folklore, this horned, anthropomorphic \"half-goat, half-demon\" beast punishes misbehaving children in December.",
        "answer": "Krampus",
        "accept": [
          "krampus"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Japanese folklore, these horned ogre-like yōkai demons carry heavy iron clubs and punish wicked souls in Buddhist hells.",
        "answer": "Oni",
        "accept": [
          "oni",
          "an oni"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "A mythical changeling in European folklore is a fairy child secretly left behind in exchange for this stolen entity.",
        "answer": "A human baby",
        "accept": [
          "human baby",
          "baby",
          "a baby",
          "human infant",
          "child"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In Scandinavian folklore, this water spirit appears as a magnificent white horse by rivers, enticing riders onto its sticky back before drowning them.",
        "answer": "Bäckahästen / The Kelpie",
        "accept": [
          "kelpie",
          "the kelpie",
          "brook horse",
          "backahasten"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Folklore says sprinkling this common mineral substance across doorways and windows keeps evil spirits and ghosts from entering.",
        "answer": "Salt",
        "accept": [
          "salt",
          "rock salt",
          "line of salt"
        ]
      },
      {
        "baseValue": 400,
        "clue": "The will-o'-the-wisp, mysterious flickering ghostly lights hovering over bogs and marshes at night, is known in folklore to do this.",
        "answer": "Lead travelers astray",
        "accept": [
          "lure travelers",
          "lead people astray",
          "drown travelers",
          "mislead travelers"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Jewish mystical folklore, a dybbuk is this type of malicious disembodied soul that enters and possesses a living person.",
        "answer": "A dead soul / spirit",
        "accept": [
          "possessing spirit",
          "dead spirit",
          "evil soul",
          "ghost",
          "wandering spirit"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Filipino folklore, the Manananggal is a vampire-like monster capable of detaching this half of its body to fly with bat-like wings.",
        "answer": "Upper torso",
        "accept": [
          "upper half",
          "upper body",
          "torso",
          "waist up",
          "upper torso"
        ]
      }
    ]
  },
  {
    "id": "famous-horror-characters",
    "name": "FAMOUS HORROR ICONS",
    "icon": "famous-horror-characters",
    "group": "halloween",
    "blurb": "Freddy, Jason, Michael Myers, Pennywise, Ghostface & Chucky",
    "clues": [
      {
        "baseValue": 200,
        "clue": "This disfigured Springwood killer stalks teenagers in their nightmares wearing a striped red-and-green sweater and razor glove.",
        "answer": "Freddy Krueger",
        "accept": [
          "freddy krueger",
          "freddy",
          "krueger"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Stephen King's shape-shifting ancient cosmic evil that terrorizes Derry, Maine primarily adopts the form of Pennywise the Dancing this.",
        "answer": "Clown",
        "accept": [
          "clown",
          "pennywise the clown",
          "dancing clown"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Serial killer Charles Lee Ray uses voodoo to transfer his dying soul into a popular \"Good Guy\" doll in the \"Child's Play\" franchise.",
        "answer": "Chucky",
        "accept": [
          "chucky",
          "charles lee ray"
        ]
      },
      {
        "baseValue": 800,
        "clue": "The iconic pale mask worn by Michael Myers in 1978's \"Halloween\" was originally a two-dollar thrift store mask of this Star Trek character.",
        "answer": "Captain James T. Kirk",
        "accept": [
          "captain kirk",
          "kirk",
          "william shatner",
          "james t kirk"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "The lead Cenobite in Clive Barker's \"Hellraiser\" series, known for a geometric grid of metallic spikes driven into his cranium.",
        "answer": "Pinhead",
        "accept": [
          "pinhead",
          "the priest",
          "hell priest"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In \"The Texas Chain Saw Massacre\", this towering cannibal killer wears masks fashioned from human skin and wields a Poulan chainsaw.",
        "answer": "Leatherface",
        "accept": [
          "leatherface",
          "bubba sawyer"
        ]
      },
      {
        "baseValue": 200,
        "clue": "The \"Scream\" franchise slasher killer wears a flowing black hooded robe and this iconic white Edvard Munch-inspired ghost mask.",
        "answer": "Ghostface",
        "accept": [
          "ghostface",
          "ghost face"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Jason Voorhees didn't acquire his trademark hockey mask until this numbered 1982 sequel in the \"Friday the 13th\" series.",
        "answer": "Part 3",
        "accept": [
          "part 3",
          "part iii",
          "friday the 13th part 3",
          "3"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In \"The Babadook\", this terrifying storybook entity insists: \"If it's in a word, or in a look, you can't get rid of\" this.",
        "answer": "The Babadook",
        "accept": [
          "the babadook",
          "babadook"
        ]
      },
      {
        "baseValue": 800,
        "clue": "The Jigsaw killer who subjects victims to elaborate deadly moral traps in the \"Saw\" franchise is named John this.",
        "answer": "John Kramer",
        "accept": [
          "kramer",
          "john kramer",
          "jigsaw"
        ]
      }
    ]
  },
  {
    "id": "halloween-around-world",
    "name": "HALLOWEEN WORLDWIDE",
    "icon": "halloween-around-world",
    "group": "halloween",
    "blurb": "Día de los Muertos, Obon, Hungry Ghost festival & global rituals",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Mexico vibrantly honors departed ancestors on November 1st and 2nd with sugar skulls and marigolds during this holiday.",
        "answer": "Día de los Muertos / Day of the Dead",
        "accept": [
          "dia de los muertos",
          "day of the dead",
          "dia de muertos"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Mexico, families construct these colorful home altars adorned with photographs, candles, and favorite foods to welcome returning spirits.",
        "answer": "Ofrendas",
        "accept": [
          "ofrenda",
          "ofrendas",
          "altars",
          "altar"
        ]
      },
      {
        "baseValue": 600,
        "clue": "During Japan's Buddhist Obon festival in August, people float paper lanterns called Toro Nagashi down rivers to guide spirits back to this place.",
        "answer": "The spirit world / Afterlife",
        "accept": [
          "spirit world",
          "afterlife",
          "the afterlife",
          "world of the dead",
          "other world"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In Chinese culture, during the Hungry Ghost Month, believers burn mock money known as this to provide deceased ancestors with wealth.",
        "answer": "Joss paper / Ghost money",
        "accept": [
          "joss paper",
          "ghost money",
          "spirit money",
          "hell money"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "In the Philippines, on November 1st, groups of children travel from house to house singing hymns for souls in purgatory in this tradition.",
        "answer": "Pangangaluluwa",
        "accept": [
          "pangangaluluwa"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "On the Isle of Man, the traditional Gaelic harvest festival celebrated on October 31st with carved turnips and bonfires is called this.",
        "answer": "Hop-tu-Naa",
        "accept": [
          "hop-tu-naa",
          "hop tu naa"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Bright orange petals of this fragrant flower (cempasúchil) are scattered in Mexico to guide spirits with their color and scent.",
        "answer": "Marigold",
        "accept": [
          "marigold",
          "marigolds",
          "cempasuchil"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In Austria, some families leave bread, water, and an illuminated lamp on the table on Halloween night before going to bed for these guests.",
        "answer": "Dead souls / Ancestors",
        "accept": [
          "dead souls",
          "spirits",
          "ancestors",
          "ghosts",
          "deceased relatives"
        ]
      },
      {
        "baseValue": 600,
        "clue": "In Latin America, sweet festive round bread baked with bone-shaped dough crosses on top for Day of the Dead is called Pan de this.",
        "answer": "Pan de Muerto",
        "accept": [
          "muerto",
          "pan de muerto",
          "muertos",
          "pan de los muertos"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In South Korea, this major autumn harvest holiday sees families travel to ancestral hometowns to perform memorial rituals and share rice cakes.",
        "answer": "Chuseok",
        "accept": [
          "chuseok",
          "hangawi"
        ]
      }
    ]
  },
  {
    "id": "myth-or-fact",
    "name": "MYTH OR FACT?",
    "icon": "myth-or-fact",
    "group": "halloween",
    "blurb": "Halloween folklore truths, debunked myths & trivia fact-checks",
    "clues": [
      {
        "baseValue": 200,
        "clue": "Myth or Fact: Out of over 1,400 species of bats worldwide, only three species feed on blood.",
        "answer": "Fact",
        "accept": [
          "fact",
          "true"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Myth or Fact: Millions of dollars of poisoned or razor-laced candy are handed out by random strangers to trick-or-treaters every year.",
        "answer": "Myth",
        "accept": [
          "myth",
          "false"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Myth or Fact: Full moons consistently occur on Halloween night every two or three years.",
        "answer": "Myth",
        "accept": [
          "myth",
          "false"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Myth or Fact: Pumpkins are botanically classified as fruits (specifically large berries), not vegetables.",
        "answer": "Fact",
        "accept": [
          "fact",
          "true"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Myth or Fact: In the Salem Witch Trials of 1692, convicted witches were burned alive at the stake.",
        "answer": "Myth",
        "accept": [
          "myth",
          "false"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "Myth or Fact: The confectionery glaze on candy corn is made from shellac, a natural resin secreted by female lac bugs.",
        "answer": "Fact",
        "accept": [
          "fact",
          "true"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Myth or Fact: Animal shelters often halt black cat adoptions in October over fears of ritual harm or novelty impulse adoptions.",
        "answer": "Fact",
        "accept": [
          "fact",
          "true"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Myth or Fact: Frankenstein is the name of the eight-foot green monster assembled from corpses.",
        "answer": "Myth",
        "accept": [
          "myth",
          "false"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Myth or Fact: Over 90% of all commercially processed pumpkins in the United States are grown in the state of Illinois.",
        "answer": "Fact",
        "accept": [
          "fact",
          "true"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Myth or Fact: The fear of Halloween is officially recognized by psychologists and bears the formal name Samhainophobia.",
        "answer": "Fact",
        "accept": [
          "fact",
          "true"
        ]
      }
    ]
  },
  {
    "id": "strange-creepy-facts",
    "name": "STRANGE & CREEPY FACTS",
    "icon": "strange-creepy-facts",
    "group": "halloween",
    "blurb": "Victorian oddities, bone churches, corpse flowers & macabre truths",
    "clues": [
      {
        "baseValue": 200,
        "clue": "In the Sedlec Ossuary near Kutná Hora in the Czech Republic, an enormous chandelier is crafted entirely from human these.",
        "answer": "Bones / Skeletons",
        "accept": [
          "bones",
          "human bones",
          "skeletons",
          "skulls"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Titan Arum, native to the rainforests of Sumatra, is nicknamed the \"Corpse Flower\" because its blooming stench mimics this.",
        "answer": "Rotting meat / flesh",
        "accept": [
          "rotting flesh",
          "decaying meat",
          "corpse",
          "dead body",
          "rotting carcass",
          "flesh"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Victorian families commonly commissioned post-mortem photography, posing deceased loved ones as if they were doing this.",
        "answer": "Sleeping / Alive",
        "accept": [
          "sleeping",
          "asleep",
          "still alive",
          "alive",
          "sitting normally"
        ]
      },
      {
        "baseValue": 800,
        "clue": "The parasitic fungus Ophiocordyceps unilateralis infects these insects, controlling their central nervous systems like real zombies.",
        "answer": "Ants",
        "accept": [
          "ants",
          "ant",
          "carpenter ants"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "In Victorian London, grave robbers known as \"resurrectionists\" dug up fresh cadavers to sell to this profession for dissection practice.",
        "answer": "Medical doctors / Anatomy students",
        "accept": [
          "doctors",
          "medical students",
          "surgeons",
          "medical schools",
          "anatomists"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "Toraja people in South Sulawesi, Indonesia preserve dead family members for years and exhume them annually in this cleansing ritual.",
        "answer": "Ma'nene",
        "accept": [
          "ma'nene",
          "manene",
          "cleaning the corpses"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Coffin-shaped safety coffins patented in the 1800s included a cord leading to an above-ground bell in case the occupant was this.",
        "answer": "Buried alive",
        "accept": [
          "buried alive",
          "still alive",
          "alive",
          "not dead"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Deep sea gulper eels and anglerfish dwell in this completely pitch-black oceanic layer below 3,300 feet called the bathypelagic or this zone.",
        "answer": "Midnight Zone",
        "accept": [
          "midnight zone",
          "the midnight zone",
          "abyss"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The human body continues to decompose after death through autolysis, where cells self-digest using their own digestive these.",
        "answer": "Enzymes",
        "accept": [
          "enzymes",
          "digestive enzymes"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Mummies from the Capuchin Catacombs of Palermo in Sicily include two-year-old Rosalia Lombardo, famous as \"The Sleeping\" this.",
        "answer": "Beauty",
        "accept": [
          "sleeping beauty",
          "beauty"
        ]
      }
    ]
  },
  {
    "id": "halloween-pop-culture",
    "name": "HALLOWEEN POP CULTURE",
    "icon": "halloween-pop-culture",
    "group": "halloween",
    "blurb": "Nightmare Before Christmas, Monster Mash, Thriller & spooky hits",
    "clues": [
      {
        "baseValue": 200,
        "clue": "In Tim Burton's 1993 stop-motion classic, Jack Skellington reigns supreme as the Pumpkin King of this fictional holiday town.",
        "answer": "Halloween Town",
        "accept": [
          "halloween town",
          "halloweentown"
        ]
      },
      {
        "baseValue": 400,
        "clue": "Bobby \"Boris\" Pickett hit #1 on the Billboard Hot 100 in 1962 with this enduring graveyard novelty dance song.",
        "answer": "Monster Mash",
        "accept": [
          "monster mash",
          "the monster mash"
        ]
      },
      {
        "baseValue": 600,
        "clue": "Michael Jackson's epic 14-minute 1983 music video featuring red leather, dancing zombies, and narration by horror legend Vincent Price.",
        "answer": "Thriller",
        "accept": [
          "thriller"
        ]
      },
      {
        "baseValue": 800,
        "clue": "In the Peanuts television special, Linus van Pelt spends Halloween night in a pumpkin patch waiting for this legendary figure.",
        "answer": "The Great Pumpkin",
        "accept": [
          "the great pumpkin",
          "great pumpkin"
        ]
      },
      {
        "baseValue": 1000,
        "clue": "Saying the name of this Michael Keaton \"bio-exorcist\" ghost three times summons him from the afterlife.",
        "answer": "Beetlejuice",
        "accept": [
          "beetlejuice",
          "betelgeuse"
        ]
      },
      {
        "baseValue": 1200,
        "clue": "In \"The Addams Family\", this disembodied sentient right hand acts as a beloved household servant and family confidant.",
        "answer": "Thing",
        "accept": [
          "thing",
          "thing t. thing"
        ]
      },
      {
        "baseValue": 200,
        "clue": "Who you gonna call when there's something strange in your neighborhood? These New York paranormal exterminators.",
        "answer": "Ghostbusters",
        "accept": [
          "ghostbusters",
          "the ghostbusters"
        ]
      },
      {
        "baseValue": 400,
        "clue": "In \"The Nightmare Before Christmas\", Jack Skellington's ghost dog with a glowing red pumpkin nose is named this.",
        "answer": "Zero",
        "accept": [
          "zero"
        ]
      },
      {
        "baseValue": 600,
        "clue": "The classic 1984 80s creature feature comedy where adorable Mogwai pets turn into mischievous reptilian monsters if fed after midnight.",
        "answer": "Gremlins",
        "accept": [
          "gremlins"
        ]
      },
      {
        "baseValue": 800,
        "clue": "Ray Parker Jr. wrote and performed the Academy Award-nominated chart-topping theme song for this 1984 Ivan Reitman film.",
        "answer": "Ghostbusters",
        "accept": [
          "ghostbusters"
        ]
      }
    ]
  }
];

const HALLOWEEN_FINAL_POOL = [
  {
    "category": "SPOOKY LITERATURE",
    "clue": "First published anonymously in London on New Year's Day 1818, this masterpiece was penned by a 20-year-old author during a rainy summer near Lake Geneva.",
    "answer": "Frankenstein (or, The Modern Prometheus)",
    "accept": [
      "frankenstein",
      "mary shelley's frankenstein",
      "the modern prometheus"
    ]
  },
  {
    "category": "CLASSIC HORROR CINEMA",
    "clue": "This 1931 Universal horror masterpiece starring Bela Lugosi opened with musical selections from Tchaikovsky's \"Swan Lake\".",
    "answer": "Dracula",
    "accept": [
      "dracula",
      "bela lugosi dracula"
    ]
  },
  {
    "category": "GOTHIC POETRY",
    "clue": "Set \"once upon a midnight dreary\", this famous 1845 narrative poem features a bereaved student mourning the lost maiden Lenore.",
    "answer": "The Raven",
    "accept": [
      "the raven",
      "raven"
    ]
  },
  {
    "category": "HALLOWEEN TRADITIONS",
    "clue": "The ancient Celtic spiritual festival from which modern Halloween derives literally translates to \"Summer's End\" in Gaelic.",
    "answer": "Samhain",
    "accept": [
      "samhain"
    ]
  },
  {
    "category": "ICONIC MONSTERS",
    "clue": "In Bram Stoker's original 1897 novel, Count Dracula arrives on the foggy coast of England aboard a derelict Russian schooner named this.",
    "answer": "The Demeter",
    "accept": [
      "demeter",
      "the demeter"
    ]
  },
  {
    "category": "HISTORIC WITCHCRAFT",
    "clue": "During the 1692 Salem Witch Trials, this 81-year-old farmer was the only victim pressed to death with heavy stones after refusing to enter a plea.",
    "answer": "Giles Corey",
    "accept": [
      "giles corey",
      "corey"
    ]
  },
  {
    "category": "HALLOWEEN CONFECTIONS",
    "clue": "Invented in Philadelphia in the 1880s, the three iconic layers of candy corn represent the colors of this agricultural food staple.",
    "answer": "Corn (kernel of corn)",
    "accept": [
      "corn",
      "kernel of corn",
      "maize"
    ]
  },
  {
    "category": "GHOST LEGENDS",
    "clue": "According to maritime lore, sighting this phantom ghost ship doomed never to make port was considered a terrible omen by sailors.",
    "answer": "The Flying Dutchman",
    "accept": [
      "flying dutchman",
      "the flying dutchman"
    ]
  },
  {
    "category": "HORROR FILM HISTORY",
    "clue": "This 1973 film was the very first horror movie in Academy Awards history to receive a nomination for Best Picture.",
    "answer": "The Exorcist",
    "accept": [
      "the exorcist",
      "exorcist"
    ]
  },
  {
    "category": "WORLDWIDE TRADITIONS",
    "clue": "In Mexico's Day of the Dead celebrations, these decorative sweet skulls made of sugar paste and meringue powder are called this.",
    "answer": "Calaveras (Sugar Skulls)",
    "accept": [
      "sugar skulls",
      "calaveras",
      "calaveras de azucar",
      "sugar skull"
    ]
  },
  {
    "category": "MYTHOLOGICAL BEASTS",
    "clue": "In Greek myth, this three-headed hound with a serpent's tail faithfully guarded the gates of the Underworld to prevent souls from escaping.",
    "answer": "Cerberus",
    "accept": [
      "cerberus",
      "kerberos"
    ]
  },
  {
    "category": "URBAN LEGENDS",
    "clue": "The folkloric 1909 sightings of this winged beast with a horse's head, bat wings, and cloven hooves caused schools to close across southern New Jersey.",
    "answer": "The Jersey Devil",
    "accept": [
      "the jersey devil",
      "jersey devil",
      "leeds devil"
    ]
  },
  {
    "category": "AUTUMN ASTRONOMY",
    "clue": "A full moon occurring on Halloween night is classified as this colorful term when it is the second full moon within a single calendar month.",
    "answer": "A Blue Moon",
    "accept": [
      "blue moon",
      "a blue moon"
    ]
  },
  {
    "category": "SPOOKY BOTANY",
    "clue": "The botanical name of deadly nightshade, Atropa belladonna, derives from the Italian for \"beautiful lady\" and Atropos, one of the three Greek these.",
    "answer": "Fates",
    "accept": [
      "fates",
      "the fates",
      "moirai"
    ]
  },
  {
    "category": "HAUNTED PLACES",
    "clue": "Perched in the mountains of Estes Park, Colorado, this historic hotel opened in 1909 and famously inspired the Overlook Hotel.",
    "answer": "The Stanley Hotel",
    "accept": [
      "the stanley hotel",
      "stanley hotel",
      "stanley"
    ]
  },
  {
    "category": "HALLOWEEN SONGS",
    "clue": "This 1984 dance track composed by Ray Parker Jr. asking \"Who you gonna call?\" spent three weeks at #1 on the Billboard Hot 100.",
    "answer": "Ghostbusters",
    "accept": [
      "ghostbusters"
    ]
  }
];

module.exports = {
  HALLOWEEN_CATEGORIES,
  HALLOWEEN_FINAL_POOL,
};

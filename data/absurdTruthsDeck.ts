export interface Category {
  emoji: string
  label: string
}

export interface Card {
  phrase: string
  categories?: [Category, Category, Category]
  answer: string
}

export const GAME_DECK: Card[] = [
  {
    phrase: 'Groak',
    categories: [{ emoji: '🦑', label: 'sea creature' }, { emoji: '💃', label: 'old dance' }, { emoji: '🍳', label: 'food longing' }],
    answer: "Groaking is the ancient art of positioning yourself near someone else's meal with an expression of complete innocence, silently willing them to offer you some. The word comes from old Scottish dialect and carries no shame whatsoever. Your dog has been a professional groaker since birth and has never once apologised for it. The remarkable thing about groaking is that it sometimes works.",
  },
  {
    phrase: 'Eigengrau',
    categories: [{ emoji: '🎨', label: 'paint colour' }, { emoji: '☁️', label: 'type of cloud' }, { emoji: '🔭', label: 'philosophical concept' }],
    answer: "Eigengrau is the specific shade of dark grey your brain generates when there is absolutely nothing for your eyes to see — not black, but a particular grey your visual system hallucinates to fill the void. Scientists were bothered enough by this to give it a name. You are producing eigengrau right now in your blind spot and have been your entire life without noticing. The word is German, which somehow makes it more unsettling.",
  },
  {
    phrase: 'Zugzwang',
    categories: [{ emoji: '🍰', label: 'German dessert' }, { emoji: '⛰️', label: 'mountain range' }, { emoji: '♟️', label: 'chess trap' }],
    answer: "Zugzwang is a chess situation where it is your turn to move but every single option available to you will make your position worse — yet you are still required to move. You cannot pass. You cannot abstain. You simply must choose your least catastrophic option and accept what follows. The word is German, which is fitting. It also describes most group chat situations after a long awkward silence.",
  },
  {
    phrase: 'Tarantism',
    categories: [{ emoji: '🕷️', label: 'spider phobia' }, { emoji: '🥐', label: 'Italian pastry' }, { emoji: '🕺', label: 'compulsive urge' }],
    answer: "Tarantism was a genuine medieval epidemic in southern Italy where people began dancing uncontrollably and simply could not stop — sometimes for days on end. Physicians believed a tarantula bite caused it, and the official prescribed cure was specific music played loudly until the afflicted sweated the venom out. Entire villages erupted. Historians still disagree on whether this was mass hysteria, a fungal toxin in the grain, or simply the best party the 15th century ever produced.",
  },
  {
    phrase: 'Grawlix',
    categories: [{ emoji: '⚡', label: 'Norse rune' }, { emoji: '💪', label: 'type of muscle' }, { emoji: '💬', label: 'cartoon swear symbols' }],
    answer: "Grawlix are the @#$%! symbols that comic strip artists place in speech bubbles instead of actual profanity when a character stubs their toe, discovers a parking ticket, or receives very bad news. The word was coined in 1964 and almost nobody uses it, which is a shame because it is one of the most useful words in print culture. The symbols have no fixed meaning — any arrangement of punctuation conveys equal fury.",
  },
  {
    phrase: 'Borborygmus',
    categories: [{ emoji: '🦕', label: 'dinosaur' }, { emoji: '🏛️', label: 'ancient philosopher' }, { emoji: '🔊', label: 'bodily noise' }],
    answer: "Borborygmus is the official medical term for the rumbling, gurgling, persistently loud sounds your stomach makes when it is empty, mid-digestion, or simply having opinions about your lunch choices. The word comes from ancient Greek and is almost entirely onomatopoeic — say it out loud and you will hear it. Doctors write this on clinical charts as if it is a notable finding. It is not a diagnosis. Your stomach is just talking.",
  },
  {
    phrase: 'Psithurism',
    categories: [{ emoji: '💆', label: 'ancient therapy' }, { emoji: '🍹', label: 'cocktail' }, { emoji: '🌿', label: 'nature sound' }],
    answer: "Psithurism is the specific, gentle sound that wind makes when it passes through leaves and branches — that soft, continuous rustling that has no other single name in English. The word comes from Greek and barely survived into modern usage. It is frequently listed as one of the most naturally soothing sounds humans can hear, which is why every sleep-sounds app features it prominently without ever knowing what to call it.",
  },
  {
    phrase: 'Callipygian',
    categories: [{ emoji: '🏺', label: 'ancient vase' }, { emoji: '🏛️', label: 'type of column' }, { emoji: '🍑', label: 'classical beauty' }],
    answer: "Callipygian means having exceptionally well-formed buttocks, and it comes directly from classical Greek. The ancient Greeks considered this important enough to have a specific goddess for it — Aphrodite Kallipygos — and built a temple in her honour in Syracuse. There is surviving ancient sculpture specifically celebrating this quality as high art. The Romans continued the tradition enthusiastically. It is one of the few compliments from antiquity that has aged without controversy.",
  },
  {
    phrase: 'Mumpsimus',
    categories: [{ emoji: '🤼', label: 'wrestling move' }, { emoji: '☁️', label: 'type of cloud' }, { emoji: '🧠', label: 'stubborn tradition' }],
    answer: "A mumpsimus is someone who stubbornly clings to a belief or practice long after it has been thoroughly proven wrong — simply because they have always done it that way and see no reason to change now. The word comes from a medieval priest who mispronounced a Latin phrase during mass every Sunday for his entire career. When finally corrected, he replied that he preferred his old mumpsimus to the newfangled correct version. He remains, in a sense, undefeated.",
  },
  {
    phrase: 'Gobemouche',
    categories: [{ emoji: '🥐', label: 'French pastry' }, { emoji: '🐦', label: 'type of bird' }, { emoji: '😶', label: 'naive type' }],
    answer: "Gobemouche translates literally from French as 'fly-swallower' and describes a person who will believe absolutely anything they are told, no matter how improbable, because their mouth is open wide enough for flies to wander in. It entered English in the eighteenth century as a polite insult used in polite company. In French it remains in active use as a considerably less polite insult. The image is very specific and almost impossible to unsee once explained.",
  },
  {
    phrase: 'Petrichor',
    categories: [{ emoji: '🌸', label: 'perfume brand' }, { emoji: '💊', label: 'ancient remedy' }, { emoji: '🌧️', label: 'nature scent' }],
    answer: "Petrichor is the distinctive, earthy, almost electric smell that rises the moment rain falls on dry ground after a long drought. Scientists named it in 1964 by combining the Greek words for stone and the fluid that flows in the veins of gods. The smell comes from a compound called geosmin released by soil bacteria when wet. Humans can detect geosmin at around five parts per trillion — possibly because our ancestors needed to find water.",
  },
  {
    phrase: 'Zarf',
    categories: [{ emoji: '⚔️', label: 'medieval title' }, { emoji: '🥄', label: 'kitchen gadget' }, { emoji: '☕', label: 'drink accessory' }],
    answer: "A zarf is the holder — sleeve or frame — placed around a hot coffee cup to protect your hand. The word is Arabic in origin and the object has existed since at least the tenth century, when coffeehouses became common across the Middle East. The earliest zarfs were ornate silver and gold filigree works of art, considered prestige objects and given as gifts. We have since replaced them with a small corrugated paper sleeve. Nobody agreed to this downgrade but it happened anyway.",
  },
  {
    phrase: 'Snollygoster',
    categories: [{ emoji: '🐉', label: 'mythical creature' }, { emoji: '💇', label: 'hairstyle' }, { emoji: '🏛️', label: 'unscrupulous politician' }],
    answer: "A snollygoster is a politician who operates entirely without moral constraints — someone who will say or do absolutely anything to acquire and hold power, with no principles to inconvenience them along the way. The word appeared in American newspapers in the 1840s and was reportedly a favourite expression of President Harry Truman, who deployed it freely. Its origin may derive from a mythical Pennsylvania creature that preyed on children. The comparison is considered apt.",
  },
  {
    phrase: 'Gardyloo',
    categories: [{ emoji: '🌿', label: 'garden tool' }, { emoji: '🍸', label: 'cocktail' }, { emoji: '🪣', label: 'street etiquette' }],
    answer: "Gardyloo was the warning cry shouted from upper-floor windows in medieval Edinburgh just before the occupant disposed of their chamber pot contents into the street below. It derived from the French gardez l'eau — watch out for the water — although the substance thrown was not water. The streets of old Edinburgh functioned as an open sewer and this warning was the only courtesy offered to pedestrians. Running water eventually made it obsolete, though the underlying instinct remains.",
  },
  {
    phrase: 'Apricity',
    categories: [{ emoji: '🍊', label: 'type of fruit' }, { emoji: '🧴', label: 'cleaning product' }, { emoji: '☀️', label: 'seasonal sensation' }],
    answer: "Apricity is the warmth of sunlight on your skin during winter — specifically the particular pleasure of feeling the sun when the air itself is still bitterly cold. The word appeared in an English dictionary in 1623 and then promptly fell out of use for reasons nobody has satisfactorily explained. It describes a sensation that almost everyone has enjoyed and had no word for. There is currently a minor revival underway among people who feel the language was poorer without it.",
  },
  {
    phrase: 'Tintinnabulation',
    categories: [{ emoji: '🐝', label: 'insect swarm' }, { emoji: '😟', label: 'type of anxiety' }, { emoji: '🔔', label: 'ringing of bells' }],
    answer: "Tintinnabulation is the ringing, tinkling, resonating sound of bells — specifically the way the sound lingers and reverberates long after the bell itself has stopped moving. Edgar Allan Poe used it as the central sonic image of one of his most famous poems, chosen because saying the word out loud produces the very effect it describes. It is among the most perfectly onomatopoeic words in the English language and one of the most satisfying to say in an empty room.",
  },
  {
    phrase: 'Limerence',
    categories: [{ emoji: '🍋', label: 'citrus fruit' }, { emoji: '💃', label: 'type of dance' }, { emoji: '💘', label: 'obsessive infatuation' }],
    answer: "Limerence is the state of involuntary, overwhelming romantic obsession — the intrusive thoughts, the constant mental rehearsal of every interaction, the desperate need for any sign that the feeling is returned. A psychologist named Dorothy Tennov coined the term in 1979 because 'crush' was far too casual and 'love' too broad to describe this specific, consuming experience. It is considered clinically distinct from love or attraction. It is, by most accounts of those who have experienced it, absolutely exhausting.",
  },
  {
    phrase: 'Collywobbles',
    categories: [{ emoji: '🐛', label: 'type of insect' }, { emoji: '💃', label: 'old dance' }, { emoji: '😰', label: 'nervous feeling' }],
    answer: "The collywobbles are the queasy, fluttering anxiety you feel in your stomach before something nerve-wracking — a difficult conversation, a job interview, the moment before you say something you cannot unsay. The word is British and gloriously Victorian. Its origin may derive from colic combined with wobble. It has been in use since at least the 1820s and was recently voted one of the most pleasing words in the English language by a group of people specifically asked that question.",
  },
  {
    phrase: 'Vellichor',
    categories: [{ emoji: '🧵', label: 'type of fabric' }, { emoji: '💊', label: 'medical term' }, { emoji: '📚', label: 'nostalgic mood' }],
    answer: "Vellichor describes the strange, melancholy wistfulness you feel inside a used bookshop — surrounded by books with their own histories, having passed through hands and lives you will never know, full of marginal notes left by strangers now gone. The word was invented in 2013 by writer John Koenig for his Dictionary of Obscure Sorrows. It spread across the internet regardless, because people had been feeling the thing it described for years without any way to name it.",
  },
  {
    phrase: 'Xenoglossy',
    categories: [{ emoji: '📱', label: 'language app' }, { emoji: '🍞', label: 'type of bread' }, { emoji: '🔮', label: 'paranormal ability' }],
    answer: "Xenoglossy is the claimed ability to speak or write fluently in a language you have never learned and never had any exposure to. It appears in documented accounts of hypnotic regression, near-death experiences, and reported cases of spiritual possession. Researchers have recorded apparent examples under controlled conditions. The majority of linguists are deeply sceptical. A small number of investigators insist the documented cases have never been satisfactorily explained away, which is a much more interesting position to hold at a dinner party.",
  },
  {
    phrase: 'Noctiluca',
    categories: [{ emoji: '🌙', label: 'night cream brand' }, { emoji: '🍝', label: 'pasta shape' }, { emoji: '🌊', label: 'bioluminescent plankton' }],
    answer: "Noctiluca are microscopic bioluminescent plankton that cause ocean waves to glow electric blue at night. The light is triggered by movement — a crashing wave, a swimming fish, a hand dragged slowly through the water. Beaches famous for the phenomenon attract visitors who travel specifically to swim in glowing sea at midnight. The word means night light in Latin. Swimming through a noctiluca bloom is consistently described as one of the most disorienting and beautiful experiences available to humans.",
  },
  {
    phrase: 'Mamihlapinatapai',
    categories: [{ emoji: '🎪', label: 'indigenous ceremony' }, { emoji: '💃', label: 'Patagonian dance' }, { emoji: '👀', label: 'shared unspoken longing' }],
    answer: "Mamihlapinatapai is a word from the Yaghan language of Tierra del Fuego. It describes the wordless look shared between two people who both want the same thing but neither is willing to be the first to act — that specific moment of mutual recognition and mutual hesitation. It has been called the most succinct word in the world. The Yaghan people are critically endangered; at last count there was believed to be one fluent native speaker remaining. The language is nearly gone, but this word survived.",
  },
  {
    phrase: 'Sonder',
    categories: [{ emoji: '⛵', label: 'navigation tool' }, { emoji: '🍝', label: 'pasta shape' }, { emoji: '💭', label: 'social epiphany' }],
    answer: "Sonder is the realisation that every random person you pass on the street has a life as vivid, complex, and consuming as your own — full of private ambitions, daily routines, people who love them, and fears they have never said out loud. The word was coined in 2012 by writer John Koenig. It spread because it names something people had been quietly experiencing for years without any word for. It is now used as though it has always existed, which is the best possible fate for an invented word.",
  },
  {
    phrase: 'Phosphene',
    categories: [{ emoji: '⚗️', label: 'chemical element' }, { emoji: '🌱', label: 'type of plant' }, { emoji: '✨', label: 'visual phenomenon' }],
    answer: "Phosphenes are the colours, shapes, and patterns of light you see when you press your closed eyes — the swirling fields, the brief geometric flashes, the interference patterns that appear with no external light source at all. They are caused by mechanical pressure on the retina triggering the visual system. They also appear during extreme G-forces and certain meditation states. Some researchers believe ancient cave paintings may have been inspired by phosphenes seen during ritual practices.",
  },
  {
    phrase: 'Cacoethes',
    categories: [{ emoji: '🏺', label: 'ancient Greek artefact' }, { emoji: '🧀', label: 'type of cheese' }, { emoji: '⚡', label: 'uncontrollable urge' }],
    answer: "Cacoethes is an irresistible compulsion to do something that is probably inadvisable — the overwhelming urge to say the wrong thing, start a new project before finishing the last one, or make a purchase you definitely cannot afford. It comes from Greek and means roughly 'bad habit elevated to compulsion.' It appears in the Roman poet Juvenal in the phrase cacoethes scribendi — the itch to write — used to describe people who cannot stop producing words even when they have nothing useful to say.",
  },
  {
    phrase: 'Frobly-Mobly',
    categories: [{ emoji: '🥞', label: 'breakfast food' }, { emoji: '💃', label: 'old dance' }, { emoji: '😐', label: 'vague malaise' }],
    answer: "Frobly-mobly is an archaic English expression for the precise state of being vague malaise — not sick enough to complain with any credibility, but not good enough to feel enthusiastic about anything. It appeared in British slang dictionaries in the early 1800s and then vanished completely. It is the verbal equivalent of the noncommittal shoulder shrug. English retained 'fine' as the standard evasion instead, which is a measurable downgrade in descriptive accuracy.",
  },
  {
    phrase: 'Snudge',
    categories: [{ emoji: '🛋️', label: 'type of cuddle' }, { emoji: '🪤', label: 'old trap' }, { emoji: '🎭', label: 'social hypocrisy' }],
    answer: "To snudge is to be a devoted miser in private while performing conspicuous acts of generosity in public — to count every penny at home while buying rounds at the pub and insisting on paying at dinner when an audience is present. The word appeared in British dictionaries in the 1700s and describes a very specific form of social hypocrisy that was apparently common enough to require its own term. It fell out of use in the nineteenth century. The behaviour it described did not.",
  },
  {
    phrase: 'Widdershins',
    categories: [{ emoji: '🍹', label: 'cocktail' }, { emoji: '🧵', label: 'type of stitch' }, { emoji: '↺', label: 'counterclockwise in ritual' }],
    answer: "Widdershins means moving counterclockwise, and carries the specific implication of doing so in a ceremonial or intentionally transgressive context. It comes from Middle Low German and entered Scottish dialect. In folklore, moving widdershins — against the direction of the sun — was considered deeply unlucky at best and actively summoning at worst. It was associated with witchcraft and with rituals designed to work against natural order. This distinction was treated as genuinely important for several centuries.",
  },
  {
    phrase: 'Pettifoggery',
    categories: [{ emoji: '🎲', label: 'board game' }, { emoji: '👒', label: 'Victorian hat' }, { emoji: '⚖️', label: 'quibbling over trivialities' }],
    answer: "Pettifoggery is the practice of focusing all energy on trivial, unimportant details while entirely avoiding anything of substance — particularly in legal or professional settings. A pettifogger was originally a second-rate lawyer who won cases through technical obstructions rather than actual merit. The word entered English in the 1500s. It has never fully left. Most long meetings are composed primarily of pettifoggery, which is why most meetings could and should be emails, but rarely are.",
  },
  {
    phrase: 'Scripturient',
    categories: [{ emoji: '📎', label: 'office supply' }, { emoji: '📜', label: 'ancient script' }, { emoji: '✍️', label: 'creative compulsion' }],
    answer: "Scripturient means possessed by a violent, irresistible desire to write — to be driven compulsively toward putting words somewhere regardless of whether you have anything useful to say. It comes from the Latin scripturire and is the companion condition to cacoethes scribendi, the writer's itch. Both describe the same affliction from slightly different angles, and neither has a cure. Most prolific writers throughout history were scripturient. Most of the internet is scripturient output produced with great urgency and almost no reflection.",
  },
  {
    phrase: 'Lollygag',
    categories: [{ emoji: '🍭', label: 'type of candy' }, { emoji: '🎣', label: 'fishing technique' }, { emoji: '🐌', label: 'idle behavior' }],
    answer: "Lollygag means to waste time in an aimless, leisurely, mildly infuriating way — to be technically in motion without any useful direction or productive intent. It appeared in American English in the 1860s with an earlier meaning related to idle flirting, then shifted to general time-wasting over the following decades. It is a word exclusively useful for describing what someone else is doing. Nobody in recorded history has ever accused themselves of lollygagging. It is always the other person.",
  },
  {
    phrase: 'Bumfuzzle',
    categories: [{ emoji: '🍳', label: 'cooking technique' }, { emoji: '🐜', label: 'small creature' }, { emoji: '😵', label: 'deep confusion' }],
    answer: "To bumfuzzle someone is to confuse or perplex them so thoroughly that they are left helpless, baffled, and unable to make sense of the situation. It appeared in American English in the late 1800s, primarily in Southern dialect, and its precise origin remains unknown. It implies not just confusion but a specific kind of helpless, slightly ridiculous bafflement — the kind where you know you should understand what just happened but simply do not. It has survived mainly in rural American usage while the rest of the language moved on.",
  },
  {
    phrase: 'Cattywampus',
    categories: [{ emoji: '🎮', label: "children's game" }, { emoji: '👒', label: 'hat style' }, { emoji: '↗️', label: 'spatial disorder' }],
    answer: "Cattywampus means positioned askew, off-kilter, or at a diagonal — not quite aligned with anything, slightly wrong in its angle. It appeared in American dialect in the 1830s and has remained primarily in Southern usage. Its origin is genuinely mysterious. Some linguists believe it may derive from a dialectal word for a fierce imaginary animal. The connection between a fierce imaginary animal and the state of being slightly lopsided has never been satisfactorily explained, which seems appropriate.",
  },
  {
    phrase: 'Kairos',
    categories: [{ emoji: '🏙️', label: 'Egyptian city' }, { emoji: '🧵', label: 'type of fabric' }, { emoji: '⏱️', label: 'perfect opportune moment' }],
    answer: "Kairos is the ancient Greek concept of the perfect, fleeting, opportune moment — the precise instant when conditions align and a particular action becomes possible, after which the window closes. It is explicitly distinguished from chronos, which is ordinary measured time. Greek philosophers considered recognising kairos a skill that required years to develop. Archers were the exemplary practitioners: the release must come at the single correct instant. Too early or too late and the moment is gone. This, apparently, applies to everything.",
  },
  {
    phrase: 'Catoptromancy',
    categories: [{ emoji: '🪞', label: 'mirror divination' }, { emoji: '🏋️', label: 'ancient Greek sport' }, { emoji: '🔮', label: 'divination method' }],
    answer: "Catoptromancy is the practice of divining the future by looking into mirrors — either gazing directly into them or lowering them into sacred wells to read the reflections. It is among the oldest recorded forms of fortune-telling, documented in ancient Greece, Rome, and Persia. Mirrors were understood as portals. The modern superstition about breaking a mirror bringing seven years of bad luck is a direct descendant of these beliefs. The Romans specified seven years because that was how long the soul needed to renew itself after catastrophe.",
  },
  {
    phrase: 'Ultracrepidarian',
    categories: [{ emoji: '👟', label: 'running shoe' }, { emoji: '🏛️', label: 'Roman architect' }, { emoji: '🗣️', label: 'opining beyond expertise' }],
    answer: "An ultracrepidarian is someone who gives confident, forceful opinions on subjects they know absolutely nothing about — who happily reviews the surgery, critiques the flight path, and explains the economics while having no particular knowledge of any of it. The word comes from a story about the painter Apelles, who told a cobbler not to judge above the sandal after the cobbler criticised his painting beyond the shoe. The cobbler ignored this completely, as ultracrepidarians always do.",
  },
  {
    phrase: 'Tyromancy',
    categories: [{ emoji: '🧀', label: 'cheese divination' }, { emoji: '🏊', label: 'ancient sport' }, { emoji: '✨', label: 'food ritual' }],
    answer: "Tyromancy is the practice of telling the future by closely observing the patterns that form in curdling or coagulating cheese. It was documented in the ancient world alongside other then-respectable methods of divination and was apparently treated with full seriousness. Practitioners read the holes, the texture, the direction of mould, and the patterns of separation as meaningful signs. It is one of the less prestigious ways to claim prophetic ability, though the cheese was presumably edible regardless of what it predicted.",
  },
  {
    phrase: 'Sternutation',
    categories: [{ emoji: '💃', label: 'ancient dance' }, { emoji: '🍝', label: 'type of pasta' }, { emoji: '🤧', label: 'bodily reflex' }],
    answer: "Sternutation is the formal medical term for sneezing — the involuntary explosive expulsion of air through the nose and mouth at speeds that can exceed 100 miles per hour. Ancient cultures treated sneezing as deeply significant: Greeks saw it as a divine omen, Romans felt it required an immediate blessing, and various traditions held that the soul could briefly escape during a sneeze, which is why the blessing developed as a protective response. The superstition survived several thousand years after anyone stopped believing the premise that created it.",
  },
  {
    phrase: 'Ploiter',
    categories: [{ emoji: '🦑', label: 'sea creature' }, { emoji: '🔧', label: 'old tool' }, { emoji: '😴', label: 'work behavior' }],
    answer: "To ploiter is to work in a halfhearted, ineffective way while maintaining the appearance of genuine effort — to be technically in motion, producing the visual signs of productivity, while achieving essentially nothing of substance. It is a Scottish dialect word of uncertain origin. It describes with uncomfortable precision an activity that most organisations quietly depend on and most performance reviews consistently fail to detect. Ploitering is explicitly different from laziness, which involves no pretence. It requires a sustained, committed performance of busyness.",
  },
  {
    phrase: 'Quomodocunquize',
    categories: [{ emoji: '🏺', label: 'ancient ritual' }, { emoji: '☁️', label: 'type of cloud' }, { emoji: '💰', label: 'profit motivation' }],
    answer: "To quomodocunquize is to make money by absolutely any method that presents itself, regardless of its dignity, elegance, or moral particulars. The word comes from the Latin quomodo-cunque, meaning in whatever way. It appeared in seventeenth-century English, was used approximately three times, and then vanished. It is occasionally revived by people who enjoy finding the most technically precise word for a common human behaviour. It accurately describes the business model of a remarkable number of enterprises that would prefer a more flattering description.",
  },
  {
    phrase: 'Rawgabbit',
    categories: [{ emoji: '🐟', label: 'type of fish' }, { emoji: '💃', label: 'old dance' }, { emoji: '🤫', label: 'false authority' }],
    answer: "A rawgabbit is someone who speaks with tremendous confidence and apparent authority about matters they have absolutely no knowledge of — specifically in private settings, where they claim insider access and special information they do not possess. The word is Scottish dialect. It differs from an ordinary know-it-all in the specific element of false intimacy: the rawgabbit does not just opine, they confide. Every workplace has at least one. They are extremely difficult to distinguish from people who actually do have inside knowledge, which is why they thrive.",
  },
  {
    phrase: 'Snoutfair',
    categories: [{ emoji: '🥐', label: 'type of pastry' }, { emoji: '🎲', label: 'old game' }, { emoji: '😍', label: 'physical appeal' }],
    answer: "Snoutfair is a sixteenth-century English compliment meaning a person who is exceptionally handsome or attractive — someone with a fine, pleasing face. The word appeared in early English usage and then quietly disappeared without any recorded explanation. It is, objectively, a good word. Its phonetics are slightly odd, which may account for its disappearance. The sixteenth century coined several excellent words for attractiveness that did not survive, while retaining several far less interesting alternatives. English has historically made peculiar choices in this department.",
  },
  {
    phrase: 'Flibbertigibbet',
    categories: [{ emoji: '🦋', label: 'type of insect' }, { emoji: '🥐', label: 'pastry' }, { emoji: '🌀', label: 'personality type' }],
    answer: "A flibbertigibbet is a person who is excessively chatty, irredeemably flighty, and functionally impossible to have a serious conversation with — someone who darts between topics and leaves every exchange feeling slightly dizzy. The word has been in English since the fifteenth century. Shakespeare used it. It is also one of the names medieval theologians assigned to a specific minor demon whose responsibility was causing exactly this behaviour in otherwise reasonable humans. The Sound of Music used it as the gentlest possible insult.",
  },
  {
    phrase: 'Sempiternal',
    categories: [{ emoji: '🍝', label: 'pasta shape' }, { emoji: '🪦', label: 'funeral tradition' }, { emoji: '♾️', label: 'divine quality' }],
    answer: "Sempiternal means divine quality — but with a specific philosophical weight implying that the thing has always existed and will always continue to exist, without beginning, without end, and without variation. It comes from the Latin semper, always, and aeternus, eternal — making it more absolute than merely eternal. Theologians used it specifically to describe certain divine attributes. It entered English in the fifteenth century, left mainstream use, and has since been adopted almost exclusively by philosophers, theologians, and certain rock bands.",
  },
  {
    phrase: 'Meraki',
    categories: [{ emoji: '🍹', label: 'cocktail' }, { emoji: '🍝', label: 'pasta brand' }, { emoji: '✨', label: 'creative devotion' }],
    answer: "Meraki is a modern Greek word for the quality of creative devotion — putting a piece of yourself into what you make, approaching it with love and creativity rather than efficiency or obligation. It has no direct single-word translation in English, which is why English borrowed it eagerly in the 2010s when people found they needed a word for a quality they valued but could not name. Greeks are reportedly somewhat baffled by how urgently the rest of the world apparently needed this concept explained to them.",
  },
  {
    phrase: 'Sprezzatura',
    categories: [{ emoji: '🍝', label: 'Italian sauce' }, { emoji: '🏋️', label: 'Italian sport' }, { emoji: '✨', label: 'social grace' }],
    answer: "Sprezzatura is an Italian Renaissance concept coined in 1528 to describe the art of making difficult, practised things appear entirely effortless — performing with skill and grace while concealing every trace of the labour that made it possible. It was presented as the single most important quality of the ideal Renaissance courtier. The concept became foundational to modern ideas of cool, style, and charisma across every culture. Every person who makes their difficult job look easy is practicing sprezzatura. The word for this quality is older than most countries.",
  },
  {
    phrase: 'Kummerspeck',
    categories: [{ emoji: '🐷', label: 'type of animal' }, { emoji: '🌲', label: 'German forest' }, { emoji: '🍫', label: 'comfort eating' }],
    answer: "Kummerspeck is a German compound word that translates literally as grief bacon and means the weight you gain from stress eating or emotional eating during difficult periods of your life. German has developed a remarkable number of compound words that describe very specific unhappy experiences with clinical detachment and occasional wit. This is widely considered the best one. It manages to name both the action and its physical consequence in a single term, and it does so using the word bacon, which softens the judgement considerably.",
  },
  {
    phrase: 'Tsundoku',
    categories: [{ emoji: '🛋️', label: 'furniture style' }, { emoji: '🎮', label: 'old game' }, { emoji: '📚', label: 'reading habit' }],
    answer: "Tsundoku is a Japanese term for the specific habit of buying books with every intention of reading them, then letting them accumulate in piles around your home while that intention quietly fades. The word combines the verb tsunde, to stack, with doku, reading. It has existed in Japanese since at least the 1870s, which confirms this is not a modern problem caused by online shopping. It is generally considered an affectionate rather than critical term — an affliction of optimism rather than laziness. The books are still there. The intention technically still exists.",
  },
  {
    phrase: 'Fernweh',
    categories: [{ emoji: '🌿', label: 'type of fern' }, { emoji: '📐', label: 'German measurement' }, { emoji: '✈️', label: 'travel yearning' }],
    answer: "Fernweh is a German word for the specific ache of longing for somewhere far away — a restless craving for distant, unknown places you have never been and may never reach. It is the exact opposite of homesickness: a yearning directed outward toward the unfamiliar rather than backward toward the known. English has borrowed wanderlust as the closest approximation, but wanderlust lacks the specifically painful, hollow quality that fernweh captures. The German language has produced a disproportionate number of words for precise varieties of longing, which may say something meaningful about Germany, or may simply reflect the nature of longing itself.",
  },
]

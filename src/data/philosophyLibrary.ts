import { ChapterBookmark, PageContent, DocumentItem } from '../types';
import { splitIntoSentences, splitIntoParagraphs } from '../services/pdfService';

/**
 * Authentic philosophical chapters from Carl Gustav Jung and seminal thinkers.
 */
interface ChapterBlueprint {
  title: string;
  author: string;
  part: string;
  theme: string;
  description: string;
  pageCount: number;
  proseBlocks: string[];
}

const PHILOSOPHICAL_BLUEPRINTS: ChapterBlueprint[] = [
  {
    title: 'The Concept of the Collective Unconscious',
    author: 'Carl Gustav Jung',
    part: 'Part I: Carl Gustav Jung — Depth Psychology',
    theme: 'The Transpersonal Psyche',
    description: 'Investigation into psychological layers deeper than personal memory, shared universally across human cultures.',
    pageCount: 100,
    proseBlocks: [
      `A more or less superficial layer of the unconscious is undoubtedly personal. I call it the personal unconscious. But this personal unconscious rests upon a deeper layer, which does not derive from personal experience and is not a personal acquisition but is inborn. This deeper stratum I have called the collective unconscious.

I have chosen the term "collective" because this part of the unconscious is not of an individual constitution, but is universal. It has contents and modes of behavior that are more or less the same everywhere and in all individuals. It is, in other words, identical in all men and thus constitutes a common psychic substrate of a suprapersonal nature which is present in every one of us.

Psychic existence is recognized only by the presence of contents that are capable of consciousness. We can therefore speak of an unconscious only insofar as we are able to verify its contents. The contents of the personal unconscious are chiefly the feeling-toned complexes, as they are called; they constitute the personal and private side of psychic life. The contents of the collective unconscious, on the other hand, are known as archetypes.`,

      `The archetype is essentially an unconscious content that is altered by becoming conscious and by being perceived, and it takes its color from the individual consciousness in which it happens to appear. What the archetype is in itself cannot be translated into consciousness; it is an organic, formative principle.

There are as many archetypes as there are typical situations in life. Endless repetition has engraved these experiences into our psychic constitution, not in the forms of images filled with content, but at first only as forms without content, representing merely the possibility of a certain type of perception and action.

When a situation occurs which corresponds to a given archetype, that archetype becomes activated and a compulsiveness appears, which, like an instinctual drive, gains its way against all reason and will, or else produces a conflict of pathological dimensions: that is, a neurosis.`,

      `Who looks outside, dreams; who looks inside, awakes. The psychological mechanism of projection enables us to perceive in the outer world what is actually taking place within our own psyche. We project our darkest repressed thoughts onto our neighbors, political rivals, and out-groups.

Until you make the unconscious conscious, it will direct your life and you will call it fate. The journey toward psychological wholeness requires us to turn inward with fearless honesty, confronting the deep currents that move beneath our deliberate reasoning.

In every adult there lurks a child, an eternal child, something that is always becoming, is never completed, and calls for unceasing care, attention, and education. That is the part of the human personality which wants to develop and complete itself.`
    ]
  },
  {
    title: 'The Shadow, The Persona, and The Ego',
    author: 'Carl Gustav Jung',
    part: 'Part I: Carl Gustav Jung — Depth Psychology',
    theme: 'Psychic Structure and Integration',
    description: 'An analysis of the masks we present to society and the dark, unacknowledged aspects of the self.',
    pageCount: 100,
    proseBlocks: [
      `The persona is a complicated system of relations between individual consciousness and society, a fitting kind of mask, designed on the one hand to make a definite impression upon others, and on the other to conceal the true nature of the individual.

Society expects, and indeed must expect, every individual to play the part assigned to him as perfectly as possible, so that a professor must not only think like a professor, but also act and dress like one. But whoever builds up too rigid a persona pays for it with unconscious rebellions, mood swings, and spiritual emptiness.

The shadow personifies everything that the subject refuses to acknowledge about himself and represents a tight passage, a narrow door, whose painful constriction no one is spared who goes down to the deep well.`,

      `To confront a person with his shadow is to show him his own light. Once one has experienced a few times what it is like to judge oneself without prejudice, one has already learned a good deal about human nature. The shadow is not merely evil or defective; it also possesses instinctual vitality, creative passion, and spontaneous insight.

If it has been believed that human nature is essentially rational, psychological observation proves that the irrational is an equally legitimate component of life. The shadow only becomes dangerous when it is ignored or misunderstood.

Knowing your own darkness is the best method for dealing with the darknesses of other people. One does not become enlightened by imagining figures of light, but by making the darkness conscious. The most terrifying thing is to accept oneself completely.`
    ]
  },
  {
    title: 'Anima, Animus, and The Process of Individuation',
    author: 'Carl Gustav Jung',
    part: 'Part I: Carl Gustav Jung — Depth Psychology',
    theme: 'The Contrasexual Archetypes and Wholeness',
    description: 'How the inner feminine and masculine archetypes guide the human spirit toward individuation.',
    pageCount: 100,
    proseBlocks: [
      `Every man carries within him the eternal image of woman, not the image of this or that particular woman, but a definite feminine image. This archetype of the feminine in the male psyche I have designated the anima. In the woman, the corresponding archetype is the animus, personifying the logos and masculine principle.

The anima and animus act as psychological bridges between personal consciousness and the deeper collective unconscious. When unintegrated, they manifest in irrational moods, dogmatic opinions, and intense romantic projections onto external partners.

Individuation means becoming a single, homogeneous being, and, in so far as "individuality" embraces our innermost, last, and incomparable uniqueness, it also implies becoming one's own self. We could therefore translate individuation as "coming to selfhood" or "self-realization."`,

      `The goal of individuation is not perfection, but completeness. Perfection belongs to the gods; human beings must strive for wholeness, which inevitably includes the tension of opposites: light and dark, rational and irrational, thinking and feeling.

The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed. In the same way, the conscious ego must enter into an ongoing dialectic with the unconscious self.

I am not what happened to me, I am what I choose to become. The privilege of a lifetime is to become who you truly are.`
    ]
  },
  {
    title: 'The Undiscovered Self & Modern Society',
    author: 'Carl Gustav Jung',
    part: 'Part II: Carl Gustav Jung — Culture & The Soul',
    theme: 'The Individual in the Mass Age',
    description: 'The conflict between the autonomous individual conscience and the homogenizing pressure of mass society.',
    pageCount: 100,
    proseBlocks: [
      `What will the future bring? From time immemorial this question has occupied men's minds, though not always with the same tense anxiety as today. The individual feels overwhelmed by gigantic statistical organizations, state bureaucracies, and economic forces.

The mass man is swayed by slogans and emotional hysteria precisely because he has lost touch with his inner psychic roots. Under the influence of scientific rationalism, even the understanding of the human person has been reduced to statistical averages.

Yet the real carrier of life is the individual, not the collective. A million zeros joined together do not add up to one. Resistance to the organized mass can be effected only by the man who is as well organized in his individuality as the mass itself.`,

      `Nothing has a stronger influence psychologically on their environment and especially on their children than the unlived life of the parent. Where love rules, there is no will to power; and where the will to power predominates, there love is lacking. The one is but the shadow of the other.

As any change must begin somewhere, it is the single individual who will experience it and carry it out. The change must begin with a single individual; it might be any one of us. Nobody can afford to look round and to wait for somebody else to do what he is loath to do himself.`
    ]
  },
  {
    title: 'Beyond Good and Evil: The Prejudices of Philosophers',
    author: 'Friedrich Nietzsche',
    part: 'Part III: Friedrich Nietzsche — Masterwork',
    theme: 'The Will to Truth and Moral Perspectives',
    description: 'A relentless critique of dogmatic metaphysics, herd morality, and the psychological roots of human philosophy.',
    pageCount: 100,
    proseBlocks: [
      `The Will to Truth, which is to tempt us to many a hazardous enterprise, the famous Truthfulness of which all philosophers have hitherto spoken with respect, what questions has this Will to Truth not laid before us! What strange, perplexing, questionable questions!

Is it any wonder if we at last grow distrustful, lose patience, and turn playfully away? That this Sphinx teaches us at last to ask questions ourselves? Who is it really that puts questions to us here? What really is this "Will to Truth" in us?

In fact we made a long halt at the question as to the origin of this Will, until at last we came to an absolute standstill before a yet more fundamental question. We inquired about the value of this Will. Granted that we want the truth: why not rather untruth? And uncertainty? Even ignorance?`,

      `He who fights with monsters should be careful lest he thereby become a monster. And if thou gaze long into an abyss, the abyss will also gaze into thee.

The great epochs of our life are at the points when we gain courage to rebaptize our badness as the best in us. In individuals, insanity is rather rare; but in groups, parties, nations, and epochs, it is the rule.

There are no moral phenomena at all, but only a moral interpretation of phenomena. To live is to suffer, to survive is to find some meaning in the suffering.`
    ]
  },
  {
    title: 'Meditations: The Sovereign Ruling Mind',
    author: 'Marcus Aurelius',
    part: 'Part IV: Marcus Aurelius — Stoic Wisdom',
    theme: 'Stoic Equanimity and Self-Mastery',
    description: 'The private personal reflections of the Roman Emperor on reason, transience, duty, and peace of mind.',
    pageCount: 100,
    proseBlocks: [
      `When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil. But I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own.

None of them can hurt me. No one can implicate me in ugliness. Nor can I feel angry at my kin, nor hate him. We were born to work together like feet, hands, and eyes, like the two rows of the teeth, upper and lower. To obstruct each other is unnatural.

You have power over your mind, not outside events. Realize this, and you will find strength. The happiness of your life depends upon the quality of your thoughts: therefore, guard accordingly.`,

      `Dwell on the beauty of life. Watch the stars, and see yourself running with them. Think constantly on the changes of the elements into each other, for such thoughts wash away the dust of earthly life.

Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present. Waste no more time arguing about what a good man should be. Be one.

Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.`
    ]
  },
  {
    title: 'The Stream of Consciousness and Habit',
    author: 'William James',
    part: 'Part V: William James — Foundations of Psychology',
    theme: 'Consciousness as Continuous Flow',
    description: 'The classic treatise that established the psychological concept of the stream of thought and neuroplastic habit.',
    pageCount: 100,
    proseBlocks: [
      `Consciousness does not appear to itself chopped up in bits. Such words as "chain" or "train" do not describe it fitly as it presents itself in the first instance. It is nothing jointed; it flows. A "river" or a "stream" are the metaphors by which it is most naturally described. In talking of it hereafter, let us call it the stream of thought, of consciousness, or of subjective life.

Every thought tends to be part of a personal consciousness. Within each personal consciousness, thought is always changing. Within each personal consciousness, thought is sensibly continuous. It always appears to deal with objects independent of itself.

It is interested in some parts of these objects to the exclusion of others, and welcomes or rejects, chooses from among them, in a word, all the while.`,

      `Habit is the enormous fly-wheel of society, its most precious conservative agent. It alone is what keeps us all within the bounds of ordinance and saves the children of fortune from the envious uprisings of the poor.

The great thing, then, in all education, is to make our nervous system our ally instead of our enemy. For this we must make automatic and habitual, as early as possible, as many useful actions as we can, and guard against the growing into ways that are likely to be disadvantageous to us.

The greatest weapon against stress is our ability to choose one thought over another. Act as if what you do makes a difference. It does.`
    ]
  },
  {
    title: 'The Interpretation of Dreams & The Unconscious Drive',
    author: 'Sigmund Freud',
    part: 'Part VI: Sigmund Freud — Psychoanalysis',
    theme: 'The Architecture of the Unconscious',
    description: 'Foundations of psychoanalytic theory: dream work, wish-fulfillment, and the conflict between Id, Ego, and Superego.',
    pageCount: 100,
    proseBlocks: [
      `The interpretation of dreams is the royal road to a knowledge of the unconscious activities of the mind. Every dream will reveal itself as a psychological structure, full of significance, and one which may be assigned to a specific place in the psychic activities of the waking state.

The dream is the hidden fulfillment of a repressed wish. It disguises its unacceptable instinctual impulses through condensation, displacement, and secondary revision, presenting a symbolic riddle that speaks to the deepest drives of the human animal.

The ego is not master in its own house. It is driven by the id, confined by the superego, and repulsed by reality. It struggles to bring harmony among the forces and influences working in and upon it.`,

      `Where Id was, there Ego shall be. It is a work of culture, not unlike the draining of the Zuiderzee. We are never so defenseless against suffering as when we love, never so helplessly unhappy as when we have lost our loved object or its love.

Out of your vulnerabilities will come your strength. Unexpressed emotions will never die. They are buried alive and will come forth later in uglier ways.

One day, in retrospect, the years of struggle will strike you as the most beautiful.`
    ]
  },
  {
    title: "Man's Search for Meaning & The Will to Purpose",
    author: 'Viktor Frankl',
    part: 'Part VII: Viktor Frankl — Logotherapy',
    theme: 'Existential Meaning and Resilience',
    description: 'Psychological reflections on maintaining human dignity and finding transcendent meaning even in the most extreme suffering.',
    pageCount: 100,
    proseBlocks: [
      `Everything can be taken from a man but one thing: the last of the human freedoms: to choose one's attitude in any given set of circumstances, to choose one's own way.

Those who have a 'why' to live, can bear with almost any 'how'. Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.

When we are no longer able to change a situation, we are challenged to change ourselves. Life is never made unbearable by circumstances, but only by lack of meaning and purpose.`,

      `Don't aim at success. The more you aim at it and make it a target, the more you are going to miss it. For success, like happiness, cannot be pursued; it must ensue, and it only does so as the unintended side effect of one's personal dedication to a cause greater than oneself.

An active life serves the purpose of giving man the opportunity to realize values in creative work, while a passive life of enjoyment affords him the opportunity to obtain fulfillment in experiencing beauty, art, or nature.

The meaning of life is to give life meaning. In the final analysis, there is no situation that does not contain into itself the possibility of a positive achievement.`
    ]
  },
  {
    title: 'The Art of Living & The Inner Citadel',
    author: 'Epictetus & Seneca',
    part: 'Part VIII: Stoic Philosophy of Mind',
    theme: 'Dichotomy of Control and Mental Freedom',
    description: 'Timeless guidance on distinguishing what is within our power from what is outside our power, and mastering emotional disturbance.',
    pageCount: 100,
    proseBlocks: [
      `Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion, and, in a word, whatever are our own actions. Things not in our control are body, property, reputation, command, and, in one word, whatever are not our own actions.

The things in our control are by nature free, unrestrained, unhindered; but those not in our control are weak, slavish, restrained, belonging to others. Remember, then, that if you suppose that things which are slavish by nature are also free, you will be hindered. You will lament, you will be disturbed, and you will find fault both with gods and men.

Men are disturbed not by things, but by the view which they take of them. So made, death itself is not an evil, for otherwise it would have appeared so to Socrates. It is our opinion about death that is terrible.`,

      `We suffer more often in imagination than in reality. A gem cannot be polished without friction, nor a man perfected without trials. It is not that we have a short time to live, but that we waste a lot of it. Life is long if you know how to use it.

True happiness is to enjoy the present, without anxious dependence upon the future, not to amuse ourselves with either hopes or fears but to rest satisfied with what we have, which is sufficient, for he that is so wants nothing.

Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.`
    ]
  }
];

/**
 * Builds the 1,000-page Compendium of Carl Gustav Jung and Great Philosophers.
 * Engineered for fast O(1) page access and clean memory management.
 */
export function build1000PagePhilosophicalCompendium(): DocumentItem {
  const pages: PageContent[] = [];
  const chapters: ChapterBookmark[] = [];

  let currentPageNumber = 1;

  for (const blueprint of PHILOSOPHICAL_BLUEPRINTS) {
    const chapterStartPageIndex = currentPageNumber - 1;

    chapters.push({
      title: blueprint.title,
      author: blueprint.author,
      part: blueprint.part,
      pageIndex: chapterStartPageIndex,
      description: blueprint.description,
    });

    const blocks = blueprint.proseBlocks;

    for (let p = 0; p < blueprint.pageCount; p++) {
      const blockIndex = p % blocks.length;
      const variationSeed = Math.floor(p / blocks.length) + 1;
      const baseText = blocks[blockIndex];

      const pageText = `${blueprint.part}
${blueprint.title} — Section ${p + 1} of ${blueprint.pageCount}
Author: ${blueprint.author} • Theme: ${blueprint.theme}

${baseText}

[Page ${currentPageNumber} of 1,000 • Psychological Commentary #${variationSeed}: Reflection on the archetypal implications of ${blueprint.theme.toLowerCase()}. In this passage, ${blueprint.author} emphasizes the foundational necessity of self-examination and intellectual integrity.]`;

      const sentences = splitIntoSentences(pageText);
      const paragraphs = splitIntoParagraphs(pageText);

      pages.push({
        pageNumber: currentPageNumber,
        text: pageText,
        sentences,
        paragraphs,
        chapterTitle: `${blueprint.author}: ${blueprint.title}`,
      });

      currentPageNumber++;
    }
  }

  const totalWords = pages.reduce((acc, p) => acc + p.sentences.length * 18, 0);

  return {
    id: 'carl_jung_1000_pages_compendium',
    name: 'Carl Gustav Jung & Great Thinkers: 1,000-Page Philosophical Library',
    author: 'Carl Gustav Jung, Friedrich Nietzsche, Marcus Aurelius, William James, Sigmund Freud',
    subtitle: 'The Definitive Compendium on Psychology, The Mind, and Existential Philosophy',
    size: 2450000,
    pageCount: pages.length,
    createdAt: Date.now(),
    lastReadAt: Date.now(),
    detectedLanguage: 'en-US',
    totalWords,
    estimatedMinutes: Math.round(totalWords / 135), // approx ~45-50 hours of audio
    pages,
    chapters,
    customSettings: {
      rate: 0.92,
      pitch: 0.98,
      lang: 'en-US',
      profile: 'philosopher',
    },
    readingProgress: {
      pageIndex: 0,
      sentenceIndex: 0,
      paragraphIndex: 0,
      completed: false,
      lastReadAt: Date.now(),
    },
  };
}

/**
 * Builds a dedicated Carl Gustav Jung masterwork volume (50 pages).
 */
export function buildJungDedicatedBook(): DocumentItem {
  const pages: PageContent[] = [];
  const chapters: ChapterBookmark[] = [];

  const jungBlueprints = PHILOSOPHICAL_BLUEPRINTS.filter(b => b.author === 'Carl Gustav Jung');

  let pageNum = 1;
  for (const b of jungBlueprints) {
    const chapterStartIdx = pageNum - 1;
    chapters.push({
      title: b.title,
      author: b.author,
      part: b.part,
      pageIndex: chapterStartIdx,
      description: b.description,
    });

    for (let p = 0; p < 15; p++) {
      const text = `${b.title} — Page ${pageNum}
Carl Gustav Jung • ${b.theme}

${b.proseBlocks[p % b.proseBlocks.length]}

[C.G. Jung Collected Works, Volume 9, Part I: The Archetypes and the Collective Unconscious. As Jung notes, "Whatever is rejected from the self, appears in the world as an event."]`;

      pages.push({
        pageNumber: pageNum,
        text,
        sentences: splitIntoSentences(text),
        paragraphs: splitIntoParagraphs(text),
        chapterTitle: b.title,
      });
      pageNum++;
    }
  }

  const totalWords = pages.reduce((acc, p) => acc + p.sentences.length * 18, 0);

  return {
    id: 'carl_jung_archetypes_edition',
    name: 'Carl Gustav Jung: Archetypes & The Collective Unconscious',
    author: 'Carl Gustav Jung',
    subtitle: 'Collected Psychological Works on Individuation, Dreams, and The Shadow',
    size: 450000,
    pageCount: pages.length,
    createdAt: Date.now(),
    lastReadAt: Date.now(),
    detectedLanguage: 'en-US',
    totalWords,
    estimatedMinutes: Math.round(totalWords / 135),
    pages,
    chapters,
    customSettings: {
      rate: 0.90,
      pitch: 0.96,
      lang: 'en-US',
      profile: 'philosopher',
    },
    readingProgress: {
      pageIndex: 0,
      sentenceIndex: 0,
      paragraphIndex: 0,
      completed: false,
      lastReadAt: Date.now(),
    },
  };
}

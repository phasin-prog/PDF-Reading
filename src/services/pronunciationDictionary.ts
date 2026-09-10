import {
  WordDefinition,
  DictionaryMeaningGroup,
  DictionaryDefinitionItem,
  PhoneticVariant,
  PronunciationOverride,
} from '../types';
import { vault } from './indexedDbVault';

export async function getUserPronunciationOverrides(): Promise<PronunciationOverride[]> {
  return await vault.getPronunciationOverrides();
}

export async function addUserPronunciationOverride(
  term: string,
  phoneticReplacement: string,
  customIpa?: string,
  note?: string
): Promise<void> {
  const override: PronunciationOverride = {
    id: `override_${term.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    term: term.trim(),
    phoneticReplacement: phoneticReplacement.trim(),
    customIpa: customIpa?.trim(),
    language: 'en-US',
    note: note?.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await vault.savePronunciationOverride(override);
}

export async function deleteUserPronunciationOverride(id: string): Promise<void> {
  await vault.deletePronunciationOverride(id);
}


/**
 * Curated offline dictionary for psychological, philosophical, and core English literature.
 * Provides instant IPA phonetics, syllable stress, part of speech breakdown,
 * "What it is" (มันคืออะไร) and "What it signifies" (คำนั้นสื่อถึงอะไร).
 */
const OFFLINE_DICTIONARY: Record<string, Partial<WordDefinition>> = {
  cw: {
    ipa: '/kəˈlɛk.tɪd wɜːrks/',
    syllables: ['col', 'lec', 'ted', 'works'],
    stressedSyllableIndex: 1,
    partOfSpeech: 'คำนามเฉพาะ / อักษรย่อวิชาการ (Proper Noun / Abbreviation)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นคำย่ออ้างอิงชุดผลงานนิพนธ์รวมเล่มฉบับสมบูรณ์ทางวิชาการ มักตามด้วยเลขเล่มหรือชื่อตอน',
    whatItIs: 'ตัวย่อของ "Collected Works" หมายถึง ผลงานนิพนธ์รวบรวมฉบับสมบูรณ์ทั้งหมด 20 เล่มของ คาร์ล กุสตาฟ จุง (Carl Gustav Jung: C.W. Vol. 1-20) ตีพิมพ์โดยสำนักพิมพ์ Routledge & Kegan Paul และ Princeton University Press (Bollingen Series)',
    whatItSignifies: 'สื่อถึงคลังปัญญาและรากฐานทฤษฎีจิตวิทยาวิเคราะห์ (Analytical Psychology) ทั้งหมดของจุง ซึ่งครอบคลุมการศึกษาเรื่องจิตไร้สำนึกร่วม, มโนภาพสากล (Archetypes), การตีความความฝัน, ปรัชญาการเล่นแร่แปรธาตุทางจิต และวิวัฒนาการทางจิตใจของมนุษยชาติ',
    definition: 'Collected Works of C.G. Jung: The comprehensive 20-volume definitive corpus of Jung\'s writings on analytical psychology and depth psychiatry.',
    thaiMeaning: 'ผลงานรวมเล่มสมบูรณ์ของ คาร์ล กุสตาฟ จุง (Collected Works of Jung)',
    philosophicalContext: 'Standard academic citation system: e.g., "CW 9i" refers to Archetypes and the Collective Unconscious.',
    sampleSentence: 'In the Collected Works of Jung, the symbol of the mandala represents psychic wholeness.',
  },
  jung: {
    ipa: '/jʊŋ/',
    syllables: ['jung'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนามเฉพาะ (Proper Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นประธานหรือผู้สร้างสำนักคิดในประโยควิชาการ',
    whatItIs: 'คาร์ล กุสตาฟ จุง (Carl Gustav Jung, 1875–1961) จิตแพทย์และนักจิตวิทยาเชิงลึกชาวสวิส ผู้ก่อตั้งสำนักจิตวิทยาวิเคราะห์ (Analytical Psychology)',
    whatItSignifies: 'สื่อถึงการก้าวข้ามจิตวิทยากายภาพแบบเดิมเข้าสู่การสำรวจมิติทางจิตวิญญาณ สัญลักษณ์ ความฝัน และจิตไร้สำนึกร่วม ซึ่งเชื่อมโยงมนุษยชาติเข้ากับอารยธรรมและตำนานดึกดำบรรพ์',
    definition: 'Swiss psychiatrist and psychoanalyst who founded analytical psychology, introducing concepts like the collective unconscious, archetypes, and individuation.',
    thaiMeaning: 'คาร์ล กุสตาฟ จุง (บิดาแห่งจิตวิทยาวิเคราะห์)',
    philosophicalContext: 'Pioneered the exploration of mythology, religion, alchemy, and quantum physics (with Pauli) in understanding human consciousness.',
    sampleSentence: 'Jung proposed that modern neurosis often stems from disconnection from the unconscious myth.',
  },
  archetype: {
    ipa: '/ˈɑːr.kɪ.taɪp/',
    syllables: ['ar', 'che', 'type'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นแกนหลักแสดงมโนทัศน์หรือแม่แบบพื้นฐานในจิตใจมนุษย์',
    whatItIs: 'แม่แบบหรือโครงร่างทางจิตดั้งเดิมที่ฝังอยู่ใน "จิตไร้สำนึกร่วม" (Collective Unconscious) ของมนุษย์ทุกคนตั้งแต่กำเนิด ถ่ายทอดทางวิวัฒนาการทางจิต',
    whatItSignifies: 'สื่อถึงพิมพ์เขียวทางจิตของมนุษยชาติ เช่น มโนภาพมารดาผู้หล่อเลี้ยง, วีรบุรุษ, เงามืด, ผู้เฒ่าปัญญาญาณ ซึ่งปรากฏซ้ำๆ ในความฝัน ตำนาน และศาสนาทั่วโลกโดยมิได้นัดหมาย',
    definition: 'An original model, prototype, or inherited cognitive schema in the collective unconscious.',
    thaiMeaning: 'แม่แบบทางจิตวิทยา, ภาพหรือความคิดดั้งเดิมในจิตไร้สำนึกร่วม',
    philosophicalContext: 'Key concept in C.G. Jung: Archetypes structure human perception, emotional patterns, and mythical narratives.',
    sampleSentence: 'The hero journey is a classic universal archetype found across all human cultures.',
  },
  shadow: {
    ipa: '/ˈʃæd.oʊ/',
    syllables: ['shad', 'ow'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นคำนามบอกองค์ประกอบทางจิตวิทยา หรือคำเปรียบเทียบเชิงสัญลักษณ์',
    whatItIs: 'ด้านมืดหรือมิติในบุคลิกภาพที่จิตสำนึก (Ego) ปฏิเสธ ไม่ยอมรับ หรือมองว่าเป็นจุดอ่อนและข้อบกพร่อง จึงถูกผลักดันลงไปเก็บไว้ในจิตไร้สำนึก',
    whatItSignifies: 'สื่อถึงสิ่งที่เราไม่ชอบในผู้อื่นแต่มักแฝงอยู่ในตัวเราเอง (ผ่านกลไกการฉายภาพ/Projection) และยังสื่อถึงพลังชีวิต สัญชาตญาณดิบ และความคิดสร้างสรรค์อันทรงพลังที่รอการบูรณาการให้เกิดความสมบูรณ์',
    definition: 'The unconscious aspects of personality that the conscious ego finds unacceptable, repressed, or incompatible.',
    thaiMeaning: 'เงามืด (ด้านมืดและสัญชาตญาณในจิตไร้สำนึกที่อีโก้ปฏิเสธ)',
    philosophicalContext: 'Jung stated: "One does not become enlightened by imagining figures of light, but by making the darkness conscious."',
    sampleSentence: 'Integrating one\'s shadow is the essential first step of psychological maturity.',
  },
  unconscious: {
    ipa: '/ʌnˈkɒn.ʃəs/',
    syllables: ['un', 'con', 'scious'],
    stressedSyllableIndex: 1,
    partOfSpeech: 'คำคุณศัพท์ / คำนาม (Adjective / Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นคำนามชี้ระนาบจิตใจ หรือเป็นคำคุณศัพท์ขยายกระบวนการที่ไม่อยู่ในระดับรับรู้',
    whatItIs: 'กระบวนการและเนื้อหาทางจิตใจทั้งหมดที่ดำเนินอยู่นอกเหนือการรับรู้ของจิตสำนึก ประกอบด้วยจิตไร้สำนึกส่วนบุคคล (Personal) และจิตไร้สำนึกร่วม (Collective)',
    whatItSignifies: 'สื่อถึงมหาสมุทรอันไพศาลทางจิตที่ขับเคลื่อนพฤติกรรม แรงจูงใจ ความฝัน และอารมณ์ความรู้สึกของเรา โดยที่อีโก้คิดว่าตนเองเป็นผู้ควบคุม แต่แท้จริงแล้วถูกชักใยโดยกระแสไร้สำนึก',
    definition: 'Processes in the mind that occur automatically and are not available to conscious introspection.',
    thaiMeaning: 'จิตไร้สำนึก, สภาวะที่อยู่นอกเหนือการตระหนักรู้',
    philosophicalContext: 'Jung distinguished between personal unconscious (repressed memories) and collective unconscious (shared archetypes).',
    sampleSentence: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
  },
  individuation: {
    ipa: '/ˌɪn.dɪ.vɪdʒ.uˈeɪ.ʃən/',
    syllables: ['in', 'di', 'vid', 'u', 'a', 'tion'],
    stressedSyllableIndex: 4,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นกระบวนการหรือเป้าหมายสูงสุดของการพัฒนาตนเองในทางจิตวิทยา',
    whatItIs: 'กระบวนการทางจิตวิทยาในการผสานรวมขั้วตรงข้าม (จิตสำนึกและจิตไร้สำนึก) เข้าด้วยกันอย่างกลมกลืน เพื่อให้มนุษย์เติบโตเป็นตัวตนที่แท้จริงและเป็นองค์รวม (The Self)',
    whatItSignifies: 'สื่อถึงการก้าวพ้นจากการเป็นเพียงหุ่นเชิดของค่านิยมสังคม (Persona) และการไม่ตกเป็นเหยื่อของเงามืด (Shadow) สู่การมีวุฒิภาวะทางจิตวิญญาณและการตื่นรู้ในอัตลักษณ์ที่แท้จริง',
    definition: 'The psychological process of integrating conscious and unconscious components into a harmonious wholeness.',
    thaiMeaning: 'กระบวนการบ่มเพาะความเป็นปัจเจกที่สมบูรณ์ (การผสานจิตสู่ความเป็นองค์รวม)',
    philosophicalContext: 'The teleological aim of Jungian depth psychology: becoming who one truly is.',
    sampleSentence: 'Individuation requires immense courage to confront inner illusions and projections.',
  },
  anima: {
    ipa: '/ˈæn.ɪ.mə/',
    syllables: ['an', 'i', 'ma'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นคำศัพท์เฉพาะทางแสดงแม่แบบมิติด้านจิตใจ',
    whatItIs: 'แม่แบบความเป็นหญิง (Feminine archetype) ที่สถิตอยู่ในจิตไร้สำนึกของผู้ชาย ทำหน้าที่เป็นสะพานเชื่อมระหว่างอีโก้กับจิตไร้สำนึกร่วม',
    whatItSignifies: 'สื่อถึงอารมณ์ความรู้สึก ความอ่อนโยน ปรีชาญาณทางสัญชาตญาณ และการเปิดรับมิติไร้สำนึก หากไม่รู้เท่าทัน มักถูกฉายภาพ (Project) ออกไปยังผู้หญิงในโลกภายนอกในรูปของความหลงใหลคลั่งไคล้',
    definition: 'The unconscious feminine archetype within the male psyche, governing emotional life and intuition.',
    thaiMeaning: 'อนิมา (มิติความเป็นหญิงในจิตไร้สำนึกของผู้ชาย)',
    philosophicalContext: 'Complement of the animus; serves as the psychopomp (guide of souls) leading into the unconscious.',
    sampleSentence: 'Projection of the anima often generates an idealized, ethereal image of the beloved.',
  },
  animus: {
    ipa: '/ˈæn.ɪ.məs/',
    syllables: ['an', 'i', 'mus'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นคำศัพท์เฉพาะทางแสดงแม่แบบจิตวิทยาในสตรี',
    whatItIs: 'แม่แบบความเป็นชาย (Masculine archetype) ที่สถิตอยู่ในจิตไร้สำนึกของผู้หญิง มักปรากฏในรูปของเสียงแห่งการตัดสิน ตรรกะ ความเชื่อมั่น หรือความมุ่งมั่น',
    whatItSignifies: 'สื่อถึงพลังแห่งการวิเคราะห์ การแยกแยะความจริง ความเด็ดขาด และความกล้าหาญในการกระทำ หากไม่บูรณาการอาจกลายเป็นความคิดเห็นที่ดื้อรั้นและอคติ แต่เมื่อผสานแล้วจะเสริมสร้างสติปัญญาอันเฉียบคม',
    definition: 'The unconscious masculine archetype in the female psyche, governing conviction, discrimination, and logos.',
    thaiMeaning: 'อนิมุส (มิติความเป็นชายในจิตไร้สำนึกของผู้หญิง)',
    philosophicalContext: 'When harmonized, the animus brings clarity of purpose and creative intellectual vigor.',
    sampleSentence: 'An integrated animus transforms inner self-criticism into creative discernment.',
  },
  persona: {
    ipa: '/pərˈsoʊ.nə/',
    syllables: ['per', 'so', 'na'],
    stressedSyllableIndex: 1,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นบทบาททางสังคมหรือภาพลักษณ์ภายนอก',
    whatItIs: 'หน้ากากทางสังคม (Social mask) ที่บุคคลสร้างขึ้นเพื่อปฏิสัมพันธ์กับสังคมภายนอก เพื่อให้ได้รับการยอมรับและปกป้องความเปราะบางภายในจิตใจ',
    whatItSignifies: 'สื่อถึงบทบาทหน้าที่ทางโลก เช่น บทบาทอาจารย์ หมอ ผู้นำ หรือพ่อแม่ แต่หากบุคคลหลงคิดว่าหน้ากากนั้นคือตัวตนที่แท้จริง จะนำไปสู่วิกฤตชีวิตและความว่างเปล่าทางวิญญาณ',
    definition: 'The social façade or public mask designed to make a definite impression and conceal the inner self.',
    thaiMeaning: 'หน้ากากทางสังคม, บุคลิกภาพภายนอกที่แสดงต่อโลก',
    philosophicalContext: 'Derived from Latin for theatrical masks. Essential for social living, but dangerous if identified with completely.',
    sampleSentence: 'He mistook his corporate persona for his true self, precipitating a midlife crisis.',
  },
  synchronicity: {
    ipa: '/ˌsɪŋ.krəˈnɪs.ɪ.ti/',
    syllables: ['syn', 'chron', 'i', 'ci', 'ty'],
    stressedSyllableIndex: 2,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นหลักการหรือปรากฏการณ์เชื่อมโยงเหตุการณ์',
    whatItIs: 'ปรากฏการณ์ความบังเอิญที่มีความหมายตรงกัน (Meaningful coincidence) ระหว่างเหตุการณ์ภายในจิตใจ (เช่น ความฝัน ความคิด) กับเหตุการณ์ภายนอก โดยไม่มีความสัมพันธ์เชิงเหตุและผลเชิงกายภาพ',
    whatItSignifies: 'สื่อถึงความเป็นหนึ่งเดียวกันของจักรวาลและจิตใจ (Unus Mundus) ชี้ให้เห็นว่าโลกกายภาพและจิตใจมิได้แยกขาดจากกัน แต่ถูกถักทอด้วยความหมายอันลึกซึ้ง',
    definition: 'The simultaneous occurrence of events that appear significantly related but have no discernible causal connection.',
    thaiMeaning: 'ความบังเอิญที่มีความหมายเชื่อมโยงกัน (สัญจารึกแห่งจิต)',
    philosophicalContext: 'Co-developed with quantum physicist Wolfgang Pauli as an acausal connecting principle.',
    sampleSentence: 'The arrival of the scarab beetle during a therapy session was Jung\'s celebrated instance of synchronicity.',
  },
  ego: {
    ipa: '/ˈiː.ɡoʊ/',
    syllables: ['e', 'go'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นศูนย์กลางของจิตสำนึกและการรับรู้ตนเอง',
    whatItIs: 'ศูนย์กลางของจิตสำนึก (Center of consciousness) ความรู้สึกว่า "ฉันคือใคร" ที่คอยบริหารจัดการชีวิตประจำวัน ความคิด และการตัดสินใจ',
    whatItSignifies: 'สื่อถึงเรือลำเล็กที่ลอยอยู่เหนือมหาสมุทรไร้สำนึก อีโก้มีความสำคัญต่อการเอาชีวิตรอด แต่ไม่ใช่ทั้งหมดของจิตใจ การยอมจำนนของอีโก้ต่อ Self คือหัวใจของการตื่นรู้',
    definition: 'The organized part of the personality structure that includes consciousness and the subjective sense of identity.',
    thaiMeaning: 'อัตตา, ตัวตนในระดับจิตสำนึก',
    philosophicalContext: 'Unlike Freud\'s mediator ego, Jung saw the ego as a subordinate complex serving the greater Self.',
    sampleSentence: 'A healthy ego is flexible enough to listen to the wisdom of the unconscious.',
  },
  stoicism: {
    ipa: '/ˈstoʊ.ɪ.sɪ.zəm/',
    syllables: ['sto', 'i', 'cism'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นชื่อสำนักคิดทางปรัชญาหรือวิถีชีวิต',
    whatItIs: 'สำนักปรัชญากรีก-โรมันโบราณที่มุ่งเน้นการฝึกจิตใจ ความมีคุณธรรม ปัญญา และความสงบนิ่งภายในท่ามกลางความผันผวนของโลก',
    whatItSignifies: 'สื่อถึงการแยกแยะสิ่งที่อยู่ในการควบคุม (ความคิด การกระทำ) ออกจากสิ่งที่อยู่นอกเหนือการควบคุม (โชคชะตา คนอื่น ความตาย) เพื่อบรรลุความสุขสงบที่แท้จริง (Ataraxia)',
    definition: 'An ancient Greek school of philosophy founded by Zeno of Citium, emphasizing virtue, reason, and emotional resilience.',
    thaiMeaning: 'ปรัชญาสโตอิก (การฝึกจิตให้สงบนิ่งและยอมรับความเป็นจริง)',
    philosophicalContext: 'Practiced by Marcus Aurelius, Seneca, and Epictetus; foundation of modern Cognitive Behavioral Therapy (CBT).',
    sampleSentence: 'Stoicism teaches that it is not events that upset us, but the judgments we form about them.',
  },
  logos: {
    ipa: '/ˈloʊ.ɡɒs/',
    syllables: ['lo', 'gos'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นมโนทัศน์สากลว่าด้วยปัญญาและระเบียบจักรวาล',
    whatItIs: 'หลักการแห่งเหตุผล กฎเกณฑ์ธรรมชาติ หรือวจนะแห่งปัญญาอันเป็นระเบียบที่ขับเคลื่อนจักรวาลและจิตใจมนุษย์',
    whatItSignifies: 'สื่อถึงความสามารถในการคิดอย่างมีเหตุผล ความชัดเจนแจ้งแห่งปัญญา และการมองเห็นระเบียบแบบแผนเบื้องหลังความสับสนวุ่นวายของชีวิต',
    definition: 'The divine reason implicit in the cosmos, ordering it and giving it form and meaning.',
    thaiMeaning: 'เหตุผลสากล, ระเบียบแห่งปัญญา, วจนะ',
    philosophicalContext: 'Heraclitus, Stoicism, and Jungian psychology: paired with Eros (relational feeling) as cosmic polarities.',
    sampleSentence: 'In the Stoic cosmos, human reason is a living spark of the universal Logos.',
  },
  catharsis: {
    ipa: '/kəˈθɑːr.sɪs/',
    syllables: ['ca', 'thar', 'sis'],
    stressedSyllableIndex: 1,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นกระบวนการปลดเปลื้องอารมณ์หรือการชำระล้างจิตใจ',
    whatItIs: 'กระบวนการปลดปล่อยและถ่ายเทพลังอารมณ์ที่อัดอั้นอยู่อย่างรุนแรงออกมา จนเกิดความโล่งใจและบริสุทธิ์ทางจิตวิญญาณ',
    whatItSignifies: 'สื่อถึงการเยียวยาบาดแผลทางจิตผ่านศิลปะ ละครโศกนาฏกรรม การร้องไห้ หรือการพูดคุยบำบัด เพื่อให้พลังงานทางจิตกลับมาไหลเวียนอย่างสมดุล',
    definition: 'The process of releasing, and thereby providing relief from, strong or repressed emotions.',
    thaiMeaning: 'การปลดปล่อยอารมณ์อัดอั้น, การชำระล้างจิตใจ',
    philosophicalContext: 'Aristotle introduced catharsis in Poetics as the purgation of pity and fear through dramatic tragedy.',
    sampleSentence: 'Writing down his suppressed grief brought profound psychological catharsis.',
  },
  self: {
    ipa: '/sɛlf/',
    syllables: ['self'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นมโนทัศน์สูงสุดแห่งความเป็นองค์รวมของจิต',
    whatItIs: 'ตัวตนองค์รวม (The Self: das Selbst) แก่นแกนหลักและมิติภาพรวมทั้งหมดของจิตใจมนุษย์ ทั้งส่วนจิตสำนึกและจิตไร้สำนึกรวมกัน',
    whatItSignifies: 'สื่อถึงพระเจ้าหรือพลังปัญญาภายในจิตใจของมนุษย์ (God-image within) มักแสดงออกในความฝันผ่านสัญลักษณ์รูปวงกลมมันดาลา (Mandala) หรือรูปทรงเรขาคณิตที่สมบูรณ์แบบ',
    definition: 'The archetype of wholeness and the regulating center of the entire psyche, transcending the ego.',
    thaiMeaning: 'ตัวตนองค์รวมที่แท้จริง (แก่นแกนสูงสุดของจิตใจ)',
    philosophicalContext: 'The supreme archetype of order and psychological integration in analytical psychology.',
    sampleSentence: 'The ego is only the center of consciousness, but the Self is the center of the total psyche.',
  },
  complex: {
    ipa: '/ˈkɒm.plɛks/',
    syllables: ['com', 'plex'],
    stressedSyllableIndex: 0,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นกลุ่มก้อนความทรงจำและอารมณ์ที่มีพลังในจิตไร้สำนึก',
    whatItIs: 'กลุ่มก้อนความคิด ความทรงจำ และความรู้สึกที่มีประจุอารมณ์รุนแรง (Feeling-toned complex) ที่เกาะกลุ่มอยู่รอบแม่แบบแกนกลาง',
    whatItSignifies: 'สื่อถึง "บุคลิกภาพย่อยอิสระ" ภายในตัวเราที่สามารถเข้าควบคุมการกระทำ อารมณ์ และคำพูดของเราได้ชั่วขณะเมื่อถูกสะกิดใจ (Triggered)',
    definition: 'An emotionally charged group of ideas or associations stored in the unconscious.',
    thaiMeaning: 'ปมทางจิตวิทยา (กลุ่มความคิดและอารมณ์ที่ถูกกระตุ้นได้ง่าย)',
    philosophicalContext: 'Jung began his career researching complexes via the Word Association Test.',
    sampleSentence: 'Everyone knows nowadays that people "have complexes"; what is not well known is that complexes can have us.',
  },
  projection: {
    ipa: '/prəˈdʒɛk.ʃən/',
    syllables: ['pro', 'jec', 'tion'],
    stressedSyllableIndex: 1,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นกลไกการทำงานทางจิตใจเพื่อปกป้องอีโก้',
    whatItIs: 'กลไกการป้องกันตนเองทางจิตที่บุคคลนำเอาความคิด อารมณ์ ปม หรือด้านมืดของตนเองไปโยนใส่หรือมองเห็นในตัวบุคคลภายนอก',
    whatItSignifies: 'สื่อถึงกระจกเงาแห่งจิตใจ สิ่งที่เราเกลียดกลัวหรือหลงใหลในตัวคนอื่น มักเป็นส่วนหนึ่งของจิตไร้สำนึกของเราเองที่กำลังสะท้อนกลับมา',
    definition: 'The unconscious transfer of one\'s own desires, traits, or impulses onto another person.',
    thaiMeaning: 'การฉายภาพทางจิต (การโยนความรู้สึกลึกๆ ภายในใส่ผู้อื่น)',
    philosophicalContext: 'Jung noted that all projection is unconscious; we only recognize it through conscious reflection.',
    sampleSentence: 'Extreme political hatred is often the mass projection of collective shadows.',
  },
  libido: {
    ipa: '/lɪˈbiː.doʊ/',
    syllables: ['li', 'bi', 'do'],
    stressedSyllableIndex: 1,
    partOfSpeech: 'คำนาม (Noun)',
    partOfSpeechDescription: 'ทำหน้าที่เป็นพลังขับเคลื่อนของชีวิตและจิตใจ',
    whatItIs: 'พลังงานชีวิตหรือพลังขับเคลื่อนทั่วไปของจิตใจมนุษย์ (General psychic energy)',
    whatItSignifies: 'สื่อถึงกระแสธารของพลังสร้างสรรค์ ความกระตือรือร้น และความปรารถนาในการเติบโต ซึ่งขับเคลื่อนทั้งศิลปะ วิทยาศาสตร์ และจิตวิญญาณ',
    definition: 'General psychic energy or life force driving human striving and creativity (Jungian definition).',
    thaiMeaning: 'พลังขับทางจิต, พลังชีวิต (จุงมองว่าเป็นพลังงานชีวิตโดยรวม ไม่ใช่เฉพาะเรื่องเพศ)',
    philosophicalContext: 'Freud restricted libido to sexual drive, causing the historic intellectual split with Jung.',
    sampleSentence: 'When creative libido is blocked, it recedes into the unconscious as symptoms.',
  },
};

// In-memory cache for API lookups to save network requests and enable offline reuse
const wordCache = new Map<string, WordDefinition>();

/**
 * Approximate English syllable breakdown using phonotactic vowel clustering.
 */
function breakIntoSyllables(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return [clean];

  // Match vowel groups
  const syllables: string[] = [];
  const regex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
  const matches = clean.match(regex);
  if (matches && matches.length > 0) {
    return matches;
  }
  return [clean];
}

/**
 * Fallback algorithmic IPA generator based on standard English grapheme-to-phoneme principles.
 */
function generateAlgorithmicIPA(word: string): { ipa: string; syllables: string[]; stressedIndex: number } {
  const lower = word.toLowerCase().trim();
  const syllables = breakIntoSyllables(lower);

  // Common suffix / prefix phonetic approximations
  let converted = lower
    .replace(/tion\b/g, 'ʃən')
    .replace(/sion\b/g, 'ʒən')
    .replace(/ch/g, 'tʃ')
    .replace(/sh/g, 'ʃ')
    .replace(/th/g, 'θ')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'kw')
    .replace(/oo/g, 'uː')
    .replace(/ee/g, 'iː')
    .replace(/ea/g, 'iː')
    .replace(/ai/g, 'eɪ')
    .replace(/ay/g, 'eɪ')
    .replace(/ou/g, 'aʊ')
    .replace(/ow\b/g, 'oʊ')
    .replace(/igh/g, 'aɪ');

  // Add primary stress mark on the penult or first syllable
  const stressedIndex = syllables.length > 2 ? 1 : 0;
  return {
    ipa: `/${converted}/`,
    syllables: syllables.length > 0 ? syllables : [lower],
    stressedIndex,
  };
}

/**
 * Fast lookup for word definition, IPA, syllable stress, and philosophical context.
 * 1. Checks memory cache
 * 2. Checks offline curated philosophical/psychological dictionary
 * 3. Attempts Free Dictionary API for full English definitions & audio
 * 4. Falls back gracefully to algorithmic IPA phonetics
 */
export async function lookupWord(rawWord: string): Promise<WordDefinition> {
  const clean = rawWord.toLowerCase().replace(/[^a-z'-]/g, '').trim();
  if (!clean) {
    return {
      word: rawWord,
      ipa: `/${rawWord}/`,
      syllables: [rawWord],
      stressedSyllableIndex: 0,
      partOfSpeech: 'word',
      definition: 'No definition available for symbols.',
      thaiMeaning: 'สัญลักษณ์หรือตัวเลข',
      source: 'phonetic-rule',
    };
  }

  // 1. Cache hit
  if (wordCache.has(clean)) {
    return wordCache.get(clean)!;
  }

  // 2. Offline Curated Dictionary Hit
  if (OFFLINE_DICTIONARY[clean]) {
    const item = OFFLINE_DICTIONARY[clean];
    const def: WordDefinition = {
      word: clean,
      ipa: item.ipa || `/${clean}/`,
      syllables: item.syllables || [clean],
      stressedSyllableIndex: item.stressedSyllableIndex ?? 0,
      partOfSpeech: item.partOfSpeech || 'คำนาม (Noun)',
      partOfSpeechDescription: item.partOfSpeechDescription || 'คำศัพท์เฉพาะทางในวรรณกรรมและปรัชญา',
      whatItIs: item.whatItIs || item.definition || 'แนวคิดหรือมโนทัศน์หลัก',
      whatItSignifies: item.whatItSignifies || item.philosophicalContext || 'สื่อถึงนัยสำคัญเชิงความหมายและจิตวิทยา',
      definition: item.definition || 'Philosophical or psychological concept.',
      thaiMeaning: item.thaiMeaning || 'แนวคิดทางปรัชญาและจิตวิทยา',
      philosophicalContext: item.philosophicalContext,
      sampleSentence: item.sampleSentence,
      source: 'offline',
    };
    wordCache.set(clean, def);
    return def;
  }

  // Helper to map part of speech
  const getThaiPosInfo = (pos: string) => {
    const lower = pos.toLowerCase();
    if (lower.includes('noun')) {
      return {
        label: 'คำนาม (Noun)',
        desc: 'ทำหน้าที่ระบุวัตถุ มโนทัศน์ บุคคล หรือสภาวะจิต เป็นประธานหรือกรรมของประโยค',
      };
    }
    if (lower.includes('verb')) {
      return {
        label: 'คำกริยา (Verb)',
        desc: 'แสดงการกระทำ ความเคลื่อนไหว สภาวะทางจิต หรือการเปลี่ยนแปลงในประโยค',
      };
    }
    if (lower.includes('adj')) {
      return {
        label: 'คำคุณศัพท์ (Adjective)',
        desc: 'ขยายคำนามเพื่อบ่งบอกคุณลักษณะ สภาพ หรือเฉดสีของความหมาย',
      };
    }
    if (lower.includes('adv')) {
      return {
        label: 'คำกริยาวิเศษณ์ (Adverb)',
        desc: 'ขยายกริยาหรือคุณศัพท์ บ่งบอกระดับ ความถี่ วิธีการ หรือกาลเทศะ',
      };
    }
    if (lower.includes('prep')) {
      return {
        label: 'คำบุพบท (Preposition)',
        desc: 'แสดงความสัมพันธ์เชิงพื้นที่ เวลา หรือตรรกะระหว่างองค์ประกอบในประโยค',
      };
    }
    if (lower.includes('conj')) {
      return {
        label: 'คำเชื่อม (Conjunction)',
        desc: 'เชื่อมวลี ประโยค หรือแนวคิดสองส่วนเข้าด้วยกัน',
      };
    }
    return {
      label: `ประเภทคำ: ${pos}`,
      desc: 'องค์ประกอบทางไวยากรณ์ในการเรียบเรียงโครงสร้างประโยค',
    };
  };

  // 3. Online Dictionary API
  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for online dictionary
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const phonetic =
            entry.phonetic ||
            entry.phonetics?.find((p: any) => p.text)?.text ||
            `/${clean}/`;

          // Collect all phonetic variants with audio recordings and accents
          const phoneticVariants: PhoneticVariant[] = [];
          if (Array.isArray(entry.phonetics)) {
            entry.phonetics.forEach((p: any) => {
              if (p.text || p.audio) {
                let accent = 'Standard';
                if (p.audio?.includes('-us')) accent = 'US';
                else if (p.audio?.includes('-uk')) accent = 'UK';
                else if (p.audio?.includes('-au')) accent = 'AU';
                phoneticVariants.push({
                  text: p.text || phonetic,
                  audio: p.audio || undefined,
                  accent,
                });
              }
            });
          }

          const primaryAudioObj = entry.phonetics?.find((p: any) => p.audio && p.audio.length > 0);
          const audioUrl = primaryAudioObj ? primaryAudioObj.audio : undefined;

          // Origin / Etymology if available
          const origin = entry.origin || undefined;

          // Parse meanings grouped by part of speech
          const meaningsList: DictionaryMeaningGroup[] = [];
          const allSynonymsSet = new Set<string>();
          const allAntonymsSet = new Set<string>();

          let primaryPos = 'noun';
          let primaryDef = 'Definition from English dictionary.';
          let sampleSentence: string | undefined;

          if (Array.isArray(entry.meanings)) {
            entry.meanings.forEach((m: any, idx: number) => {
              const posStr = m.partOfSpeech || 'noun';
              if (idx === 0) primaryPos = posStr;

              const defs: DictionaryDefinitionItem[] = [];
              if (Array.isArray(m.definitions)) {
                m.definitions.forEach((d: any, dIdx: number) => {
                  if (idx === 0 && dIdx === 0) {
                    primaryDef = d.definition;
                    if (d.example) sampleSentence = d.example;
                  }
                  defs.push({
                    definition: d.definition,
                    example: d.example || undefined,
                    synonyms: Array.isArray(d.synonyms) ? d.synonyms : undefined,
                    antonyms: Array.isArray(d.antonyms) ? d.antonyms : undefined,
                  });
                  if (Array.isArray(d.synonyms)) d.synonyms.forEach((s: string) => allSynonymsSet.add(s));
                  if (Array.isArray(d.antonyms)) d.antonyms.forEach((a: string) => allAntonymsSet.add(a));
                });
              }

              if (Array.isArray(m.synonyms)) m.synonyms.forEach((s: string) => allSynonymsSet.add(s));
              if (Array.isArray(m.antonyms)) m.antonyms.forEach((a: string) => allAntonymsSet.add(a));

              meaningsList.push({
                partOfSpeech: posStr,
                definitions: defs,
                synonyms: Array.isArray(m.synonyms) ? m.synonyms : undefined,
                antonyms: Array.isArray(m.antonyms) ? m.antonyms : undefined,
              });
            });
          }

          const posInfo = getThaiPosInfo(primaryPos);
          const syllables = breakIntoSyllables(clean);
          const synonymsList = Array.from(allSynonymsSet).slice(0, 12);
          const antonymsList = Array.from(allAntonymsSet).slice(0, 8);

          const result: WordDefinition = {
            word: clean,
            ipa: phonetic,
            syllables,
            stressedSyllableIndex: syllables.length > 1 ? 0 : 0,
            partOfSpeech: posInfo.label,
            partOfSpeechDescription: posInfo.desc,
            whatItIs: primaryDef,
            whatItSignifies: `คำนี้ทำหน้าที่สื่อความหมายในบริบท (${posInfo.label}) เพื่อเชื่อมโยงมโนทัศน์หรือองค์ประกอบความคิดในประโยค`,
            definition: primaryDef,
            thaiMeaning: primaryDef,
            sampleSentence,
            audioUrl,
            origin,
            meaningsList,
            phoneticVariants: phoneticVariants.length > 0 ? phoneticVariants : undefined,
            synonyms: synonymsList.length > 0 ? synonymsList : undefined,
            antonyms: antonymsList.length > 0 ? antonymsList : undefined,
            source: 'dictionary-api',
          };
          wordCache.set(clean, result);
          return result;
        }
      }
    } catch {
      // Fallback silently if offline or network error
    }
  }

  // 4. Algorithmic Fallback
  const rule = generateAlgorithmicIPA(clean);
  const fallbackDef: WordDefinition = {
    word: clean,
    ipa: rule.ipa,
    syllables: rule.syllables,
    stressedSyllableIndex: rule.stressedIndex,
    partOfSpeech: 'คำศัพท์ภาษาอังกฤษ (English Vocabulary)',
    partOfSpeechDescription: 'คำศัพท์ในบริบทวรรณกรรมและเอกสารการอ่าน',
    whatItIs: `คำศัพท์ภาษาอังกฤษ "${clean}" ในบริบทของเอกสาร`,
    whatItSignifies: `สื่อถึงความหมายเฉพาะในประโยคที่ผู้เขียนนำมาใช้เพื่อถ่ายทอดเนื้อหา`,
    definition: `General vocabulary word "${clean}".`,
    thaiMeaning: `คำศัพท์ภาษาอังกฤษ: ${clean}`,
    source: 'phonetic-rule',
  };
  wordCache.set(clean, fallbackDef);
  return fallbackDef;
}

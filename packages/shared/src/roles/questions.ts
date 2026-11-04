import type { LocalizedText } from '../types';

/** The role whose power uses these questions. */
export const GYPSY_ROLE_ID = 'gypsy';

/** How many questions the narrator reads out at a time. */
export const QUESTIONS_OFFERED = 4;

export interface GypsyQuestion {
  /** Stable forever (saved games refer to it); no commas, because the room stores them joined */
  id: string;
  text: LocalizedText;
}

/**
 * The Gypsy's questions. q01–q20 are those of the five Spiritualism cards of the New Moon
 * expansion, in card order, minus the two about the Sheriff (q04, q14), which this app has no role
 * for, and two a stranger can't answer (q15, q16); q21–q32 are our own, minus four that were too
 * alike or too hard to know (q21, q22, q23, q31). The English of the expansion's is the wording its booklet is quoted
 * with, and every Vietnamese text is our own translation, as no official one was found. The app
 * mixes them into one pool. Removed ids are never reused.
 *
 * A living player asks one aloud in the morning, and the first dead player, who has watched the
 * nights, answers yes or no. "I" is the player who asks. Some ask about what everyone can see
 * of the real people in the room, and the Witch and Seer ones need those roles in the game: the narrator skips
 * what doesn't fit the table.
 */
export const GYPSY_QUESTIONS: readonly GypsyQuestion[] = [
  {
    id: 'q01',
    text: {
      vi: 'Hai người tôi sắp chỉ có cùng phe không?',
      en: 'Are the 2 players I am going to point in the same camp?',
    },
  },
  {
    id: 'q02',
    text: {
      vi: 'Có ít nhất một Ma sói đeo kính không?',
      en: 'Does at least one Werewolf wear glasses?',
    },
  },
  { id: 'q03', text: { vi: 'Phù thủy có phải là nam không?', en: 'Is the Witch a man?' } },
  {
    id: 'q05',
    text: {
      vi: 'Có Ma sói nào đang mặc quần jeans không?',
      en: 'Is one of the Werewolves wearing jeans?',
    },
  },
  {
    id: 'q06',
    text: {
      vi: 'Có Ma sói nào đang mặc áo đen không?',
      en: 'Is one of the Werewolves wearing a black top?',
    },
  },
  {
    id: 'q07',
    text: {
      vi: 'Ngoài đời, tất cả Ma sói đều là nam phải không?',
      en: 'Are all the Werewolves men in real life?',
    },
  },
  {
    id: 'q08',
    text: {
      vi: 'Ngoài đời, tất cả Ma sói đều là nữ phải không?',
      en: 'Are all the Werewolves women in real life?',
    },
  },
  {
    id: 'q09',
    text: {
      vi: 'Tiên tri đã phát hiện được ít nhất một Ma sói chưa?',
      en: 'Did the Fortune Teller discover at least one Werewolf?',
    },
  },
  {
    id: 'q10',
    text: {
      vi: 'Có Ma sói nào ngồi cạnh nhau không?',
      en: 'Are some Werewolves next to each other?',
    },
  },
  {
    id: 'q11',
    text: {
      vi: 'Có Ma sói nào đeo ít nhất một món trang sức nhìn thấy được không?',
      en: 'Is a Werewolf wearing at least one visible piece of jewelry?',
    },
  },
  { id: 'q12', text: { vi: 'Tôi có phải là Ma sói không?', en: 'Am I a Werewolf?' } },
  { id: 'q13', text: { vi: 'Tôi có phải là Dân làng không?', en: 'Am I a Simple Villager?' } },
  {
    id: 'q17',
    text: { vi: 'Có Ma sói nào là nam không?', en: 'Is one of the Werewolves a man?' },
  },
  {
    id: 'q18',
    text: { vi: 'Có Ma sói nào là nữ không?', en: 'Is one of the Werewolves a woman?' },
  },
  {
    id: 'q19',
    text: {
      vi: 'Trong hai người ngồi cạnh người tôi chỉ, có ai là Ma sói không?',
      en: 'Is one of the 2 neighbors of the player I indicate a Werewolf?',
    },
  },
  {
    id: 'q20',
    text: {
      vi: 'Người tôi chỉ có phải là Dân làng không?',
      en: 'Is the player that I indicate a Simple Villager?',
    },
  },
  {
    id: 'q24',
    text: {
      vi: 'Người ngồi đối diện tôi có phải Ma sói không?',
      en: 'Is the player sitting across from me a Werewolf?',
    },
  },
  {
    id: 'q25',
    text: {
      vi: 'Trong ba người bên trái tôi có Ma sói không?',
      en: 'Is there a Werewolf among the three players on my left?',
    },
  },
  {
    id: 'q26',
    text: {
      vi: 'Trong ba người bên phải tôi có Ma sói không?',
      en: 'Is there a Werewolf among the three players on my right?',
    },
  },
  {
    id: 'q27',
    text: {
      vi: 'Người trẻ tuổi nhất bàn có phải Ma sói không?',
      en: 'Is the youngest player at the table a Werewolf?',
    },
  },
  {
    id: 'q28',
    text: {
      vi: 'Người lớn tuổi nhất bàn có phải Ma sói không?',
      en: 'Is the oldest player at the table a Werewolf?',
    },
  },
  {
    id: 'q29',
    text: { vi: 'Tôi có cùng phe với bạn không?', en: 'Am I on the same side as you?' },
  },
  {
    id: 'q30',
    text: {
      vi: 'Đã có ai dùng năng lực ban đêm lên tôi chưa?',
      en: 'Has anyone used a night power on me?',
    },
  },
  {
    id: 'q32',
    text: {
      vi: 'Có Ma sói nào đang đeo đồng hồ không?',
      en: 'Is one of the Werewolves wearing a watch?',
    },
  },
];

/** The questions on offer: the top of the deck. */
export function questionOffer(deck: readonly string[]): string[] {
  return deck.slice(0, QUESTIONS_OFFERED);
}

/**
 * The deck for the next night. It stays as it is until a question on offer is picked. Then the
 * offer goes to the bottom without the picked question, which never comes back.
 */
export function nextQuestionDeck(deck: readonly string[], picked: readonly string[]): string[] {
  const offer = questionOffer(deck);
  if (!offer.some((id) => picked.includes(id))) return [...deck];
  return [...deck.slice(QUESTIONS_OFFERED), ...offer.filter((id) => !picked.includes(id))];
}

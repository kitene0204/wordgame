import { VOCAB_DATA, VocabItem } from '../data/vocabData';
import { QuizQuestion, QuizQuestionType, SubjectType } from '../types';

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuizQuestions(subject: SubjectType, count: number): QuizQuestion[] {
  let pool = VOCAB_DATA;
  if (subject !== '전체') {
    pool = VOCAB_DATA.filter((item) => item.subject === subject);
  }

  // Fallback if requested count is larger than pool
  const actualCount = Math.min(count, pool.length);
  const shuffledVocab = shuffle(pool).slice(0, actualCount);
  const types: QuizQuestionType[] = ['hanjaToWord', 'wordToHanja', 'meaningToWord', 'wordToMeaning'];

  return shuffledVocab.map((item, index) => {
    const type = types[Math.floor(Math.random() * types.length)];
    let questionTitle = '';
    let questionHighlight = '';
    let correctOption = '';
    const wrongOptionsPool = pool.filter((v) => v.word !== item.word);
    let options: string[] = [];

    switch (type) {
      case 'hanjaToWord':
        questionTitle = '다음 한자의 음(낱말)은 무엇일까요?';
        questionHighlight = `[ ${item.hanja} ]`;
        correctOption = item.word;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.word)];
        break;

      case 'wordToHanja':
        questionTitle = '다음 낱말에 알맞은 한자는 무엇일까요?';
        questionHighlight = `[ ${item.word} ]`;
        correctOption = item.hanja;
        const uniqueHanjas = Array.from(new Set(wrongOptionsPool.map((v) => v.hanja)));
        options = [correctOption, ...shuffle(uniqueHanjas).slice(0, 3)];
        break;

      case 'meaningToWord':
        questionTitle = '다음 뜻을 가진 알맞은 낱말은 무엇일까요?';
        questionHighlight = `"${item.meaning}"`;
        correctOption = item.word;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.word)];
        break;

      case 'wordToMeaning':
        questionTitle = '다음 낱말의 올바른 뜻은 무엇일까요?';
        questionHighlight = `[ ${item.word} ]`;
        correctOption = item.meaning;
        options = [correctOption, ...shuffle(wrongOptionsPool).slice(0, 3).map((v) => v.meaning)];
        break;
    }

    return {
      id: `q_${index + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      item,
      questionTitle,
      questionHighlight,
      options: shuffle(options),
      correctOption,
    };
  });
}

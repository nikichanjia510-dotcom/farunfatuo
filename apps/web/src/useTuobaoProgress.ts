// apps/web/src/useTuobaoProgress.ts
import { useCallback, useEffect, useState } from 'react';

export type AgeLevel = '0-3' | '3-6' | '6-12';

interface ProgressState {
  userAgeLevel: AgeLevel | null;
  signLastDate: string; // YYYY-MM-DD
  signContinuousDays: number;
  signTotalDays: number;
  dailyLawArticleNo: string;
  dailyLawText: string;
  signHistoryList: Array<{
    date: string;
    articleNo: string;
    lawText: string;
    recordBlob: Blob | null;
  }>;
}

const defaultState: ProgressState = {
  userAgeLevel: null,
  signLastDate: '',
  signContinuousDays: 0,
  signTotalDays: 0,
  dailyLawArticleNo: '',
  dailyLawText: '',
  signHistoryList: [],
};

// 获取今日日期字符串 YYYY-MM-DD
function getTodayStr(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// 判断昨天日期
function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function getDailyLawByAge(ageLevel: AgeLevel) {
  const lawArticleNo = '第18条';
  let lawText = '托育机构应当建立安全管理制度，保障婴幼儿人身安全。';

  if (ageLevel === '0-3') {
    lawText = '托育机构要时刻保护小宝宝的人身安全，确保活动环境和照护过程都更安全。';
  } else if (ageLevel === '3-6') {
    lawText = '托育机构应当保护婴幼儿的人身安全，建立完善的安全管理制度。';
  }

  return { lawArticleNo, lawText };
}

export function useTuobaoProgress() {
  const [state, setState] = useState<ProgressState>(() => {
    try {
      const stored = localStorage.getItem('tuobao-progress');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ProgressState>;
        return {
          ...defaultState,
          ...parsed,
          dailyLawArticleNo: parsed.userAgeLevel ? getDailyLawByAge(parsed.userAgeLevel).lawArticleNo : parsed.dailyLawArticleNo ?? '',
          dailyLawText: parsed.userAgeLevel ? getDailyLawByAge(parsed.userAgeLevel).lawText : parsed.dailyLawText ?? '',
        };
      }
    } catch {}
    return defaultState;
  });

  // 持久化到 localStorage
  useEffect(() => {
    localStorage.setItem('tuobao-progress', JSON.stringify(state));
  }, [state]);

  // 设置年龄段
  const setAgeLevel = useCallback((level: AgeLevel) => {
    const dailyLaw = getDailyLawByAge(level);
    setState(prev => ({
      ...prev,
      userAgeLevel: level,
      dailyLawArticleNo: dailyLaw.lawArticleNo,
      dailyLawText: dailyLaw.lawText,
    }));
  }, []);

  // 获取今日法条（演示版：使用固定文案，正式版可由后端接口返回）
  const fetchDailyLaw = useCallback((ageLevel: AgeLevel) => getDailyLawByAge(ageLevel), []);

  // 完成打卡（接收录音 blob）
  const completeSignIn = useCallback((recordBlob: Blob) => {
    const today = getTodayStr();

    setState(prev => {
      if (prev.signLastDate === today) {
        return prev;
      }

      const fallbackLaw = getDailyLawByAge(prev.userAgeLevel ?? '3-6');
      const todayLaw = prev.dailyLawArticleNo && prev.dailyLawText
        ? { articleNo: prev.dailyLawArticleNo, text: prev.dailyLawText }
        : { articleNo: fallbackLaw.lawArticleNo, text: fallbackLaw.lawText };

      const isContinuous = prev.signLastDate === getYesterdayStr();
      const newContinuousDays = isContinuous ? prev.signContinuousDays + 1 : 1;

      const newEntry = {
        date: today,
        articleNo: todayLaw.articleNo,
        lawText: todayLaw.text,
        recordBlob,
      };

      return {
        ...prev,
        dailyLawArticleNo: todayLaw.articleNo,
        dailyLawText: todayLaw.text,
        signLastDate: today,
        signContinuousDays: newContinuousDays,
        signTotalDays: prev.signTotalDays + 1,
        signHistoryList: [...prev.signHistoryList, newEntry],
      };
    });
  }, []);

  // 判断今日是否已经打卡
  const hasSignedToday = state.signLastDate === getTodayStr();

  return {
    state,
    setAgeLevel,
    fetchDailyLaw,
    completeSignIn,
    hasSignedToday,
  };
}
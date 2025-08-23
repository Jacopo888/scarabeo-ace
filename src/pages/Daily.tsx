import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DailyPuzzle {
  yyyymmdd: number;
  board: any[];
  rack: any[];
  bestScoreToBeat: number;
}

interface LeaderboardEntry {
  userId: string;
  score: number;
}

const Daily = () => {
  const { data } = useSWR<DailyPuzzle>('/api/daily', fetcher);
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const doneKey = data ? `daily:${data.yyyymmdd}:done` : '';

  useEffect(() => {
    if (data && localStorage.getItem(doneKey)) {
      setSubmitted(true);
    }
  }, [data, doneKey]);

  const submit = async () => {
    if (!data) return;
    const s = word.length;
    setScore(s);
    setSubmitted(true);
    localStorage.setItem(doneKey, 'true');
    try {
      await fetch('/api/daily/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'anon', score: s }),
      });
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    if (!data || score == null) return;
    const text = `Daily ${data.yyyymmdd}: ${score} points`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const { data: leaderboard } = useSWR<LeaderboardEntry[]>(
    submitted && data ? `/api/daily/leaderboard?yyyymmdd=${data.yyyymmdd}&limit=10` : null,
    fetcher
  );

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      {!submitted && (
        <div className="space-y-2">
          <p>Best score to beat: {data.bestScoreToBeat}</p>
          <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Your play" />
          <Button onClick={submit}>Submit</Button>
        </div>
      )}

      {submitted && (
        <div className="space-y-4">
          <p>Your score: {score}</p>
          <Button onClick={share}>Share</Button>
          <div>
            <h3 className="font-semibold mb-2">Leaderboard</h3>
            <ul className="space-y-1">
              {leaderboard?.map((entry, i) => (
                <li key={i}>
                  {entry.userId}: {entry.score}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Daily;

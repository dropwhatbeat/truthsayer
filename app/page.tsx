import AbsurdTruthsGame from '@/components/absurd-truths/AbsurdTruthsGame'
import { Analytics } from '@vercel/analytics/next';


export default function Home() {
  return (
    <>
      <AbsurdTruthsGame />
      <Analytics />
    </>
  )
}

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import PhoneFrame from './components/PhoneFrame.jsx';
import Header from './components/Header.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import PrepRoom from './screens/PrepRoom.jsx';
import StageScreen from './screens/StageScreen.jsx';
import ReviewScreen from './screens/ReviewScreen.jsx';

const INITIAL_INPUT = {
  nativeThought: '',
  imageDataUrl: '',
  imageName: ''
};

const STEP_BY_PATH = {
  '/': 'home',
  '/prep': 'prep',
  '/stage': 'stage',
  '/review': 'review'
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const step = STEP_BY_PATH[location.pathname] || 'home';
  const [hookInput, setHookInput] = useState(INITIAL_INPUT);
  const [cueCards, setCueCards] = useState([]);
  const [intent, setIntent] = useState('');
  const [transcript, setTranscript] = useState('');
  const [attempt, setAttempt] = useState(1);

  const startPrep = (input) => {
    setHookInput(input);
    setCueCards([]);
    setIntent('');
    setTranscript('');
    setAttempt(1);
    navigate('/prep');
  };

  const takeTwo = () => {
    setTranscript('');
    setAttempt((current) => current + 1);
    navigate('/stage');
  };

  return (
    <main className="min-h-screen overflow-hidden bg-black text-gray-100">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(157,78,221,0.24),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(0,240,255,0.16),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,45,149,0.11),transparent_24%),linear-gradient(145deg,#000000,#09090B_54%,#000000)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:36px_36px] opacity-25" />
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px]" />

      <section className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <PhoneFrame>
          <Header step={step} />
          <AnimatePresence mode="wait">
            {step === 'home' && <HomeScreen key="home" onSubmit={startPrep} />}
            {step === 'prep' && (
              <PrepRoom
                key="prep"
                input={hookInput}
                cueCards={cueCards}
                intent={intent}
                onCardsChange={setCueCards}
                onIntentChange={setIntent}
                onReady={() => navigate('/stage')}
              />
            )}
            {step === 'stage' && (
              <StageScreen
                key={`stage-${attempt}`}
                attempt={attempt}
                cueCards={cueCards}
                intent={intent}
                onComplete={(spokenTranscript) => {
                  setTranscript(spokenTranscript);
                  navigate('/review');
                }}
              />
            )}
            {step === 'review' && (
              <ReviewScreen
                key="review"
                cueCards={cueCards}
                transcript={transcript}
                intent={intent}
                onTakeTwo={takeTwo}
              />
            )}
          </AnimatePresence>
        </PhoneFrame>
      </section>
    </main>
  );
}

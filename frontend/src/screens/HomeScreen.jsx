import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Camera, ImagePlus, Search, Sparkles, X } from 'lucide-react';
import MicButton from '../components/MicButton.jsx';
import { pageTransition } from '../lib/motion.js';

export default function HomeScreen({ onSubmit }) {
  const { t, i18n } = useTranslation();
  const [nativeThought, setNativeThought] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const submit = () => {
    onSubmit({
      nativeThought: nativeThought.trim() || t('home.defaultThought'),
      imageDataUrl,
      imageName
    });
  };

  const startSpeechInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setNotice(t('home.speechUnsupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setNotice(t('home.speechError'));
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript)
        .filter(Boolean)
        .join(' ');
      setNativeThought((current) => [current, transcript].filter(Boolean).join(' '));
    };
    recognition.start();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);
    } catch {
      setNotice(t('home.cameraError'));
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setImageDataUrl(canvas.toDataURL('image/jpeg', 0.84));
    setImageName(t('home.cameraImageName'));
    stopCamera();
  };

  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.section
      className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-6"
      {...pageTransition}
    >
      <div className="pointer-events-none absolute inset-x-0 top-10 h-64 bg-[radial-gradient(circle,rgba(0,240,255,0.1),transparent_62%)]" />
      <div className="relative flex flex-1 flex-col justify-between gap-5">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cue-cyan">
            <Sparkles size={13} />
            {t('home.eyebrow')}
          </p>
          <h2 className="mt-3 text-[38px] font-black leading-[0.96] tracking-tight text-gray-100">{t('home.title')}</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{t('home.subtitle')}</p>
        </div>

        <MicButton active={listening} activeText={t('home.micActive')} idleText={t('home.micIdle')} label={t('home.micLabel')} onClick={startSpeechInput} />

        <div className="space-y-3">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-2.5 shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-xl focus-within:border-cue-cyan/45">
            <label className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500" htmlFor="native-thought">
              <Search size={14} />
              {t('home.inputLabel')}
            </label>
            <textarea
              className="h-24 w-full resize-none rounded-[22px] border border-white/5 bg-black/35 px-4 py-3 text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-600"
              id="native-thought"
              onChange={(event) => setNativeThought(event.target.value)}
              placeholder={t('home.inputPlaceholder')}
              value={nativeThought}
            />
          </div>

          {imageDataUrl && (
            <motion.div
              className="flex items-center gap-3 rounded-2xl border border-cue-cyan/20 bg-cue-cyan/10 p-2 backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <img alt={t('home.imageAlt')} className="h-14 w-14 rounded-xl object-cover" src={imageDataUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-100">{imageName}</p>
                <p className="text-xs text-cue-cyan">{t('home.imageReady')}</p>
              </div>
            </motion.div>
          )}

          {notice && <p className="text-xs text-cue-pink">{notice}</p>}

          <div className="grid grid-cols-3 gap-2">
            <motion.button className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold text-gray-100 backdrop-blur-xl" onClick={openCamera} type="button" whileTap={{ scale: 0.96 }}>
              <Camera size={15} />
              {t('home.camera')}
            </motion.button>
            <motion.button className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold text-gray-100 backdrop-blur-xl" onClick={() => fileRef.current?.click()} type="button" whileTap={{ scale: 0.96 }}>
              <ImagePlus size={15} />
              {t('home.gallery')}
            </motion.button>
            <motion.button className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-cue-purple to-cue-cyan px-3 py-3 text-xs font-black text-black shadow-neon" onClick={submit} type="button" whileTap={{ scale: 0.96 }}>
              {t('home.submit')}
              <ArrowRight size={15} />
            </motion.button>
          </div>
          <input ref={fileRef} accept="image/*" className="hidden" onChange={uploadImage} type="file" />
        </div>
      </div>

      {cameraOpen && (
        <motion.div className="absolute inset-0 z-40 flex flex-col bg-black/95 p-5 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-gray-100">{t('home.cameraTitle')}</p>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-100" onClick={stopCamera} type="button" aria-label={t('common.close')}>
              <X size={16} />
            </button>
          </div>
          <video ref={videoRef} autoPlay className="mt-5 min-h-0 flex-1 rounded-3xl border border-white/10 object-cover" playsInline />
          <button className="mt-4 rounded-2xl bg-gradient-to-r from-cue-purple to-cue-cyan py-4 text-sm font-black text-black shadow-neon" onClick={takePhoto} type="button">
            {t('home.snap')}
          </button>
        </motion.div>
      )}
    </motion.section>
  );
}

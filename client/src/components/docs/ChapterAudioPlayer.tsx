import { Loader2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import "./chapterAudioPlayer.css";

type ChapterAudioPlayerProps = { slug: string; title: string };

const formatTime = (time: number) => `${Math.floor(time / 60).toString().padStart(2, "0")}:${Math.floor(time % 60).toString().padStart(2, "0")}`;

export function ChapterAudioPlayer({ slug, title }: ChapterAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [rate, setRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const listener = trpc.chapterAudio.get.useMutation();

  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePlayback = async () => {
    if (audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { await audioRef.current.play(); setPlaying(true); }
      return;
    }
    const result = await listener.mutateAsync({ slug });
    if (result.status === "unconfigured") { toast.info(result.message); return; }
    const audio = new Audio(result.audioUrl);
    audio.playbackRate = rate;
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => { setPlaying(false); setCurrentTime(0); });
    audioRef.current = audio;
    setVisible(true);
    await audio.play();
    setPlaying(true);
    toast.success(result.cached ? "Loaded saved chapter audio." : "Chapter audio is ready.");
  };

  const close = () => { audioRef.current?.pause(); audioRef.current = null; setVisible(false); setPlaying(false); setCurrentTime(0); setDuration(0); };
  const cycleRate = () => { const next = rate === .75 ? 1 : rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : .75; setRate(next); if (audioRef.current) audioRef.current.playbackRate = next; };
  const toggleMute = () => { const next = !muted; setMuted(next); if (audioRef.current) audioRef.current.muted = next; };

  return <>
    <button className="flashdocs-listen-button" type="button" onClick={() => void togglePlayback()} disabled={listener.isPending} aria-busy={listener.isPending} aria-live="polite">
      {listener.isPending ? <Loader2 className="flashdocs-listen-button__spinner" size={15} /> : playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />} {listener.isPending ? "Preparing audio" : playing ? "Pause listening" : "Listen to chapter"}
    </button>
    {visible && <aside className="flashdocs-audio-player" aria-label="Chapter audio player">
      <div className="flashdocs-audio-player__title"><span>NOW PLAYING / TTS</span><b>{title}</b></div>
      <button type="button" className="flashdocs-audio-close" onClick={close} aria-label="Close audio player"><X size={16} /></button>
      <button type="button" className="flashdocs-audio-play" onClick={() => void togglePlayback()} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
      <div className="flashdocs-audio-progress"><input aria-label="Seek chapter audio" type="range" min="0" max={duration || 0} value={currentTime} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setCurrentTime(next); }} /><span>{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span></div>
      <button className="flashdocs-audio-utility" type="button" onClick={cycleRate}>{rate}x</button>
      <button className="flashdocs-audio-utility" type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
    </aside>}
  </>;
}

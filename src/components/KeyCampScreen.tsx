import { useCallback, useEffect, useRef, useState } from "react";
import { audio } from "../audio/audio";
import { classifyKey } from "../game/input";
import { KEY_CAMP_LESSONS } from "../game/keyCampLessons";
import { KeyboardGuide } from "./KeyboardGuide";

interface Props {
  onExit: () => void;
  onOpenSettings: () => void;
}

/** A private, no-score tutor that teaches home-row posture before words. */
export function KeyCampScreen({ onExit, onOpenSettings }: Props) {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [slowGuidance, setSlowGuidance] = useState(false);
  const [message, setMessage] = useState("Follow the highlighted key when you are ready.");
  const containerRef = useRef<HTMLDivElement>(null);
  const lesson = KEY_CAMP_LESSONS[lessonIndex];
  const prompt = lesson?.prompts[promptIndex] ?? "";
  const nextKey = prompt[typed] ?? prompt[0] ?? "a";
  const complete = !lesson;

  const resetLesson = useCallback(() => {
    setPromptIndex(0);
    setTyped(0);
    setMessage("Let’s take this lesson from the beginning.");
  }, []);

  const nextLesson = useCallback(() => {
    setLessonIndex((index) => index + 1);
    setPromptIndex(0);
    setTyped(0);
    setMessage("A new lesson is ready when you are.");
  }, []);

  useEffect(() => containerRef.current?.focus(), []);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    const action = classifyKey(event.nativeEvent, { allowSemicolon: true });
    if (action.kind === "escape") {
      event.preventDefault();
      onExit();
      return;
    }
    if (action.kind !== "char" || complete) {
      if (action.kind === "space") event.preventDefault();
      return;
    }
    event.preventDefault();
    if (action.char !== nextKey) {
      audio.play("wrong");
      setMessage(`Try the highlighted key: ${nextKey.toUpperCase()}.`);
      return;
    }
    audio.play("correct");
    const nextTyped = typed + 1;
    if (nextTyped < prompt.length) {
      setTyped(nextTyped);
      setMessage(slowGuidance ? `Nice. Next, try ${prompt[nextTyped].toUpperCase()} with the highlighted finger.` : "Nice. Keep going.");
      return;
    }
    if (promptIndex + 1 < lesson.prompts.length) {
      const nextPrompt = lesson.prompts[promptIndex + 1];
      setPromptIndex(promptIndex + 1);
      setTyped(0);
      setMessage(`Nice! Next prompt: ${nextPrompt}.`);
      return;
    }
    audio.play("complete");
    nextLesson();
  }, [complete, lesson, nextKey, nextLesson, onExit, prompt, promptIndex, slowGuidance, typed]);

  return (
    <div ref={containerRef} className="screen key-camp-screen" tabIndex={0} onKeyDown={onKeyDown} aria-label="Key Camp typing tutor">
      <header className="key-camp-header">
        <div><span className="practice-kicker">Untimed typing tutor</span><strong>Key Camp</strong></div>
        <div className="button-row">
          <button className="btn btn-small" onClick={onOpenSettings}>Settings</button>
          <button className="btn btn-small" onClick={onExit}>Exit Key Camp</button>
        </div>
      </header>
      <main className="key-camp-main">
        {complete ? (
          <div className="menu-card key-camp-complete">
            <h1>Key Camp complete!</h1>
            <p>You practised posture, finger hints, letters, and short words. You can return any time.</p>
            <div className="button-col"><button className="btn btn-primary" onClick={() => { setLessonIndex(0); resetLesson(); }}>Start Again</button><button className="btn" onClick={onExit}>Return Home</button></div>
          </div>
        ) : (
          <>
            <p className="eyebrow">Lesson {lessonIndex + 1} of {KEY_CAMP_LESSONS.length}</p>
            <h1>{lesson.title}</h1>
            <p>{lesson.instruction}</p>
            <p className="key-camp-progress">Prompt {promptIndex + 1} of {lesson.prompts.length}</p>
            <div className="key-camp-target" aria-live="polite">
              {prompt.split("").map((character, index) => <span key={`${character}-${index}`} className={index < typed ? "typed" : index === typed ? "next" : ""}>{character}</span>)}
            </div>
            <KeyboardGuide nextKey={nextKey} />
            <p className="practice-hint" role="status">{message}</p>
            <div className="button-row key-camp-controls">
              <button className="btn" onClick={resetLesson}>Repeat Lesson</button>
              <button className="btn" onClick={nextLesson}>Skip Lesson</button>
              <button className={`btn${slowGuidance ? " btn-primary" : ""}`} onClick={() => setSlowGuidance((slow) => !slow)} aria-pressed={slowGuidance}>
                {slowGuidance ? "Slow Guidance On" : "Use Slow Guidance"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

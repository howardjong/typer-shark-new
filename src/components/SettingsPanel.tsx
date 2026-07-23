import { useState } from "react";
import type { Settings } from "../state/settings";

interface Props {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, updateSettings, onResetProgress, onClose }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="menu-card settings-card">
        <h1>Settings</h1>

        <div className="setting-row">
          <label htmlFor="set-text">Text size</label>
          <select
            id="set-text"
            value={settings.textSize}
            onChange={(e) => updateSettings({ textSize: e.target.value as Settings["textSize"] })}
          >
            <option value="default">Default</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="setting-row">
          <label htmlFor="set-contrast">Contrast</label>
          <select
            id="set-contrast"
            value={settings.contrast}
            onChange={(e) => updateSettings({ contrast: e.target.value as Settings["contrast"] })}
          >
            <option value="standard">Standard</option>
            <option value="extra">Extra Contrast</option>
          </select>
        </div>

        <div className="setting-row">
          <label htmlFor="set-motion">Speed</label>
          <select
            id="set-motion"
            value={settings.motion}
            onChange={(e) => updateSettings({ motion: e.target.value as Settings["motion"] })}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
        <p className="hint-text">Speed changes start after the next countdown.</p>

        <div className="setting-row">
          <label htmlFor="set-master">Master volume</label>
          <input
            id="set-master"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.masterVolume * 100)}
            onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) / 100 })}
          />
        </div>
        <div className="setting-row">
          <label htmlFor="set-sfx">Sound effects</label>
          <input
            id="set-sfx"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.sfxVolume * 100)}
            onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) / 100 })}
          />
        </div>
        <div className="setting-row">
          <label htmlFor="set-music">Music</label>
          <input
            id="set-music"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.musicVolume * 100)}
            onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) / 100 })}
          />
        </div>

        <div className="setting-row">
          <label htmlFor="set-captions">Sound captions</label>
          <input
            id="set-captions"
            type="checkbox"
            checked={settings.captions}
            onChange={(e) => updateSettings({ captions: e.target.checked })}
          />
        </div>

        <div className="setting-row">
          <label htmlFor="set-reduced">Visual feedback</label>
          <select
            id="set-reduced"
            value={settings.reducedFeedback ? "reduced" : "normal"}
            onChange={(e) => updateSettings({ reducedFeedback: e.target.value === "reduced" })}
          >
            <option value="normal">Normal</option>
            <option value="reduced">Reduced</option>
          </select>
        </div>

        <div className="setting-row">
          <label htmlFor="set-nosame">No same first letter</label>
          <input
            id="set-nosame"
            type="checkbox"
            checked={settings.noSameFirstLetter}
            onChange={(e) => updateSettings({ noSameFirstLetter: e.target.checked })}
          />
        </div>

        <div className="setting-row">
          <label htmlFor="set-reminder">Pause reminder</label>
          <select
            id="set-reminder"
            value={settings.pauseReminderMin}
            onChange={(e) =>
              updateSettings({ pauseReminderMin: Number(e.target.value) as Settings["pauseReminderMin"] })
            }
          >
            <option value={0}>Off</option>
            <option value={5}>After 5 minutes</option>
            <option value={10}>After 10 minutes</option>
            <option value={15}>After 15 minutes</option>
          </select>
        </div>

        <div className="setting-row reset-row">
          {!confirmReset ? (
            <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
              Reset local progress
            </button>
          ) : (
            <div className="confirm-reset">
              <p>Erase all progress and Build Bits? This cannot be undone.</p>
              <div className="button-row">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                >
                  Yes, erase
                </button>
                <button className="btn" onClick={() => setConfirmReset(false)}>
                  Keep my progress
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="button-col">
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

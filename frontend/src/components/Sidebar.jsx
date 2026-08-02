import { useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { assignFormation } from '../utils/autoAssign';
import { updateTacticField } from '../utils/tacticConfig';
import { TACTIC_GROUPS } from '../data/tacticFields';

const CATEGORIES = [
  ['formation', '포메이션'],
  ['coordination', '조율'],
  ['attack', '공격'],
  ['defense', '수비'],
];

function SliderField({ label, value, onChange, disabled, previewKey, onPreviewEnter, onPreviewLeave }) {
  return (
    <div className="slider-group">
      <div className="slider-head">
        <span>{label}</span>
        <span className="slider-val num">{Math.round(value)}</span>
      </div>
      <input
        type="range" min="0" max="100" step="1"
        value={value}
        disabled={disabled}
        onChange={e => {
          const next = Number(e.target.value);
          onChange(next);
          if (previewKey) onPreviewEnter?.(previewKey(next)); // 드래그 중에도 구간이 바뀌면 미리보기 텍스트가 같이 바뀌도록
        }}
        onMouseEnter={previewKey ? () => onPreviewEnter?.(previewKey(value)) : undefined}
        onMouseLeave={previewKey ? () => onPreviewLeave?.() : undefined}
      />
    </div>
  );
}

function ToggleField({ label, value, onChange, disabled, onLabel = '사용', offLabel = '미사용', previewKey, onPreviewEnter, onPreviewLeave }) {
  const hoverProps = (v) => previewKey ? {
    onMouseEnter: () => onPreviewEnter?.(previewKey(v)),
    onMouseLeave: () => onPreviewLeave?.(),
  } : {};
  return (
    <div className="inst-group">
      <h4>{label}</h4>
      <div className="inst-opts">
        <button className={`inst-btn ${value ? 'on' : ''}`} disabled={disabled} onClick={() => onChange(true)} {...hoverProps(true)}>{onLabel}</button>
        <button className={`inst-btn ${!value ? 'on' : ''}`} disabled={disabled} onClick={() => onChange(false)} {...hoverProps(false)}>{offLabel}</button>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange, disabled, previewKey, onPreviewEnter, onPreviewLeave }) {
  return (
    <div className="inst-group">
      <h4>{label}</h4>
      <div className="inst-opts">
        {options.map(([val, optLabel]) => (
          <button
            key={val}
            className={`inst-btn ${value === val ? 'on' : ''}`}
            disabled={disabled}
            onClick={() => onChange(val)}
            onMouseEnter={previewKey ? () => onPreviewEnter?.(previewKey(val)) : undefined}
            onMouseLeave={previewKey ? () => onPreviewLeave?.() : undefined}
          >
            {optLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ onPreviewEnter, onPreviewLeave }) {
  const state = useGameState();
  const { setPlayerPosBulk, restoreHome, applyFormation, setTacticConfig } = useGameActions();
  const [category, setCategory] = useState('formation');
  const locked = !state.editable;
  const tactic = state.tacticConfig;

  function handleApplyFormation(formationId) {
    if (locked) return;
    applyFormation(formationId);
    const formation = state.formations.find(f => f.id === formationId);
    if (!formation) return;
    const outfield = Object.fromEntries(
      Object.entries(state.players).filter(([, p]) => !p.data.positions.includes('GK'))
    );
    setPlayerPosBulk(assignFormation(outfield, formation));
  }

  function setField(sectionKey, fieldKey, value) {
    if (locked) return;
    setTacticConfig(updateTacticField(tactic, sectionKey, fieldKey, value));
  }

  return (
    <aside className="sidebar glass">
      {locked && <div className="lock-note">불러오는 중...</div>}

      <div className="cat-grid">
        {CATEGORIES.map(([key, label]) => (
          <button
            key={key}
            className={`fm-btn ${category === key ? 'on' : ''}`}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {category === 'formation' ? (
        <div className="formation-grid">
          <button
            className={`fm-btn wide ${state.formationId === state.tacticPreset?.formationId ? 'on' : ''}`}
            disabled={locked}
            onClick={() => { applyFormation(state.tacticPreset.formationId); restoreHome(); }}
          >
            ↺ 선발 기본 배치
          </button>
          {state.formations.map(fm => (
            <button
              key={fm.id}
              className={`fm-btn ${state.formationId === fm.id ? 'on' : ''}`}
              disabled={locked}
              onClick={() => handleApplyFormation(fm.id)}
            >
              {fm.name}
            </button>
          ))}
        </div>
      ) : tactic && TACTIC_GROUPS[category].map(section => (
        <div key={section.key} className="tactic-group">
          <div className="sb-heading">{section.title}</div>
          {section.fields.map(field => {
            const value = tactic[section.key][field.key];
            if (field.type === 'slider') {
              return (
                <SliderField
                  key={field.key} label={field.label} value={value} disabled={locked}
                  onChange={v => setField(section.key, field.key, v)}
                  previewKey={field.previewKey}
                  onPreviewEnter={onPreviewEnter}
                  onPreviewLeave={onPreviewLeave}
                />
              );
            }
            if (field.type === 'toggle') {
              return (
                <ToggleField
                  key={field.key} label={field.label} value={value} disabled={locked}
                  onLabel={field.onLabel} offLabel={field.offLabel}
                  onChange={v => setField(section.key, field.key, v)}
                  previewKey={field.previewKey}
                  onPreviewEnter={onPreviewEnter}
                  onPreviewLeave={onPreviewLeave}
                />
              );
            }
            return (
              <SelectField
                key={field.key} label={field.label} value={value} options={field.options} disabled={locked}
                onChange={v => setField(section.key, field.key, v)}
                previewKey={field.previewKey}
                onPreviewEnter={onPreviewEnter}
                onPreviewLeave={onPreviewLeave}
              />
            );
          })}
        </div>
      ))}
    </aside>
  );
}

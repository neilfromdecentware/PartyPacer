import { useState, type ReactNode } from 'react';

type TourStep =
  | 'start'
  | 'consume'
  | 'feel'
  | 'consume-page'
  | 'consume-what'
  | 'consume-more'
  | 'consume-amount'
  | 'feeling-page'
  | 'timeline'
  | 'discreet'
  | 'stop'
  | 'history';

const STEPS: TourStep[] = [
  'start',
  'consume',
  'feel',
  'consume-page',
  'consume-what',
  'consume-more',
  'consume-amount',
  'feeling-page',
  'timeline',
  'discreet',
  'stop',
  'history',
];

export function ProductTour({
  onDone,
  embedded = false,
}: {
  onDone?: () => void;
  embedded?: boolean;
}) {
  const [step, setStep] = useState<TourStep>('start');
  const i = STEPS.indexOf(step);
  const isFirst = i === 0;
  const isLast = i === STEPS.length - 1;

  function next() {
    if (isLast) {
      if (onDone) onDone();
    } else setStep(STEPS[i + 1]);
  }
  function prev() {
    if (!isFirst) setStep(STEPS[i - 1]);
  }

  function handleAdvance() {
    next();
  }

  return (
    <div
      onClick={handleAdvance}
      className={embedded ? 'tour-root tour-root--embedded' : 'tour-root tour-root--overlay'}
    >
      {!embedded && onDone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
          aria-label="Close"
          className="tour-close"
        >
          ×
        </button>
      )}

      <div className={embedded ? 'tour-content tour-content--embedded' : 'tour-content'}>
        {step === 'start' && (
          <>
            <CardSpacer />
            <TourCard
              title="Start A Party"
              body={
                <>
                  Tap <strong>START</strong> to begin tracking a party sesh.
                </>
              }
            />
            <Highlighted rounded="12px">
              <MockStartButton />
            </Highlighted>
          </>
        )}

        {step === 'consume' && (
          <>
            <CardSpacer />
            <TourCard
              title="Log what you have"
              body={
                <>
                  Tap the <strong>left</strong> button to log anything you
                  consume.
                </>
              }
            />
            <MockActionButtons highlight="consume" />
          </>
        )}

        {step === 'feel' && (
          <>
            <CardSpacer />
            <TourCard
              title="Log how you feel"
              body={
                <>
                  Tap the <strong>right</strong> button to log how you feel.
                </>
              }
            />
            <MockActionButtons highlight="feel" />
          </>
        )}

        {step === 'consume-page' && (
          <>
            <TourCard
              title="The consume page"
              body={
                <>
                  When you tap CONSUME, this opens. Pick what you had, pick
                  how much, tap <strong>✓</strong> to log it.
                </>
              }
            />
            <MockConsumeWizard highlight="overview" />
          </>
        )}

        {step === 'consume-what' && (
          <>
            <TourCard title="Pick what you consumed" />
            <MockConsumeWizard highlight="what" />
          </>
        )}

        {step === 'consume-more' && (
          <>
            <TourCard
              title="More options"
              body={
                <>
                  Tap <strong>🔽</strong> to expand the grid to show more
                  options.
                </>
              }
            />
            <MockConsumeWizard highlight="more" />
          </>
        )}

        {step === 'consume-amount' && (
          <>
            <TourCard
              title="How much"
              body={<>Tap the big number to change the amount.</>}
            />
            <MockConsumeWizard highlight="amount" />
          </>
        )}

        {step === 'feeling-page' && (
          <>
            <TourCard
              title="The feeling page"
              body={
                <>
                  FEEL opens the feelings grid. Tap the one that fits, then{' '}
                  <strong>✓</strong> to log it.
                </>
              }
            />
            <MockFeelingWizard />
          </>
        )}

        {step === 'timeline' && (
          <>
            <TourCard
              title="Reading the timeline"
              body={
                <>
                  Each row is one thing you logged. Newest sits at the bottom
                  with a white ring. The number is how long ago. Swipe a row
                  left to delete it.
                </>
              }
            />
            <MockTimeline />
          </>
        )}

        {step === 'discreet' && (
          <>
            <MockBlurredTimeline />
            <TourCard
              title="Discreet & private"
              body={
                <>
                  When you stop touching the screen, the timeline blurs in
                  half a second. Tap to reveal. After your privacy-lock
                  timeout, you'll need Face ID to bring it back. So a glance
                  from anyone behind you reveals nothing.
                </>
              }
            />
          </>
        )}

        {step === 'stop' && (
          <>
            <MockGearMenu highlight="stop" />
            <TourCard
              title="End the party"
              body={
                <>
                  When the night's done, tap the PARTYPACER icon in the
                  top-right to open the menu and tap <strong>STOP</strong>.
                  The party gets saved to your history.
                </>
              }
            />
          </>
        )}

        {step === 'history' && (
          <>
            <MockHistory />
            <TourCard
              title="Review past parties"
              body={
                <>
                  From this view you can restart a party you stopped
                  accidentally, review a past party, or delete a past party
                  permanently.
                </>
              }
            />
          </>
        )}
      </div>

      {!embedded && (
        <div className="tour-nav">
          <ArrowButton
            label="←"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria="Previous"
          />
          <span className="tour-counter">
            {i + 1} / {STEPS.length}
          </span>
          {isLast && onDone ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDone();
              }}
              className="tour-done-btn"
            >
              DONE
            </button>
          ) : (
            <ArrowButton
              label="→"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria="Next"
            />
          )}
        </div>
      )}
    </div>
  );
}

function CardSpacer() {
  return <div className="tour-spacer" />;
}

function TourCard({
  title,
  body,
}: {
  title: string;
  body?: ReactNode;
}) {
  return (
    <div className="tour-card">
      <h2 className="tour-card-title">{title}</h2>
      {body && <p className="tour-card-body">{body}</p>}
    </div>
  );
}

function Highlighted({
  children,
  rounded = '16px',
}: {
  children: ReactNode;
  rounded?: string;
}) {
  return (
    <div className="tour-highlight" style={{ borderRadius: rounded }}>
      {children}
    </div>
  );
}

function MockStartButton() {
  return (
    <div className="tour-mock-start">
      <span className="tour-mock-start-emoji">🍾</span>
      <span>START</span>
    </div>
  );
}

function MockActionButtons({ highlight }: { highlight: 'consume' | 'feel' }) {
  return (
    <div className="tour-mock-actions">
      <div className={highlight === 'consume' ? 'tour-flex1' : 'tour-flex1 tour-dim'}>
        <div className="tour-mock-action-btn">🍺</div>
      </div>
      <div className={highlight === 'feel' ? 'tour-flex1' : 'tour-flex1 tour-dim'}>
        <div className="tour-mock-action-btn">😊</div>
      </div>
    </div>
  );
}

function HighlightRing({
  rounded = '16px',
  inset = 0,
}: {
  rounded?: string;
  inset?: number;
}) {
  return (
    <div
      className="tour-ring"
      style={{ top: inset, left: inset, right: inset, bottom: inset, borderRadius: rounded }}
    />
  );
}

function MockBlurredTimeline() {
  return (
    <div className="tour-blur-frame">
      <div className="tour-blur-inner">
        <MockPartyTimerBar value="0:00:24:47" />
        <FakeTimelineRow emoji="🍺" label="just now" />
        <FakeTimelineRow emoji="💧" label="4 min ago" />
        <FakeTimelineRow emoji="😊" label="12 min ago" />
        <FakeTimelineRow emoji="🚬" label="18 min ago" />
        <FakeTimelineRow emoji="🍺" label="22 min ago" />
      </div>
      <div className="tour-blur-eye">👁</div>
    </div>
  );
}

function FakeTimelineRow({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="tour-fake-row">
      <span className="tour-fake-row-emoji">{emoji}</span>
      <span className="tour-fake-row-label">{label}</span>
    </div>
  );
}

function MockGearMenu({ highlight }: { highlight: 'stop' }) {
  return (
    <div className="tour-gear">
      <div className="tour-gear-timer tour-dim">
        <MockPartyTimerBar value="0:00:47:12" />
      </div>
      <div className="tour-gear-icon tour-dim">
        <img src="/icon.svg" alt="" className="tour-gear-icon-img" />
      </div>
      <div className="tour-gear-menu">
        <MockMenuItem emoji="🛑" label="STOP" highlighted={highlight === 'stop'} />
        <MockMenuItem emoji="⚙️" label="SETTINGS" dim />
        <MockMenuItem emoji="📤" label="SHARE" dim />
        <MockMenuItem emoji="ℹ️" label="ABOUT" dim />
      </div>
    </div>
  );
}

function MockMenuItem({
  emoji,
  label,
  highlighted,
  dim,
}: {
  emoji: string;
  label: string;
  highlighted?: boolean;
  dim?: boolean;
}) {
  return (
    <div className={dim ? 'tour-menu-item tour-dim' : 'tour-menu-item'}>
      {highlighted && <HighlightRing rounded="0" inset={2} />}
      <span className="tour-menu-item-emoji">{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

function MockHistory() {
  return (
    <div className="tour-history">
      <MockPartyRow date="THU MAY 16" subtitle="11:42 PM — 4:18 AM" highlighted />
      <MockPartyRow date="SAT MAY 11" subtitle="9:05 PM — 2:32 AM" dim />
      <MockPartyRow date="FRI MAY 3" subtitle="10:14 PM — 1:08 AM" dim />
    </div>
  );
}

function MockPartyRow({
  date,
  subtitle,
  highlighted,
  dim,
}: {
  date: string;
  subtitle: string;
  highlighted?: boolean;
  dim?: boolean;
}) {
  return (
    <div className={dim ? 'tour-party-row tour-dim' : 'tour-party-row'}>
      {highlighted && <HighlightRing rounded="0" inset={2} />}
      <div className="tour-party-row-date">{date}</div>
      <div className="tour-party-row-sub">{subtitle}</div>
    </div>
  );
}

const CONSUME_EMOJI_DEFAULT = ['💧', '🍺', '🍷', '🥃', '🍸', '🍹', '🚬', '☕'];
const FEELING_EMOJI_SAMPLE = [
  '🙂',
  '😁',
  '🤣',
  '🥰',
  '🥳',
  '💃',
  '😒',
  '😣',
  '🥴',
  '🤢',
  '😵‍💫',
  '🤯',
];

function MockConsumeWizard({
  highlight,
}: {
  highlight: 'overview' | 'what' | 'more' | 'amount';
}) {
  // '' (lit) or 'tour-dim' for everything outside the highlighted zone
  function dimClass(zone: 'what' | 'more' | 'amount' | 'chrome') {
    if (highlight === 'overview') return '';
    if (highlight === zone) return '';
    return 'tour-dim';
  }
  return (
    <div className="tour-wizard">
      <div className={`tour-wizard-x ${dimClass('chrome')}`}>✕</div>
      <div className={`tour-rel ${dimClass('what')}`}>
        {highlight === 'what' && <HighlightRing rounded="12px" inset={-4} />}
        <div className="tour-wizard-grid">
          {CONSUME_EMOJI_DEFAULT.map((e, i) => (
            <div
              key={e}
              className="tour-tile"
              style={{
                borderRadius: '10px',
                fontSize: '1.6rem',
                boxShadow: i === 0 ? '0 0 0 2px #fff' : 'none',
              }}
            >
              {e}
            </div>
          ))}
        </div>
      </div>
      <div className="tour-center" style={{ marginTop: '0.1rem' }}>
        <div className={`tour-rel ${dimClass('more')}`}>
          {highlight === 'more' && <HighlightRing rounded="10px" inset={-6} />}
          <div className="tour-more-toggle">🔽</div>
        </div>
      </div>
      <div className="tour-center" style={{ marginTop: '0.4rem' }}>
        <div className={`tour-rel-inline ${dimClass('amount')}`}>
          {highlight === 'amount' && (
            <HighlightRing rounded="14px" inset={-6} />
          )}
          <div className="tour-amount">1</div>
        </div>
      </div>
      <div className={`tour-confirm ${dimClass('chrome')}`}>✓</div>
    </div>
  );
}

function MockFeelingWizard() {
  return (
    <div className="tour-wizard">
      <div className="tour-wizard-x">✕</div>
      <div className="tour-wizard-grid">
        {FEELING_EMOJI_SAMPLE.map((e, i) => (
          <div
            key={e}
            className="tour-tile"
            style={{
              borderRadius: '12px',
              fontSize: '1.7rem',
              boxShadow: i === 4 ? '0 0 0 3px #fff' : 'none',
            }}
          >
            {e}
          </div>
        ))}
      </div>
      <div className="tour-confirm">✓</div>
    </div>
  );
}

const MOCK_TIMELINE_EVENTS: Array<{
  type: 'consume' | 'feeling';
  emoji: string;
  time: string;
  highlighted?: boolean;
}> = [
  { type: 'consume', emoji: '🍺1', time: '0:47' },
  { type: 'consume', emoji: '💧1', time: '0:38' },
  { type: 'consume', emoji: '🚬1', time: '0:24' },
  { type: 'feeling', emoji: '🥳', time: '0:06' },
  { type: 'consume', emoji: '🍺1', time: '0:02', highlighted: true },
];

function MockTimeline() {
  return (
    <div className="tour-timeline">
      <div className="tour-center" style={{ padding: '0.25rem 0 0.4rem' }}>
        <MockPartyTimerBar value="0:00:47:18" />
      </div>
      {MOCK_TIMELINE_EVENTS.map((evt, i) => (
        <div
          key={i}
          className="tour-timeline-row"
          style={{
            flexDirection: evt.type === 'feeling' ? 'row-reverse' : 'row',
            boxShadow: evt.highlighted ? '0 0 0 2px #fff' : 'none',
          }}
        >
          <span className="tour-timeline-emoji">{evt.emoji}</span>
          <span className="tour-timeline-time">{evt.time}</span>
        </div>
      ))}
    </div>
  );
}

function MockPartyTimerBar({ value }: { value: string }) {
  return <div className="tour-timer-bar">{value}</div>;
}

function ArrowButton({
  label,
  disabled,
  onClick,
  aria,
}: {
  label: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
  aria: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className="tour-arrow"
    >
      {label}
    </button>
  );
}

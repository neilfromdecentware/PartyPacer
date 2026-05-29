import { useState, type ReactNode } from 'react';
import {
  DetailSheet,
  SheetSection,
  SheetDivider,
  SheetHeavyDivider,
} from './DetailSheet';
import { FEEDBACK_URL, openExternal } from '../links';

interface AboutCard {
  title: string;
  body: ReactNode;
  actions?: ReactNode;
  detailSheet?: {
    triggerText: string;
    title: string;
    content: ReactNode;
  };
}

const LANDING_INTRO_CARD: AboutCard = {
  title: 'Make your partying better!',
  body: (
    <>
      Your pocket tracker for good times. Keep your grip even when things get
      crazy. Private and on your phone only.
    </>
  ),
};

const CARDS: AboutCard[] = [
  {
    title: 'Why?',
    body: (
      <>
        Nights out are easy to lose track of. PARTYPACER is a pocket tally —
        what you've had, how you feel, when. Nothing more, nothing less.
      </>
    ),
    detailSheet: {
      triggerText: 'But seriously, why?',
      title: 'But seriously, why?',
      content: (
        <>
          <SheetSection>
            I built PARTYPACER because I needed it. I'd go out with every
            intention of pacing myself, but a few drinks in, time starts to
            warp. Was that last shot twenty minutes ago or an hour ago? Have I
            had four or six? The more you've had, the less you can remember
            what you've had — and the worse your judgment gets about whether
            you should have more. The moment you most need clear information
            is the exact moment you're least capable of recalling it.
          </SheetSection>
          <SheetSection>
            So I made something dead simple: drop in what you consume, see how
            long ago it was, check in with how you feel.
          </SheetSection>
          <SheetSection>
            But there are all kinds of reasons you might want to use this to
            have a better experience partying:
          </SheetSection>
          <SheetDivider />
          <SheetSection title="🥤 Staying hydrated">
            Making sure you're drinking the right amount of water compared to
            the fun stuff.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="🎉 Optimizing the fun">
            See what combinations and timing lead to the most and least fun so
            you know what works for you best for next time.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="🥁 Finding your rhythm">
            Knowing when to ease off and when to lean in, based on what you've
            actually had and how you're actually feeling — not what you think
            you might remember if you squint real hard.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="🌅 The morning-after picture">
            Looking back at how the night actually went, not how you vaguely
            remember it. Gives you insight into how you're feeling then.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="🚩 Spotting something wrong">
            If you're feeling way more out of it than what you've logged
            should account for, that mismatch is a signal. It could mean
            someone put something in your drink. Having that data in front of
            you could be the thing that makes you get help.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="🪞 Seeing your own patterns">
            Having honest insight into your habits and experiences can let you
            see if there's something you should pay attention to.
          </SheetSection>
        </>
      ),
    },
  },
  {
    title: 'Principles',
    body: (
      <BulletList
        items={[
          'Anonymous',
          'Private',
          'Nonjudgemental',
          "Usable when you're hammered",
        ]}
      />
    ),
    detailSheet: {
      triggerText: 'What do these mean?',
      title: 'What do these mean?',
      content: (
        <>
          <SheetSection title="Anonymous">
            This app never asks you to log in, link with an account, or give
            your name. It's a PWA (progressive web app) so it's not linked
            with your app store account or device details. This app literally
            can't know anything about you.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Private">
            There's more info on the privacy page, but everything about this
            app is designed to be private: resistant against someone snooping
            through your phone, looking over your shoulder, or even trying to
            hack you. Nothing leaves your phone, everything's encrypted, and
            everything disappears at the push of a button.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Nonjudgemental">
            There are all kinds of reasons you might want to keep tabs on
            what you've put inside your body when you're partying. Maybe it's
            for safety. Maybe it's to help you make better choices late in
            the party. Maybe it's for mindfulness. Maybe it's to optimize
            your fun for next time. This app doesn't judge you.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Usable when you're hammered">
            Big text. Big icons. Simple gestures. No fiddly interactions.
            This app means that no matter what state you're in you can see
            what's in you and keep track.
          </SheetSection>
        </>
      ),
    },
  },
  {
    title: 'Privacy',
    body: (
      <>
        Your party data lives only on your phone, encrypted with a key your
        Face ID derives. No accounts, no cloud, no analytics. The app cannot
        see what you log, and there is no server that could.
      </>
    ),
    detailSheet: {
      triggerText: 'Details for nerds',
      title: 'Details for nerds',
      content: (
        <>
          <SheetSection title="Discreet Mode">
            When you're not actively touching the screen, the app blurs
            itself within half a second. Someone glancing over your shoulder
            or walking past sees nothing. The blur also kicks in before iOS
            takes its app-switcher screenshot, so your multitasking view is
            clean too.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Privacy Lock">
            After a period of inactivity you choose (1, 5, 15, or 30
            minutes), the app requires Face ID to unblur. This means if
            someone picks up your unlocked phone and opens PARTYPACER, they
            still can't see anything without your face.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="No Server Connection">
            PARTYPACER makes zero network requests. No server, no API calls,
            no analytics, no telemetry, no beacons, no login, no handshakes.
            Nothing about you or what you log ever leaves your phone — there
            is no server it could go to. As a bonus, the app runs perfectly
            with no internet connection once installed.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Encryption">
            Your data is encrypted in two layers, both AES-256-GCM. A random
            per-blob <em>data key</em> encrypts your party data. A{' '}
            <em>master key</em> — derived from a secret only your Face ID
            can produce (via the WebAuthn PRF extension) — wraps the data
            key. The wrapped (encrypted) data key sits alongside the
            ciphertext; the raw keys exist only in memory while the app is
            open, and vanish when it closes. Without your biometric the
            wrapped key can't be unwrapped, and without the data key the
            ciphertext can't be decrypted. If someone extracted the raw
            storage from your phone, all they'd find is ciphertext and a
            wrapped key — both useless without your face.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Not in the App Store">
            PARTYPACER is a PWA — a web app you install to your home screen.
            It doesn't go through Apple's App Store, which means no app
            review process deciding what's appropriate, no connection to
            your Apple ID, and no app store account metadata attached to
            your install.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="True Erase">
            When you delete a party, the data key is rotated. A fresh random
            key is generated, the remaining data is re-encrypted with it,
            and the previous key is discarded. Even if old ciphertext bytes
            survive somewhere (an unflushed write log, a backup), there's
            no key left to decrypt them. No soft delete, no trash folder.
            Gone is gone.
          </SheetSection>
          <SheetHeavyDivider />
          <SheetSection title="Tradeoffs">
            These privacy choices come with real downsides. It's worth
            knowing about them:
          </SheetSection>
          <SheetDivider />
          <SheetSection title="Data may be erased by the system">
            Because PARTYPACER is a PWA, iOS can reclaim its storage if you
            don't open the app for several weeks. This is unlikely for
            regular use, but if you go a long time between parties, your
            old data may simply be gone.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="No sync between devices">
            Your data lives on one phone. If you switch phones, lose your
            phone, or want to see your data on another device — you can't.
            There's no cloud to pull from.
          </SheetSection>
          <SheetDivider />
          <SheetSection title="No notifications or reminders">
            Push notifications require a server to send them. PARTYPACER
            has no server. That means it can't remind you to log, nudge you
            to hydrate, or alert your friends. The app only knows you exist
            when you're looking at it.
          </SheetSection>
          <SheetHeavyDivider />
          <SheetSection title="Open Source">
            PARTYPACER is open source, released under the GNU Affero General
            Public License v3 (AGPLv3).
          </SheetSection>
          <SheetSection>
            The code isn't posted to GitHub yet, but it's available on
            request in the meantime — message me and I'll share it. You
            shouldn't have to take my word for any of the claims above;
            you're welcome to read the source and check for yourself.
          </SheetSection>
        </>
      ),
    },
  },
  {
    title: 'Promises',
    body: (
      <>
        PARTYPACER will <strong style={{ color: '#fff' }}>never</strong>
        <BulletList
          items={[
            'Send any of your information anywhere',
            'Sync, upload, or back up your data',
            'Try to make any money off this app',
            'Show you an ad',
            'Put a notification on your lock screen',
            'Embarrass or disrespect you',
          ]}
        />
      </>
    ),
  },
  {
    title: 'Developer',
    body: (
      <>
        This is a one-person project. I built it because I think the world
        should have it.
        <br />
        <br />
        Since everything's local, I have no idea if anyone's actually using
        this or if it's helping. If you want to let me know, these open in
        your browser — not inside the app — so nothing here breaks the
        privacy promise.
      </>
    ),
    actions: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <ExternalLinkButton label="👍 FEEDBACK" href={FEEDBACK_URL} />
      </div>
    ),
  },
  {
    title: 'Disclaimer',
    body: (
      <>
        PARTYPACER is, legally speaking, for entertainment purposes only.
        This isn't medical or safety advice; judgements about what you do
        with your body are yours.
        <br />
        <br />
        If you or someone with you is in trouble, call local emergency
        services.
        <br />
        <br />
        Logging things here is not a legal admission of having consumed
        anything.
      </>
    ),
    detailSheet: {
      triggerText: 'Full legal disclaimer',
      title: 'Full legal disclaimer',
      content: <FullDisclaimer />,
    },
  },
  {
    title: 'License',
    body: (
      <>
        PARTYPACER is provided as-is, with no warranty of any kind. Use at
        your own discretion. Apple, iOS, and Face ID are trademarks of Apple
        Inc.
        <br />
        <br />
        PARTYPACER is released under the GNU Affero General Public License
        v3 (AGPLv3).
      </>
    ),
  },
];

export function AboutFlow({
  onClose,
  onStartTour,
  embedded = false,
}: {
  onClose?: () => void;
  onStartTour?: () => void;
  embedded?: boolean;
}) {
  const cards = embedded ? [LANDING_INTRO_CARD, ...CARDS] : CARDS;
  const [index, setIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const card = cards[index];
  const isFirst = index === 0;
  const isLast = index === cards.length - 1;

  function goTo(next: number) {
    setSheetOpen(false);
    setIndex(next);
  }

  return (
    <>
      <div
        style={
          embedded
            ? {
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }
            : {
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.94)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding:
                  'env(safe-area-inset-top, 0px) 1.5rem env(safe-area-inset-bottom, 0px)',
              }
        }
      >
        {!embedded && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
              right: '1rem',
              width: '44px',
              height: '44px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '1.75rem',
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ×
          </button>
        )}

        <div
          style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '16px',
            padding: '2rem 1.5rem 1.25rem',
            maxWidth: '380px',
            width: '100%',
            maxHeight: embedded ? '82vh' : '85vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h2
            style={{
              margin: '0 0 1rem',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.03em',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {card.title}
          </h2>
          <div
            style={{
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              flex: 1,
              minHeight: 0,
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                color: '#bbb',
                fontSize: '0.95rem',
                lineHeight: 1.55,
                textAlign: 'left',
              }}
            >
              {card.body}
            </div>
            {card.detailSheet && (
              <button
                onClick={() => setSheetOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0.75rem 0 0',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  display: 'block',
                }}
              >
                {card.detailSheet.triggerText}
              </button>
            )}
            {card.actions && (
              <div style={{ marginTop: '1rem' }}>{card.actions}</div>
            )}
            {isLast && onStartTour && (
              <button
                onClick={onStartTour}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '1rem 0 0',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  display: 'block',
                }}
              >
                Take the app tour
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexShrink: 0,
            }}
          >
            <ArrowButton
              label="←"
              disabled={isFirst}
              onClick={() => goTo(Math.max(0, index - 1))}
              aria="Previous"
            />
            <span
              style={{
                color: '#666',
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {index + 1} / {cards.length}
            </span>
            {isLast && !embedded ? (
              <button
                onClick={onClose}
                style={{
                  height: '3rem',
                  padding: '0 1.25rem',
                  background: 'transparent',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                DONE
              </button>
            ) : (
              <ArrowButton
                label="→"
                disabled={isLast}
                onClick={() => goTo(Math.min(cards.length - 1, index + 1))}
                aria="Next"
              />
            )}
          </div>
        </div>
      </div>

      {sheetOpen && card.detailSheet && (
        <DetailSheet
          title={card.detailSheet.title}
          onClose={() => setSheetOpen(false)}
        >
          {card.detailSheet.content}
        </DetailSheet>
      )}
    </>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  aria,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  aria: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      style={{
        width: '3rem',
        height: '3rem',
        background: 'transparent',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: '12px',
        fontSize: '1.4rem',
        lineHeight: 1,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.2 : 1,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        margin: '0.5rem 0 0',
        paddingLeft: '1.25rem',
        color: '#ddd',
        fontSize: '0.95rem',
        lineHeight: 1.7,
      }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ExternalLinkButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        openExternal(href);
      }}
      style={{
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        padding: '0.75rem',
        background: 'transparent',
        color: '#fff',
        border: '2px solid #fff',
        borderRadius: '10px',
        fontSize: '0.85rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textAlign: 'center',
        textDecoration: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </a>
  );
}

function FullDisclaimer() {
  return (
    <>
      <SheetSection title="1. Nature of the App">
        PARTYPACER is a personal logging tool that lets you record what
        you've consumed and how you feel during a night out. That's all it
        is. It is not a medical device, a health monitor, a breathalyser,
        a blood alcohol calculator, a fitness tracker, a diagnostic tool,
        or a clinical instrument. It has not been reviewed, approved, or
        certified by any regulatory body, medical authority, or government
        agency anywhere in the world.
        <br />
        <br />
        Any information displayed by the app — including but not limited
        to drink counts, timelines, self-reported mood or state, or any
        summaries derived from your entries — is based entirely on what
        you manually enter. The app does not measure anything about your
        body. It cannot detect, estimate, or infer your level of
        intoxication, impairment, or fitness to perform any activity.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="2. Not Medical or Safety Advice">
        Nothing in PARTYPACER constitutes medical advice, healthcare
        guidance, psychological counselling, nutritional advice, or safety
        recommendations. The app is not a substitute for the advice of a
        qualified medical professional, and no content or feature of the
        app should be interpreted as such.
        <br />
        <br />
        If you have concerns about your physical or mental health, your
        relationship with alcohol or other substances, or your safety in
        any situation, consult a qualified professional or contact local
        emergency services.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="3. No Reliance — Use at Your Own Risk">
        Do not use PARTYPACER to make decisions about your safety or the
        safety of others. Specifically, and without limitation, do not
        use the app to decide whether you are safe to:
        <BulletList
          items={[
            'drive, cycle, or operate any vehicle or machinery',
            'care for children or other dependants',
            'swim, climb, or engage in any physical activity',
            'take medication or mix substances',
            'consent to anything',
            'perform work or professional duties',
          ]}
        />
        <br />
        The app cannot assess impairment. Your own perception of your
        state — especially while under the influence of alcohol or other
        substances — is unreliable, and nothing the app shows you changes
        that. The fact that your logged entries look moderate, or that
        the app does not display a warning, means nothing about your
        actual condition.
        <br />
        <br />
        You use PARTYPACER entirely at your own risk.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="4. Accuracy and Completeness">
        PARTYPACER makes no guarantees whatsoever about the accuracy,
        completeness, reliability, or timeliness of any information
        displayed. The app reflects what you enter, and only what you
        enter. You may forget to log something, log something incorrectly,
        or misremember what you consumed. The app has no way to know or
        correct for any of this. Do not treat what you see in the app as
        a factual or complete record of your consumption.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="5. Limitation of Liability">
        To the maximum extent permitted by applicable law, the developer
        of PARTYPACER shall not be liable for any direct, indirect,
        incidental, special, consequential, or exemplary damages —
        including but not limited to damages for personal injury, loss of
        life, property damage, loss of data, loss of profits, or
        emotional distress — arising out of or in connection with your
        use of, or inability to use, the app, regardless of the cause of
        action and even if the developer has been advised of the
        possibility of such damages.
        <br />
        <br />
        This limitation applies to damages arising from:
        <BulletList
          items={[
            'reliance on any information displayed by the app',
            'decisions made based on or influenced by the app',
            "errors, inaccuracies, or omissions in the app's functionality or display",
            'any interruption, malfunction, data loss, or unavailability of the app',
            'any third-party actions or circumstances related to your use of the app',
          ]}
        />
        <br />
        Some jurisdictions do not allow the exclusion or limitation of
        certain damages. In such jurisdictions, the developer's liability
        is limited to the minimum extent permitted by law.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="6. No Warranty">
        PARTYPACER is provided "as is" and "as available" without warranty
        of any kind, whether express, implied, or statutory. The developer
        disclaims all warranties, including but not limited to implied
        warranties of merchantability, fitness for a particular purpose,
        accuracy, and non-infringement.
        <br />
        <br />
        The developer does not warrant that the app will be uninterrupted,
        error-free, secure, or free of harmful components, or that any
        defects will be corrected.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="7. Age Restriction">
        PARTYPACER is intended for use by adults of legal drinking age in
        their jurisdiction. By using the app, you confirm that you meet
        the legal drinking age where you are located. The developer
        accepts no responsibility for use of the app by minors.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="8. Your Data">
        PARTYPACER is a local-only application. Your data is stored on
        your device and is not transmitted to any server, cloud service,
        or third party. The developer has no access to your data and
        cannot retrieve, produce, or disclose it to any person,
        organisation, court, or government authority — because the
        developer does not have it and has never had it.
        <br />
        <br />
        If your device is lost, destroyed, wiped, or if the operating
        system reclaims the app's storage, your data is gone. The
        developer is not responsible for any loss of data.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="9. Logging Is Not a Legal Record">
        Entries you make in PARTYPACER are personal notes. They do not
        constitute a legal admission, confession, or evidence of having
        consumed alcohol or any other substance. The app does not verify,
        certify, or attest to the truth of anything you enter. The
        developer makes no representations about the legal status or
        evidentiary value of any data created within the app.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="10. Indemnification">
        To the maximum extent permitted by applicable law, you agree to
        indemnify, defend, and hold harmless the developer of PARTYPACER
        from and against any claims, liabilities, damages, losses, costs,
        or expenses (including reasonable legal fees) arising out of or
        related to your use of the app, your violation of this
        disclaimer, or your violation of any applicable law.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="11. Severability">
        If any provision of this disclaimer is found to be invalid or
        unenforceable by a court of competent jurisdiction, the remaining
        provisions shall continue in full force and effect. The invalid
        or unenforceable provision shall be modified to the minimum
        extent necessary to make it valid and enforceable while preserving
        its original intent.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="12. Governing Law and Jurisdiction">
        This disclaimer is governed by and construed in accordance with
        the laws of the Netherlands. Any disputes arising out of or in
        connection with this disclaimer or your use of PARTYPACER shall
        be submitted to the exclusive jurisdiction of the courts of
        Amsterdam, the Netherlands.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="13. Modification, Suspension, and Discontinuation of the App">
        The developer reserves the right, at any time and for any reason
        or no reason, to modify, suspend, degrade, restrict, or
        permanently discontinue PARTYPACER — in whole or in part — with
        or without notice. This includes but is not limited to removing
        features, limiting functionality, resetting data, disabling
        access, or taking the app offline entirely.
        <br />
        <br />
        You acknowledge that PARTYPACER is a free, voluntarily offered
        tool and that no promise of continued availability, functionality,
        or support has been made. You have no entitlement to the
        continued existence or operation of the app. The developer shall
        not be liable to you or any third party for any modification,
        suspension, or discontinuation of the app, including any
        resulting loss of data or inability to access prior entries.
        <br />
        <br />
        By using the app, you accept that it may cease to exist at any
        moment and plan accordingly.
      </SheetSection>
      <SheetDivider />
      <SheetSection title="14. Changes to This Disclaimer">
        The developer reserves the right to modify this disclaimer at any
        time. Continued use of the app after any such modification
        constitutes acceptance of the updated terms. It is your
        responsibility to review this disclaimer periodically.
      </SheetSection>
    </>
  );
}

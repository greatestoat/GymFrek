import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGym } from '../context/GymContext';
import { useToast } from '../context/ToastContext';
import { createTicket, getMyTickets } from '../api/tickets';
import type { ApiErrorPayload, Ticket, TicketStatus } from '../types';
import { AxiosError } from 'axios';

type QuickHelpCategory = 'Members' | 'Memberships' | 'Gym Settings' | 'Dashboard' | 'Account';

interface FaqItem {
  question: string;
  answer: string;
  category: QuickHelpCategory;
}

const QUICK_HELP: { label: QuickHelpCategory; icon: string }[] = [
  { label: 'Members', icon: '👥' },
  { label: 'Memberships', icon: '💳' },
  { label: 'Gym Settings', icon: '🏋' },
  { label: 'Dashboard', icon: '📊' },
  { label: 'Account', icon: '🔐' },
];

// Placeholder answers - swap these out with real copy whenever it's ready.
const FAQS: FaqItem[] = [
  { question: 'How to add members?', answer: 'Answer coming soon.', category: 'Members' },
  { question: 'How to upload logo?', answer: 'Answer coming soon.', category: 'Gym Settings' },
  { question: 'Password reset?', answer: 'Answer coming soon.', category: 'Account' },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        No matching questions. Try the contact form below.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.question}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
              style={{ backgroundColor: 'var(--surface)' }}
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <span
                className="shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
                aria-hidden
              >
                ▼
              </span>
            </button>
            {isOpen && (
              <div
                className="px-4 py-3 text-sm border-t"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Waiting for a reply',
  in_progress: 'Being looked into',
  resolved: 'Answered',
};

const TICKET_STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  open: 'badge-expired',
  in_progress: 'badge-paused',
  resolved: 'badge-active',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function MyQuestions() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyTickets();
        if (!cancelled) setTickets(data);
      } catch {
        if (!cancelled) showToast('Could not load your questions.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-20 w-full" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) return null;

  return (
    <section>
      <h2 className="label-eyebrow">Your Questions</h2>
      <div className="flex flex-col gap-3">
        {tickets.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t.type} · {formatDate(t.createdAt)}
                </p>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  {t.subject || 'Your message'}
                </p>
              </div>
              <span className={`badge ${TICKET_STATUS_BADGE_CLASS[t.status]} border-0 shrink-0`}>
                {TICKET_STATUS_LABEL[t.status]}
              </span>
            </div>

            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
              {t.message}
            </p>

            {t.adminReply ? (
              <div
                className="mt-3 pt-3 border-t rounded-lg"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                  Our reply {t.repliedAt ? `· ${formatDate(t.repliedAt)}` : ''}
                </p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                  {t.adminReply}
                </p>
              </div>
            ) : (
              <p className="text-xs mt-3 italic" style={{ color: 'var(--text-muted)' }}>
                We'll notify you here as soon as our team replies.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Support() {
  const { user } = useAuth();
  const { gym } = useGym();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<QuickHelpCategory | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      const matchesCategory = !activeCategory || f.category === activeCategory;
      const matchesSearch =
        !search.trim() || f.question.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  // --- Contact / Support form ---------------------------------------------
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactGym, setContactGym] = useState(gym?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  // Bumping this triggers "Your Questions" to refetch after a new submission.
  const [ticketsVersion, setTicketsVersion] = useState(0);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await createTicket({
        type: 'support',
        name: contactName,
        gymName: contactGym,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage,
      });
      showToast('Your message was sent. Our team will get back to you soon.', 'success');
      setContactSubject('');
      setContactMessage('');
      setTicketsVersion((v) => v + 1);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      showToast(axiosErr.response?.data?.message || 'Could not send your message.', 'error');
    } finally {
      setContactSubmitting(false);
    }
  };

  // --- Bug report form ------------------------------------------------------
  const [bugIssue, setBugIssue] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugScreenshotUrl, setBugScreenshotUrl] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);

  const handleBugSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBugSubmitting(true);
    try {
      const message = bugScreenshotUrl.trim()
        ? `${bugDescription}\n\nScreenshot: ${bugScreenshotUrl.trim()}`
        : bugDescription;
      await createTicket({
        type: 'bug',
        name: user?.name,
        gymName: gym?.name,
        email: user?.email,
        subject: bugIssue,
        message,
      });
      showToast('Bug reported. Thanks for flagging it!', 'success');
      setBugIssue('');
      setBugDescription('');
      setBugScreenshotUrl('');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      showToast(axiosErr.response?.data?.message || 'Could not submit the bug report.', 'error');
    } finally {
      setBugSubmitting(false);
    }
  };

  // --- Feature suggestion form -----------------------------------------------
  const [featureText, setFeatureText] = useState('');
  const [featureSubmitting, setFeatureSubmitting] = useState(false);

  const handleFeatureSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeatureSubmitting(true);
    try {
      await createTicket({
        type: 'feature',
        name: user?.name,
        gymName: gym?.name,
        email: user?.email,
        subject: 'Feature suggestion',
        message: featureText,
      });
      showToast('Thanks for the suggestion!', 'success');
      setFeatureText('');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      showToast(axiosErr.response?.data?.message || 'Could not submit your suggestion.', 'error');
    } finally {
      setFeatureSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10 pb-16">
      {/* Header */}
      <div className="text-center pt-4">
        <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--text)' }}>
          Support Center
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Search for answers, or reach out below.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden
        >
          🔍
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="input-field pl-10"
          aria-label="Search help articles"
        />
      </div>

      {/* Quick Help */}
      <section>
        <h2 className="label-eyebrow">Quick Help</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_HELP.map((c) => {
            const isActive = activeCategory === c.label;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setActiveCategory(isActive ? null : c.label)}
                className="badge transition"
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--surface-2)',
                  color: isActive ? 'var(--accent-contrast)' : 'var(--text)',
                }}
              >
                <span aria-hidden>{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="label-eyebrow">Frequently Asked Questions</h2>
        <FaqAccordion items={filteredFaqs} />
      </section>

      {/* Your Questions - user's own tickets + admin replies */}
      <MyQuestions key={ticketsVersion} />

      {/* Need More Help - contact form */}
      <section className="card">
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--text)' }}>
          Need More Help?
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Send our team a message and we'll get back to you.
        </p>
        <form onSubmit={handleContactSubmit} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              className="input-field"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="contact-gym">Gym Name</label>
            <input
              id="contact-gym"
              className="input-field"
              value={contactGym}
              onChange={(e) => setContactGym(e.target.value)}
            />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              className="input-field"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="contact-subject">Subject</label>
            <input
              id="contact-subject"
              className="input-field"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-eyebrow" htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              className="input-field min-h-28"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={contactSubmitting}>
              {contactSubmitting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </section>

      {/* Report Bug */}
      <section className="card">
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--text)' }}>
          Report Bug
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Found something broken? Let us know the details.
        </p>
        <form onSubmit={handleBugSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label-eyebrow" htmlFor="bug-issue">Issue</label>
            <input
              id="bug-issue"
              className="input-field"
              value={bugIssue}
              onChange={(e) => setBugIssue(e.target.value)}
              placeholder="Short summary of the problem"
              required
            />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="bug-description">Description</label>
            <textarea
              id="bug-description"
              className="input-field min-h-28"
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="What happened? What did you expect instead?"
              required
            />
          </div>
          <div>
            <label className="label-eyebrow" htmlFor="bug-screenshot">Screenshot (optional link)</label>
            <input
              id="bug-screenshot"
              type="url"
              className="input-field"
              value={bugScreenshotUrl}
              onChange={(e) => setBugScreenshotUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <button type="submit" className="btn-primary" disabled={bugSubmitting}>
              {bugSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </section>

      {/* Suggest a Feature */}
      <section className="card">
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--text)' }}>
          Suggest a Feature
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Got an idea that would make gym_frek better?
        </p>
        <form onSubmit={handleFeatureSubmit} className="flex flex-col gap-4">
          <textarea
            className="input-field min-h-28"
            value={featureText}
            onChange={(e) => setFeatureText(e.target.value)}
            placeholder="Tell us what you'd like to see..."
            required
            aria-label="Feature suggestion"
          />
          <div>
            <button type="submit" className="btn-primary" disabled={featureSubmitting}>
              {featureSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
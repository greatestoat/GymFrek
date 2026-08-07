import Navbar from '../components/Navbar';
import PulseDivider from '../components/PulseDivider';
import { useAuth } from '../context/AuthContext';

const GOAL_LABELS: Record<string, string> = {
  general_fitness: 'General fitness',
  strength: 'Strength',
  weight_loss: 'Weight loss',
  endurance: 'Endurance',
  mobility: 'Mobility',
};

const stats = [
  { label: 'Workouts logged', value: '0', unit: 'sessions' },
  { label: 'Current streak', value: '0', unit: 'days' },
  { label: 'This week', value: '0', unit: 'hrs trained' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-14">
        <p className="font-mono text-xs tracking-[0.3em] text-volt uppercase mb-3">
          Dashboard
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-chalk mb-4">
          Let's get moving, {user?.name.split(' ')[0]}.
        </h1>
        <PulseDivider className="max-w-xs mb-10" />

        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/5 bg-surface p-6 hover:border-volt/30 transition-colors"
            >
              <p className="font-mono text-4xl text-chalk mb-1">{s.value}</p>
              <p className="text-xs text-mist uppercase tracking-wide">
                {s.unit} &middot; {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/5 bg-surface p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-xl text-chalk mb-2">Current focus</h2>
              <p className="text-mist text-sm max-w-md">
                Your goal is set to{' '}
                <span className="text-volt font-semibold">
                  {GOAL_LABELS[user?.goal || 'general_fitness']}
                </span>
                . Head to your profile to change it any time.
              </p>
            </div>
            <span className="rounded-full bg-volt/10 border border-volt/30 text-volt text-xs font-mono px-4 py-2 uppercase tracking-wide">
              No sessions logged yet
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

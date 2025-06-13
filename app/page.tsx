import Link from 'next/link';

function WordleHeader({ label }: { label: string }) {
  const colors = ['bg-[#6aaa64]', 'bg-[#c9b458]', 'bg-[#787c7e]'];
  return (
    <div className="flex justify-center gap-1 mb-8">
      {label.split('').map((letter, idx) => (
        <span
          key={idx}
          className={`${colors[idx % colors.length]} w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-md font-bold text-white text-2xl md:text-3xl shadow-[0_2px_4px_rgba(0,0,0,0.12)] select-none`}
          style={{ fontFamily: 'Montserrat, Poppins, Arial, sans-serif', letterSpacing: '0.05em' }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top Navigation Bar */}
      <nav className="bg-[hsl(var(--card))] shadow-sm px-4 py-2 flex justify-between items-center border-b border-[hsl(var(--border))]">
        <div className="font-bold text-xl tracking-wide text-[hsl(var(--foreground))]">Wordle Golf Tracker</div>
        <Link href="/auth/login" className="bg-green-400 hover:bg-green-500 text-green-900 font-bold px-6 py-2 rounded-full shadow transition">Sign In</Link>
      </nav>
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <WordleHeader label="HOME" />

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">⛳</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">USGA Golf Scoring</h3>
              <p className="text-[hsl(var(--muted-foreground))]">Convert Wordle attempts to authentic golf scores with eagles, birdies, and bogeys</p>
            </div>
            <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Major Tournaments</h3>
              <p className="text-[hsl(var(--muted-foreground))]">Four annual championships matching real golf majors with cuts and leaderboards</p>
            </div>
            <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🎂</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Birthday Tournaments</h3>
              <p className="text-[hsl(var(--muted-foreground))]">Personal celebration tournaments with stroke advantages for birthday players</p>
            </div>
            <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Handicap System</h3>
              <p className="text-[hsl(var(--muted-foreground))]">Fair competition with automatic USGA-style handicap calculations</p>
            </div>
            <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Family Groups</h3>
              <p className="text-[hsl(var(--muted-foreground))]">Private family competitions with secure invite codes</p>
            </div>
            <div className="bg-[hsl(var(--card))] p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">Easy Score Entry</h3>
              <p className="text-[hsl(var(--muted-foreground))]">Quick score submission with easy online upload</p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-white rounded-lg p-8 shadow-md mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#6aaa64] font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Play Wordle</h3>
                <p className="text-gray-500 text-sm">Complete your daily Wordle puzzle</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#6aaa64] font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Submit Score</h3>
                <p className="text-gray-500 text-sm">Enter your attempts (1-7)</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#6aaa64] font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Golf Score</h3>
                <p className="text-gray-500 text-sm">Automatic conversion to golf terminology</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#6aaa64] font-bold">4</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Compete</h3>
                <p className="text-gray-500 text-sm">Track rankings and tournament progress</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
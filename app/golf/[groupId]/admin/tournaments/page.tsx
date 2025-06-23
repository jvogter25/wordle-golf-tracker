'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { 
  createTournament, 
  getTournamentsByGroup, 
  getGroupMembers,
  updateTournament,
  deleteTournament 
} from '@/lib/tournaments'
import Link from 'next/link'

interface TournamentForm {
  name: string
  tournament_type: 'birthday' | 'major'
  start_date: string
  end_date: string
  venue: string
  birthday_user_id: string
  birthday_advantage: number
}

export default function AdminTournamentsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string
  const supabase = createClientComponentClient()

  const [tournaments, setTournaments] = useState<any[]>([])
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [tournamentForm, setTournamentForm] = useState<TournamentForm>({
    name: '',
    tournament_type: 'birthday',
    start_date: '',
    end_date: '',
    venue: 'Wordle Golf',
    birthday_user_id: '',
    birthday_advantage: 2.0
  })

  useEffect(() => {
    loadData()
  }, [groupId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tournamentsData, membersData] = await Promise.all([
        getTournamentsByGroup(supabase, groupId),
        getGroupMembers(supabase, groupId)
      ])
      
      setTournaments(tournamentsData || [])
      setGroupMembers(membersData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load tournament data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTournament = async () => {
    if (!tournamentForm.name.trim()) {
      alert('Please enter a tournament name')
      return
    }

    if (!tournamentForm.start_date || !tournamentForm.end_date) {
      alert('Please select start and end dates')
      return
    }

    if (tournamentForm.tournament_type === 'birthday' && !tournamentForm.birthday_user_id) {
      alert('Please select a birthday person for birthday tournaments')
      return
    }

    try {
      setCreating(true)
      
      const tournamentData = {
        name: tournamentForm.name,
        tournament_type: tournamentForm.tournament_type,
        group_id: groupId,
        start_date: tournamentForm.start_date,
        end_date: tournamentForm.end_date,
        venue: tournamentForm.venue,
        ...(tournamentForm.tournament_type === 'birthday' && {
          birthday_user_id: tournamentForm.birthday_user_id,
          birthday_advantage: tournamentForm.birthday_advantage
        })
      }

      await createTournament(supabase, tournamentData)
      
      alert('Tournament created successfully!')
      setShowCreateForm(false)
      setTournamentForm({
        name: '',
        tournament_type: 'birthday',
        start_date: '',
        end_date: '',
        venue: 'Wordle Golf',
        birthday_user_id: '',
        birthday_advantage: 2.0
      })
      
      await loadData()
    } catch (error) {
      console.error('Error creating tournament:', error)
      alert('Failed to create tournament')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteTournament(supabase, tournamentId)
      alert('Tournament deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert('Failed to delete tournament')
    }
  }

  const toggleTournamentStatus = async (tournament: any) => {
    try {
      await updateTournament(supabase, tournament.id, {
        is_active: !tournament.is_active
      })
      alert(`Tournament ${tournament.is_active ? 'deactivated' : 'activated'}`)
      await loadData()
    } catch (error) {
      console.error('Error updating tournament:', error)
      alert('Failed to update tournament status')
    }
  }

  const categorizedTournaments = {
    active: tournaments.filter(t => {
      const today = new Date().toISOString().split('T')[0]
      return t.is_active && t.start_date <= today && t.end_date >= today
    }),
    upcoming: tournaments.filter(t => {
      const today = new Date().toISOString().split('T')[0]
      return t.start_date > today
    }),
    past: tournaments.filter(t => {
      const today = new Date().toISOString().split('T')[0]
      return t.end_date < today
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tournament Administration</h1>
        <div className="flex gap-4">
          <Link
            href={`/golf/${groupId}/tournaments`}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold"
          >
            Back to Tournaments
          </Link>
          <Link
            href={`/golf/${groupId}/admin/submit-score`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
          >
            Submit Score for User
          </Link>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create Tournament'}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Tournament</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="tournament-name" className="block text-sm font-medium mb-1">Tournament Name</label>
              <Input
                id="tournament-name"
                value={tournamentForm.name}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tournament name"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="tournament-type" className="block text-sm font-medium mb-1">Tournament Type</label>
              <select
                id="tournament-type"
                value={tournamentForm.tournament_type}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, tournament_type: e.target.value as 'birthday' | 'major' }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="birthday">Birthday Tournament</option>
                <option value="major">Major Tournament</option>
              </select>
            </div>

            {tournamentForm.tournament_type === 'birthday' && (
              <>
                <div>
                  <label htmlFor="birthday-user" className="block text-sm font-medium mb-1">Birthday Person</label>
                  <select
                    id="birthday-user"
                    value={tournamentForm.birthday_user_id}
                    onChange={(e) => setTournamentForm(prev => ({ ...prev, birthday_user_id: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select birthday person</option>
                    {groupMembers.map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.profiles?.display_name || member.profiles?.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="birthday-advantage" className="block text-sm font-medium mb-1">Birthday Advantage (strokes)</label>
                  <Input
                    id="birthday-advantage"
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={tournamentForm.birthday_advantage}
                    onChange={(e) => setTournamentForm(prev => ({ ...prev, birthday_advantage: parseFloat(e.target.value) || 0 }))}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="start-date" className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                id="start-date"
                type="date"
                value={tournamentForm.start_date}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium mb-1">End Date</label>
              <Input
                id="end-date"
                type="date"
                value={tournamentForm.end_date}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium mb-1">Venue</label>
              <Input
                id="venue"
                value={tournamentForm.venue}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, venue: e.target.value }))}
                placeholder="Tournament venue"
                className="w-full"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCreateTournament}
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? 'Creating...' : 'Create Tournament'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        <TournamentSection
          title="🔴 Active Tournaments"
          tournaments={categorizedTournaments.active}
          onToggleStatus={toggleTournamentStatus}
          onDelete={handleDeleteTournament}
          emptyMessage="No active tournaments"
        />

        <TournamentSection
          title="🔵 Upcoming Tournaments"
          tournaments={categorizedTournaments.upcoming}
          onToggleStatus={toggleTournamentStatus}
          onDelete={handleDeleteTournament}
          emptyMessage="No upcoming tournaments"
        />

        <TournamentSection
          title="⚫ Past Tournaments"
          tournaments={categorizedTournaments.past}
          onToggleStatus={toggleTournamentStatus}
          onDelete={handleDeleteTournament}
          emptyMessage="No past tournaments"
        />
      </div>
    </div>
  )
}

function TournamentSection({ 
  title, 
  tournaments, 
  onToggleStatus, 
  onDelete, 
  emptyMessage 
}: {
  title: string
  tournaments: any[]
  onToggleStatus: (tournament: any) => void
  onDelete: (id: string, name: string) => void
  emptyMessage: string
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {tournaments.length === 0 ? (
        <p className="text-gray-500 italic">{emptyMessage}</p>
      ) : (
        <div className="grid gap-4">
          {tournaments.map(tournament => (
            <Card key={tournament.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {tournament.tournament_type === 'birthday' && '🎂'} {tournament.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Type:</strong> {tournament.tournament_type === 'birthday' ? 'Birthday Tournament' : 'Major Tournament'}</p>
                    <p><strong>Dates:</strong> {tournament.start_date} to {tournament.end_date}</p>
                    <p><strong>Venue:</strong> {tournament.venue}</p>
                    {tournament.tournament_type === 'birthday' && tournament.profiles?.display_name && (
                      <p><strong>Birthday Person:</strong> {tournament.profiles.display_name}</p>
                    )}
                    {tournament.tournament_type === 'birthday' && tournament.birthday_advantage > 0 && (
                      <p><strong>Birthday Advantage:</strong> -{tournament.birthday_advantage} strokes</p>
                    )}
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        tournament.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => onToggleStatus(tournament)}
                    variant="outline"
                    size="sm"
                  >
                    {tournament.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => onDelete(tournament.id, tournament.name)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
import { TournamentPlayer } from './TournamentAddPlayerScreen';

export interface TournamentMatch
{
  id: number;
  player1: TournamentPlayer;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  round: number;
}

export interface TournamentRound
{
  roundNumber: number;
  matches: TournamentMatch[];
}

export class Tournament
{
  private players: TournamentPlayer[] = [];
  private rounds: TournamentRound[] = [];
  private currentRound: number = 0;
  private currentMatchIndex: number = 0;
  private matchIdCounter: number = 0;

  constructor(players: TournamentPlayer[])
  {
    this.players = this.shufflePlayers([...players]);
    this.generateFirstRound();
  }

  private shufflePlayers(players: TournamentPlayer[]): TournamentPlayer[]
  {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateFirstRound(): void
  {
    const matches: TournamentMatch[] = [];
    const playersCopy = [...this.players];

    if (playersCopy.length % 2 !== 0)
    {
      const byePlayer = playersCopy.pop()!;
      matches.push({id: this.matchIdCounter++, player1: byePlayer, player2: null, winner: byePlayer, round: 0});
    }

    for (let i = 0; i < playersCopy.length; i += 2)
    {
      matches.push({id: this.matchIdCounter++, player1: playersCopy[i], player2: playersCopy[i + 1], winner: null, round: 0});
    }

    this.rounds.push({roundNumber: 0, matches});
  }

  recordMatchResult(matchId: number, winner: TournamentPlayer): void
  {
    const currentRound = this.rounds[this.currentRound];
    const match = currentRound.matches.find(m => m.id === matchId);
    
    if (match)
    {
      match.winner = winner;
      this.currentMatchIndex++;

      if (this.isRoundComplete())
      {
        if (!this.isTournamentComplete())
        {
          this.generateNextRound();
          this.currentRound++;
          this.currentMatchIndex = 0;
        }
      }
    }
  }

  private isRoundComplete(): boolean
  {
    const currentRound = this.rounds[this.currentRound];
    return currentRound.matches.every(m => m.winner !== null);
  }

  private generateNextRound(): void
  {
    const currentRound = this.rounds[this.currentRound];
    const winners = currentRound.matches.filter(m => m.winner !== null).map(m => m.winner!);

    const matches: TournamentMatch[] = [];

    if (winners.length % 2 !== 0)
    {
      const byePlayer = winners.pop()!;
      matches.push({id: this.matchIdCounter++, player1: byePlayer, player2: null, winner: byePlayer, round: this.currentRound + 1});
    }

    for (let i = 0; i < winners.length; i += 2)
    {
      matches.push({id: this.matchIdCounter++, player1: winners[i], player2: winners[i + 1], winner: null, round: this.currentRound + 1});
    }

    this.rounds.push({roundNumber: this.currentRound + 1, matches});
  }

  isTournamentComplete(): boolean
  {
    if (this.rounds.length === 0)
      return false;
    
    const lastRound = this.rounds[this.rounds.length - 1];
    return lastRound.matches.length === 1 && lastRound.matches[0].winner !== null;
  }

  getTournamentWinner(): TournamentPlayer | null
  {
    if (!this.isTournamentComplete())
      return null;
    
    const lastRound = this.rounds[this.rounds.length - 1];
    return lastRound.matches[0].winner;
  }

  getNextMatch(): TournamentMatch | null
  {
    const currentRound = this.rounds[this.currentRound];
    const nextMatch = currentRound.matches.find(m => m.winner === null && m.player2 !== null);
    return nextMatch || null;
  }

  getRounds(): TournamentRound[]
  {
    return this.rounds;
  }

  getCurrentRound(): TournamentRound
  {
    return this.rounds[this.currentRound];
  }

  getCurrentRoundNumber(): number
  {
    return this.currentRound;
  }

  getPlayerCount(): number
  {
    return this.players.length;
  }
}

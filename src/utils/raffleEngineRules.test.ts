import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCryptoRandom,
  normalizeParticipantName,
  calculateDeterministicWheelSpin,
  calculateDeterministicChallengeSpin,
  generateTournamentBracket,
  advanceTournamentWinner,
  createInitialRaffleState
} from './raffleEngineRules.js';

test('normalizeParticipantName removes extra spaces, accents, and punctuation', () => {
  assert.equal(normalizeParticipantName('  José María   Pérez! '), 'jose maria perez');
  assert.equal(normalizeParticipantName('Ángela   GÓMEZ'), 'angela gomez');
  assert.equal(normalizeParticipantName('Carlos-Eduardo #12'), 'carloseduardo 12');
});

test('getCryptoRandom returns number between 0 and 1', () => {
  for (let i = 0; i < 50; i++) {
    const val = getCryptoRandom();
    assert.ok(val >= 0 && val < 1, `Value ${val} out of bounds`);
  }
});

test('calculateDeterministicWheelSpin aligns winner center at 3 o\'clock (0 degrees)', () => {
  const baseState = createInitialRaffleState();
  baseState.participants = [
    { id: '1', name: 'Ana', color: '#ff0000', ticketNumber: 1, eliminated: false },
    { id: '2', name: 'Beto', color: '#00ff00', ticketNumber: 2, eliminated: false },
    { id: '3', name: 'Carlos', color: '#0000ff', ticketNumber: 3, eliminated: false },
    { id: '4', name: 'Diana', color: '#ffff00', ticketNumber: 4, eliminated: false },
  ];
  baseState.spinDurationSeconds = 5;

  const spin = calculateDeterministicWheelSpin(baseState, 0);
  assert.ok(spin);
  assert.ok(spin.winnerItem);
  assert.ok(spin.winnerIndex >= 0 && spin.winnerIndex < 4);

  // Pointer is at 3 o'clock (0 / 360 deg).
  // Winner slice center:
  const sliceDeg = 360 / baseState.participants.length;
  const centerOfWinner = spin.winnerIndex * sliceDeg + sliceDeg / 2;
  const landedAngle = (centerOfWinner + (spin.targetAngle % 360)) % 360;

  assert.equal(Math.round(landedAngle), 0);
});

test('calculateDeterministicChallengeSpin picks persona, challenge and prize', () => {
  const baseState = createInitialRaffleState();
  baseState.participants = [
    { id: '1', name: 'Laura', color: '#ff0000', ticketNumber: 10, eliminated: false },
    { id: '2', name: 'David', color: '#00ff00', ticketNumber: 11, eliminated: false }
  ];
  baseState.challengesList = ['Canta una alabanza'];
  baseState.prizesList = ['Un chocolate artesanal'];

  const spin = calculateDeterministicChallengeSpin(baseState);
  assert.ok(spin);
  assert.ok(spin.winnerItem?.name === 'Laura' || spin.winnerItem?.name === 'David');
  assert.equal(spin.challengeText, 'Canta una alabanza');
  assert.equal(spin.prizeText, 'Un chocolate artesanal');
  assert.equal(spin.slotFinalIndices?.length, 3);
});

test('generateTournamentBracket creates balanced tree and advanceTournamentWinner propagates', () => {
  const participants = [
    { id: 'p1', name: 'Team Alpha', color: '#ff0000', ticketNumber: 1, eliminated: false },
    { id: 'p2', name: 'Team Beta', color: '#00ff00', ticketNumber: 2, eliminated: false },
    { id: 'p3', name: 'Team Gamma', color: '#0000ff', ticketNumber: 3, eliminated: false },
    { id: 'p4', name: 'Team Delta', color: '#ffff00', ticketNumber: 4, eliminated: false },
  ];

  const bracket = generateTournamentBracket(participants, 4);
  assert.equal(bracket.size, 4);
  assert.equal(bracket.matches.length, 3); // 2 in R1, 1 in Final

  const r0m0 = bracket.matches.find(m => m.roundIndex === 0 && m.matchIndex === 0);
  assert.ok(r0m0);
  const advancingTeam = r0m0!.teamA;
  assert.ok(advancingTeam.length > 0);

  // Advance team to final
  const updatedBracket = advanceTournamentWinner(bracket, r0m0!.id, advancingTeam);
  const finalMatch = updatedBracket.matches.find(m => m.roundIndex === 1 && m.matchIndex === 0);
  assert.ok(finalMatch);
  assert.equal(finalMatch?.teamA, advancingTeam);
});

import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Username & Password Session Validation
test('ID + Password Auth: Authenticates credentials and rejects invalid password', () => {
  const users = [
    { username_lower: 'aishowner', role: 'owner', active: true },
    { username_lower: 'warden_selaiyur', role: 'warden', active: true },
  ];

  function authenticate(id, validPass) {
    const user = users.find((u) => u.username_lower === id.toLowerCase().trim());
    if (!user || !user.active) return { success: false, error: 'Invalid ID or password.' };
    if (!validPass) return { success: false, error: 'Invalid ID or password.' };
    return { success: true, user: { role: user.role } };
  }

  // Exact ID
  assert.equal(authenticate('Aishowner', true).success, true);
  // Case-insensitive ID
  assert.equal(authenticate('aishowner', true).success, true);
  // Invalid password
  assert.equal(authenticate('Aishowner', false).success, false);
  // Unknown ID
  assert.equal(authenticate('nonexistent', true).success, false);
});

// Test 2: FIFO Payment Allocation
test('FIFO Payment Allocation: Settles oldest invoice first', () => {
  const invoices = [
    { id: 'inv-1', month: '2026-09', amount_due: 6000, amount_paid: 0, status: 'overdue' },
    { id: 'inv-2', month: '2026-10', amount_due: 6000, amount_paid: 2000, status: 'partial' },
    { id: 'inv-3', month: '2026-11', amount_due: 6000, amount_paid: 0, status: 'pending' },
  ];

  // Payment of ₹9,000 received
  function allocatePaymentFifo(invList, paymentAmount) {
    let remaining = paymentAmount;
    return invList.map((inv) => {
      if (remaining <= 0) return inv;
      const balance = inv.amount_due - inv.amount_paid;
      if (remaining >= balance) {
        remaining -= balance;
        return { ...inv, amount_paid: inv.amount_due, status: 'paid' };
      } else {
        const added = remaining;
        remaining = 0;
        return { ...inv, amount_paid: inv.amount_paid + added, status: 'partial' };
      }
    });
  }

  const settled = allocatePaymentFifo(invoices, 9000);
  // inv-1 needed 6000 -> fully paid, remaining 3000
  // inv-2 had 4000 balance -> gets 3000 -> amount_paid = 5000 (status partial)
  // inv-3 gets 0 -> remains pending
  assert.equal(settled[0].status, 'paid');
  assert.equal(settled[0].amount_paid, 6000);
  assert.equal(settled[1].status, 'partial');
  assert.equal(settled[1].amount_paid, 5000);
  assert.equal(settled[2].status, 'pending');
  assert.equal(settled[2].amount_paid, 0);
});

// Test 3: Vacate Settlement Calculation
test('Vacate Settlement: Accurately computes deposit refund vs dues', () => {
  function calculateSettlement(depositPaid, unpaidRent, damages, extra) {
    const totalDues = unpaidRent + damages + extra;
    const net = totalDues - depositPaid;
    return {
      depositPaid,
      totalDues,
      netPayable: net,
      refundAmount: net < 0 ? Math.abs(net) : 0,
      balanceDue: net > 0 ? net : 0,
    };
  }

  // Case A: Resident has ₹4,000 deposit, ₹1,500 unpaid rent, ₹500 damages
  // Net = (1500 + 500) - 4000 = -2000 => ₹2,000 refund to resident
  const caseA = calculateSettlement(4000, 1500, 500, 0);
  assert.equal(caseA.refundAmount, 2000);
  assert.equal(caseA.balanceDue, 0);

  // Case B: Resident has ₹4,000 deposit, ₹6,000 unpaid rent, ₹1,000 damages
  // Net = (6000 + 1000) - 4000 = +3000 => ₹3,000 due from resident
  const caseB = calculateSettlement(4000, 6000, 1000, 0);
  assert.equal(caseB.refundAmount, 0);
  assert.equal(caseB.balanceDue, 3000);
});

// Test 4: Bed Double-Booking Prevention
test('Double-booking prevention: rejects assignment if bed is occupied', () => {
  const beds = [
    { id: 'bed-1', room_id: 'rm-1', status: 'occupied' },
    { id: 'bed-2', room_id: 'rm-1', status: 'vacant' },
  ];

  function assignBed(bedList, targetBedId) {
    const bed = bedList.find((b) => b.id === targetBedId);
    if (!bed || bed.status !== 'vacant') {
      throw new Error('Double-booking rejected: Bed is already occupied or maintenance.');
    }
    return bedList.map((b) => (b.id === targetBedId ? { ...b, status: 'occupied' } : b));
  }

  assert.throws(() => assignBed(beds, 'bed-1'), /Double-booking rejected/);
  const updated = assignBed(beds, 'bed-2');
  assert.equal(updated.find((b) => b.id === 'bed-2').status, 'occupied');
});

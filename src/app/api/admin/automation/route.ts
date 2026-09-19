import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/data/db';
import { checkAdminAuth } from '@/lib/auth';

// ─── Helper: write a log entry (silent on failure) ───────────────────────────
async function log(level: string, message: string) {
  try {
    await supabaseAdmin.from('automation_logs').insert([{ level, message }]);
  } catch (_) {}
}

// ─── GET: fetch current state + last 50 logs ─────────────────────────────────
export async function GET() {
  try {
    if (!(await checkAdminAuth()))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: state, error: stateError } = await supabaseAdmin
      .from('automation_state')
      .select(`*, sections ( title )`)
      .eq('id', 'singleton')
      .single();

    if (stateError) {
      return NextResponse.json(
        { error: 'State not found or DB not migrated' },
        { status: 500 }
      );
    }

    const { data: logs } = await supabaseAdmin
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ state, logs: logs || [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── POST: control actions ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    if (!(await checkAdminAuth()))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json();

    // ── start / resume ────────────────────────────────────────────────────────
    if (action === 'start' || action === 'resume') {
      // Only update status — NEVER touch progress counters or section cursor.
      // The Worker reads status on every execution and will pick up from where
      // it left off thanks to current_section_id / current_page in the DB.
      await supabaseAdmin
        .from('automation_state')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', 'singleton');

      await log('info', `automation started (action: ${action})`);
      return NextResponse.json({ success: true });
    }

    // ── stop ──────────────────────────────────────────────────────────────────
    if (action === 'stop') {
      // Safe stop: set status to stopped + release any stale lock.
      // Progress (current_section_id, current_page, counters) is PRESERVED
      // so the next Start will resume from exactly where we left off.
      // The Worker checks state.status at the top of every execution, so no
      // in-flight import is interrupted — it simply won't start the next one.
      await supabaseAdmin
        .from('automation_state')
        .update({
          status: 'stopped',
          updated_at: new Date().toISOString(),
          // current_section_id  — intentionally NOT reset
          // current_page        — intentionally NOT reset
          // section_products_imported — intentionally NOT reset
          // total_* counters    — intentionally NOT reset
          // next_run_at         — intentionally NOT reset
        })
        .eq('id', 'singleton');

      await log('info', 'automation stopped (progress preserved)');
      return NextResponse.json({ success: true });
    }

    // ── run_now ───────────────────────────────────────────────────────────────
    // Clears next_run_at so the next Cron tick runs immediately instead of
    // waiting. Does NOT bypass the lock — if a Worker is mid-execution the
    // next tick will skip due to locked_at, which is the correct behaviour.
    if (action === 'run_now') {
      const { data: current } = await supabaseAdmin
        .from('automation_state')
        .select('status, locked_at')
        .eq('id', 'singleton')
        .single();

      if (!current) {
        return NextResponse.json({ error: 'State not found' }, { status: 500 });
      }

      // If currently locked (Worker running right now), refuse — don't stack.
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      const isLocked =
        current.locked_at &&
        new Date(current.locked_at) > tenMinsAgo;

      if (isLocked) {
        return NextResponse.json(
          { error: 'Worker is currently executing. Wait for it to finish.' },
          { status: 409 }
        );
      }

      // Ensure status is running (in case the admin calls run_now while stopped)
      await supabaseAdmin
        .from('automation_state')
        .update({
          status: 'running',
          next_run_at: null,         // clear the wait window → run immediately
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'singleton');

      await log('info', 'manual run requested — next_run_at cleared');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    await log('error', `Control action failed: ${String(err)}`);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

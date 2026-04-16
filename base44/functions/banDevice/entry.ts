import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { fingerprint, reason, notes, userAgent, action, recordId, email } = await req.json();

    if (action === 'unban') {
      await base44.asServiceRole.entities.BannedDevice.update(recordId, { is_active: false });
      return Response.json({ success: true });
    }

    // Ban all devices associated with an email
    if (action === 'banByEmail') {
      const allDevices = await base44.asServiceRole.entities.BannedDevice.list();
      const matched = (allDevices || []).filter(d => (d.associated_emails || []).includes(email));
      if (matched.length === 0) {
        // No device records found — create a placeholder fingerprint tied to email
        await base44.asServiceRole.entities.BannedDevice.create({
          fingerprint: 'email:' + email,
          reason: reason || '帳號封禁',
          banned_by: user.email,
          user_agent: '',
          is_active: true,
          notes: notes || '',
          associated_emails: [email],
        });
      } else {
        for (const d of matched) {
          await base44.asServiceRole.entities.BannedDevice.update(d.id, {
            is_active: true,
            reason: reason || d.reason || '帳號封禁',
            banned_by: user.email,
          });
        }
      }
      return Response.json({ success: true });
    }

    // Unban all devices associated with an email
    if (action === 'unbanByEmail') {
      const allDevices = await base44.asServiceRole.entities.BannedDevice.list();
      const matched = (allDevices || []).filter(d => (d.associated_emails || []).includes(email));
      for (const d of matched) {
        await base44.asServiceRole.entities.BannedDevice.update(d.id, { is_active: false });
      }
      return Response.json({ success: true });
    }

    if (action === 'ban') {
      // Check if record already exists
      const existing = await base44.asServiceRole.entities.BannedDevice.filter({ fingerprint });
      if (existing && existing.length > 0) {
        await base44.asServiceRole.entities.BannedDevice.update(existing[0].id, {
          is_active: true,
          reason: reason || existing[0].reason,
          banned_by: user.email,
          notes: notes || existing[0].notes,
        });
      } else {
        await base44.asServiceRole.entities.BannedDevice.create({
          fingerprint,
          reason: reason || '管理員封禁',
          banned_by: user.email,
          user_agent: userAgent || '',
          is_active: true,
          notes: notes || '',
          associated_emails: [],
        });
      }
      return Response.json({ success: true });
    }

    // Check if any active banned device is associated with an email
    if (action === 'checkByEmail') {
      const allDevices = await base44.asServiceRole.entities.BannedDevice.list();
      const banned = (allDevices || []).some(d => d.is_active && (d.associated_emails || []).includes(email));
      return Response.json({ banned });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
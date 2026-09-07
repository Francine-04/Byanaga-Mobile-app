export function timestamp(value) {
  if (value?.toMillis) return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  const result = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(result) ? result : 0;
}

function eventTime(date, time, fallback) {
  const millis = timestamp(date);
  if (!millis) return 0;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(millis));
  const part = (type) => parts.find((item) => item.type === type).value;
  const clock = /^\d{1,2}:\d{2}$/.test(time || '') ? time.padStart(5, '0') + ':00' : fallback;
  return timestamp(`${part('year')}-${part('month')}-${part('day')}T${clock}+08:00`);
}

export function buildNotificationFeed({ events = [], vouchers = [], establishmentPosts = [], direct = [], trips = [], zones = [], now = Date.now() }) {
  const items = [];
  const add = (id, category, title, message, createdAt, route, params) => items.push({ id, category, title, message, createdAt, route, params });
  const soon = (date) => date >= now && date - now <= 24 * 60 * 60 * 1000;
  events.forEach((event) => {
    if (!['upcoming', 'ongoing'].includes(event.status) || eventTime(event.endDate, event.endTime, '23:59:59') < now) return;
    add(`event-${event.id}`, 'System Updates', `Event: ${event.title}`, `${event.date} at ${event.venue}`, timestamp(event.createdAt), 'Events');
    const starts = eventTime(event.startDate, event.startTime, '00:00:00');
    if (soon(starts)) add(`event-reminder-${event.id}-${starts}`, 'Travel Reminders', `${event.title} is coming up`, `${event.date} at ${event.venue}`, starts - 86400000, 'Events');
  });
  vouchers.forEach((voucher) => {
    if (!['approved', 'active'].includes(voucher.status) || timestamp(voucher.validUntil) < now || timestamp(voucher.validFrom) > now || voucher.maxClaimLimit <= 0 || voucher.claimCount >= voucher.maxClaimLimit) return;
    add(
      `voucher-${voucher.id}`,
      'Promotions',
      voucher.title,
      [voucher.discountDisplay, voucher.establishmentName, voucher.description].filter(Boolean).join(' - '),
      timestamp(voucher.publishedAt || voucher.createdAt),
      'Offers',
      { voucherId: voucher.id }
    );
  });
  establishmentPosts.forEach((post) => {
    if (post.status !== 'published' || !post.establishmentId) return;
    add(
      `establishment-post-${post.id}`,
      'System Updates',
      post.establishmentName ? `${post.establishmentName}: ${post.category}` : `Establishment ${post.category}`,
      post.caption || 'A local establishment published a new update.',
      timestamp(post.updatedAt || post.createdAt),
      'EstablishmentDetails',
      { establishmentId: post.establishmentId }
    );
  });
  direct.forEach((item) => add(`notice-${item.id}`, 'System Updates', item.title, item.message, timestamp(item.createdAt), item.route, item.params));
  trips.forEach((trip) => {
    if (trip.status !== 'Upcoming') return;
    // Stored travel dates are calendar dates in Naga City, not UTC dates.
    const starts = timestamp(`${trip.travelDate}T00:00:00+08:00`);
    if (soon(starts) || (now >= starts && now < starts + 86400000)) {
      add(`trip-reminder-${trip.id}-${trip.travelDate}`, 'Travel Reminders', `Your trip: ${trip.name}`, `Your itinerary is scheduled for ${trip.travelDate}.`, starts - 86400000, 'Main', { screen: 'Trips' });
    }
  });
  zones.filter((zone) => zone.source === 'dashboard' && ['busy', 'crowded'].includes(zone.colorKey)).forEach((zone) => {
    add(`heat-${zone.id}-${zone.colorKey}-${zone.count}`, 'System Updates', `Heatmap: ${zone.label}`, `${zone.level} relative to other areas, based on encoded visits and event attendance.`, 0, 'Main', { screen: 'Heatmap' });
  });
  return items.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}

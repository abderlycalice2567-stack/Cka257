-- Reference data: roles and least-privilege permissions (not sample content).

INSERT INTO permissions (key, description) VALUES
  ('admin.access',          'Open the administration area'),
  ('station.manage',        'Manage station settings, stream endpoints and now-playing provider'),
  ('programs.manage',       'Create and edit programs and categories'),
  ('presenters.manage',     'Create and edit presenter profiles'),
  ('schedule.manage',       'Manage recurring schedules and individual broadcast occurrences'),
  ('episodes.manage',       'Create and edit episodes, chapters and transcripts'),
  ('episodes.publish',      'Approve and publish episodes after rights review'),
  ('media.upload',          'Upload audio and image files'),
  ('content.manage',        'Manage articles, devotionals, events and pages'),
  ('community.moderate',    'Moderate testimonies and read contact messages'),
  ('prayer.view_assigned',  'Read prayer requests assigned to me'),
  ('prayer.manage',         'Read, assign and moderate all prayer requests'),
  ('users.manage',          'Manage accounts and role assignments'),
  ('finance.view',          'View donations, campaigns and sponsorship inquiries'),
  ('integrations.manage',   'Configure external platform integrations'),
  ('audit.view',            'View the audit log'),
  ('sample.purge',          'Remove all sample content before launch');

INSERT INTO roles (key, name, description, is_staff) VALUES
  ('super_admin',      'Super Administrator', 'Complete system access', true),
  ('station_director', 'Station Director',    'Station operations, management and reporting', true),
  ('program_director', 'Program Director',    'Programming, presenter assignments and schedules', true),
  ('presenter',        'Presenter',           'Access to assigned programs', true),
  ('producer',         'Producer',            'Recordings, production assets and episodes', true),
  ('editor',           'Editor',              'Content review, approval and publication', true),
  ('moderator',        'Moderator',           'Community engagement and moderation', true),
  ('prayer_team',      'Prayer Team Member',  'Restricted access to assigned prayer requests', true),
  ('finance_manager',  'Finance Manager',     'Donations, sponsorships and financial reports', true),
  ('subscriber',       'Subscriber',          'Personal account features', false);

INSERT INTO role_permissions (role_key, permission_key)
SELECT 'super_admin', key FROM permissions;

INSERT INTO role_permissions (role_key, permission_key)
SELECT 'station_director', key FROM permissions WHERE key NOT IN ('users.manage','sample.purge');

INSERT INTO role_permissions (role_key, permission_key) VALUES
  ('program_director','admin.access'), ('program_director','programs.manage'),
  ('program_director','presenters.manage'), ('program_director','schedule.manage'),
  ('program_director','episodes.manage'), ('program_director','media.upload'),
  ('presenter','admin.access'),
  ('producer','admin.access'), ('producer','episodes.manage'), ('producer','media.upload'),
  ('editor','admin.access'), ('editor','episodes.manage'), ('editor','episodes.publish'),
  ('editor','media.upload'), ('editor','content.manage'),
  ('moderator','admin.access'), ('moderator','community.moderate'),
  ('prayer_team','admin.access'), ('prayer_team','prayer.view_assigned'),
  ('finance_manager','admin.access'), ('finance_manager','finance.view');

-- Platform catalog: every integration starts disabled and unverified.
INSERT INTO platform_integrations (key, name, kind, sort) VALUES
  ('spotify',       'Spotify',         'podcast',        10),
  ('apple',         'Apple Podcasts',  'podcast',        20),
  ('amazon',        'Amazon Music',    'podcast',        30),
  ('deezer',        'Deezer',          'podcast',        40),
  ('youtube',       'YouTube',         'video',          50),
  ('tunein',        'TuneIn',          'live_directory', 60),
  ('zeno',          'Zeno.FM',         'live_directory', 70),
  ('radio_garden',  'Radio Garden',    'live_directory', 80),
  ('radio_net',     'Radio.net',       'live_directory', 90),
  ('facebook',      'Facebook',        'social',        100),
  ('instagram',     'Instagram',       'social',        110),
  ('tiktok',        'TikTok',          'social',        120),
  ('whatsapp',      'WhatsApp',        'social',        130);

INSERT INTO site_settings (key, value) VALUES
  ('now_playing', '{"provider":"none","baseUrl":"","stationShortcode":""}'),
  ('homepage', '{"sections":["hero","now","next","replays","programs","platforms","presenters","news","events","spiritual","newsletter","support"]}');

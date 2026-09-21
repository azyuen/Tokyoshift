const BACKGROUND_ROOT = 'assets/Meet/Backgrounds';

const slug = value => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export function meetBackgroundPath(district, location) {
  return `${BACKGROUND_ROOT}/${slug(district)}_${slug(location)}.png`;
}

export const meetBackgrounds = [
  {
    key: 'meetWangan711',
    district: 'wangan',
    location: '711',
    path: meetBackgroundPath('wangan', '711'),
    label: 'WANGAN // 7-ELEVEN',
  },
  {
    key: 'meetWanganDocks',
    district: 'wangan',
    location: 'docks',
    path: meetBackgroundPath('wangan', 'docks'),
    label: 'WANGAN // DOCKS',
    optional: true,
    fallbackKey: 'meetWangan711',
  },
  {
    key: 'meetWanganBridge',
    district: 'wangan',
    location: 'bridge',
    path: meetBackgroundPath('wangan', 'bridge'),
    label: 'WANGAN // BRIDGE',
  },
];

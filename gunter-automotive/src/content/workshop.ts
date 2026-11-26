/**
 * Workshop gallery. Every entry here is an ILLUSTRATIVE placeholder for the
 * private demo. Replace with owner-approved photos (with rights confirmed)
 * and set `illustrative: false`. If there are no approved photos at launch,
 * the /workshop route and nav link are hidden in live mode.
 */
export type WorkshopPhoto = { src: string | null; alt: string; caption: string; illustrative: boolean };

export const workshopPhotos: WorkshopPhoto[] = [
  { src: null, alt: "Illustrative placeholder for a shop exterior photo", caption: "Shop exterior (photo pending owner approval)", illustrative: true },
  { src: null, alt: "Illustrative placeholder for a service bay photo", caption: "Service bay (photo pending owner approval)", illustrative: true },
  { src: null, alt: "Illustrative placeholder for a technician at work", caption: "Technician at work (photo pending owner approval)", illustrative: true },
  { src: null, alt: "Illustrative placeholder for a vehicle maintenance photo", caption: "Vehicle maintenance (photo pending owner approval)", illustrative: true },
];

export const approvedWorkshopPhotos = () => workshopPhotos.filter((p) => !p.illustrative && p.src);

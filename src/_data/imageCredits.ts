export type ImageCredit = {
  subject: string;
  photographer: string;
  source: string;
  license: string;
  licenseUrl: string;
};

/**
 * Every other photo on the site is Unsplash, whose license doesn't require
 * attribution. This is the one exception — no accurate Saltimbocca alla
 * Romana photo existed on Unsplash or Pexels, so it's sourced from Wikimedia
 * Commons under CC BY-SA 2.0, which does require a visible credit. Add an
 * entry here (and it'll render in the footer) any time another non-Unsplash,
 * attribution-required image gets used.
 */
const imageCredits: ImageCredit[] = [
  {
    subject: "Saltimbocca alla Romana photo",
    photographer: "cyclonebill",
    source: "https://commons.wikimedia.org/wiki/File:Saltimbocca_alla_romana_(7123618999).jpg",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
];

export default imageCredits;

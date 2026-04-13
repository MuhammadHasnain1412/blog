module.exports = {
  siteUrl: "https://thedailymixa.com",
  generateRobotsTxt: true,

  additionalPaths: async () => [
    { loc: "/", priority: 1 },
    { loc: "/archive", priority: 0.8 },
    { loc: "/about", priority: 0.5 },
    { loc: "/contact", priority: 0.4 },
    { loc: "/fashion", priority: 0.7 },
    { loc: "/house", priority: 0.7 },
    { loc: "/lifestyle", priority: 0.7 },
  ],
};
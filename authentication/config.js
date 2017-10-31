module.exports = {
  strategy(accessToken, refreshToken, profile, done) {
    process.nextTick(() => done(null, profile));
  },
};

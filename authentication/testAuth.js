module.exports = {
  confirm(req, res, next) {
    console.log(req.isAuthenticated());
    return req.isAuthenticated() ? next() : res.redirect('/FAILED');
  },
  success(req, res) {
    res.redirect('/seemsLegit');
  },
};

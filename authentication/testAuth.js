module.exports = {
  confirm(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
  },
  success(req, res) {
    res.render('account', { user: req.user });
  },
};

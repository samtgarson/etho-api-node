var app = require('express'), 
    router = app.Router();

router.use('/login', require('./login'));

router.use(require('../middlewares/user'));
router.use('/me', require('./me'));

router.get('/', function(req, res) {
    res.json({ heartbeat: true });   
});

module.exports = router;
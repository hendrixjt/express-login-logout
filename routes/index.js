var express = require('express');
var router = express.Router();
const sqlite = require('sqlite3').verbose();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// router.get('/users/:id', (req, res) => {
//   let userId = parseInt(req.params.id);
//   models.users
//   .find({
//     where: {
//       UserId: userId
//     },
//     include: [models.users]
//   })
//   .then(user => {
//     res.render('specificUser', {
//       FirstName: user.FirstName,
//       LastName: user.LastName,
//       Email: user.Email,
//       UserId: user.UserId
//     });
//   });
// });

module.exports = router;

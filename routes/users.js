var express = require('express');
var router = express.Router();
const sqlite = require('sqlite3').verbose();

var models = require('../models');
const auth = require('../config/auth');
const connectEnsure= require('connect-ensure-login');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get("/signup", function (req, res, next) {
  res.render('signup')
});

router.post('/signup', function(req, res, next) {
  const hashedPassword = auth.hashPassword(req.body.password);
  models.users
    .findOne({
      where: {
        Username: req.body.username
      }
    })
    .then(user => {
      if (user) {
        res.send('this user already exists');
      } else {
        models.users
          .create({
            FirstName: req.body.firstName,
            LastName: req.body.lastName,
            Email: req.body.email,
            Username: req.body.username,
            Password: hashedPassword
          })
          .then(createdUser => {
            const isMatch = createdUser.comparePassword(req.body.password);

            if (isMatch) {
              const userId = createdUser.UserId;
              console.log(userId);
              const token = auth.signUser(createdUser);
              res.cookie('jwt', token);
              res.redirect('profile/' + userId);
            } else {
              console.error('not a match');
            }
          });
      }
    });
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', function (req, res, next) {
  const hashedPassword = auth.hashPassword(req.body.password);
  models.users.findOne({
    where: {
      Username: req.body.username
    }
  }).then(user => {
    const isMatch = user.comparePassword(req.body.password)

    if (!user) {
      return res.status(401).json({
        message: "Login Failed"
      });
    }
    if (isMatch) {
      const userId = user.UserId
      const token = auth.signUser(user);
      res.cookie('jwt', token);
      res.redirect('profile/' + userId)
    } else {
      console.log(req.body.password);
      res.redirect('login')
    }

  });
});

router.get('/profile/:id', auth.verifyUser, function (req, res, next) {
  if (req.params.id !== String(req.user.UserId)) {
    res.send('This is not your profile')
  } else {
    models.posts.findAll({
      where: {
        [Op.and]: {
          Deleted: null,
          UserId: req.user.UserId
        }
      },
      include: [models.users]
    }).then(post => {

      res.render('profile', {
        FirstName: req.user.FirstName,
        LastName: req.user.LastName,
        Email: req.user.Email,
        UserId: req.user.UserId,
        Username: req.user.Username,
        posts: post
      });
    })
  }
});

router.post('/profile/:id', function (req, res) {
  const userId = parseInt(req.params.id);
  // console.log(req.body.postBody)
  models.posts.findOrCreate({
    where: {
      PostTitle: req.body.postTitle,
      PostBody: req.body.postBody,
      UserId: req.params.id
    }
  }).then(post => {
    // console.log(post)
    res.redirect(req.originalUrl)
  })
 })

 router.get('/editPost/:id', auth.verifyUser, function (req, res) {
  // console.log(req.user)
  let postId = parseInt(req.params.id);
  models.posts
    .find({
      where: {
        PostId: postId
      }
    })
    .then(post => {
      res.render('editPost', {
        PostTitle: post.PostTitle,
        PostBody: post.PostBody,
        PostId: post.PostId,
        UserId: post.UserId
      });
    });
 });

 router.put('/editPost/:id', (req, res) => {
  let postId = parseInt(req.params.id);
  // console.log(postId)
  models.posts
    .update({
      PostTitle: req.body.postTitle,
      PostBody: req.body.postBody
    }, {
      where: {
        PostId: postId
      }
    })
    .then(result => {
      res.send();
    });
 });
 
 router.delete('/editPost/:id/delete', auth.verifyUser, (req, res) => {
  let postId = parseInt(req.params.id);
  models.posts
    .update({
      Deleted: 'true'
    }, {
      where: {
        PostId: postId
      }
    })
    .then(post => {
      console.log(post)
      res.send();
    });
 });

router.get('/users/:id', function(req, res, next) {
  let userId = parseInt(req.params.id);
  models.users
    .find({
      where: {
        UserId: userId
      }
    })
    .then(users => {

   res.render('specificUser', {
        user: user
      });
    });
});

router.get('/logout', function (req, res) {
  res.cookie('jwt', null);
  res.redirect('/users/login');
});

router.get('/posts')

router.post('/posts', (req, res) => {
  models.posts
    .findOrCreate({
      where: {
        PostTitle: req.body.name,
        createdAt: req.body.createdAt
      }
    })
    .spread(function(result, created) {
      if (created) {
        res.redirect('/post');
      } else {
        res.send('This post already exists!');
      }
    });
});

router.delete('/users/:id/delete', (req, res) => {
  let userId = parseInt(req.params.id);
  models.users
    .update(
      {
        Deleted: 'true'
      },
      {
        where: {
          UserId: userId
        }
      }
    )
    .then(user => {
      models.users
        .update(
          {
            Deleted: 'true'
          },
          {
            where: {
              UserId: userId
            }
          }
        )
        .then(user => {
          res.redirect('/users');
        });
    });
});

router.get('/admin', function (req, res) {
  models.users.findAll({
    where: {
      [Op.and]: {
        Deleted: null,
        Admin: false
      }
    },
  }).then(users => {
    res.render('adminProfile', {
      users: users
    })
  })
 
 })
 
 router.get('/admin/editUser/:id', function (req, res) {
  let userId = parseInt(req.params.id);
  models.users
    .find({
      where: {
        UserId: userId
      }
    })
    .then(user => {
      res.render('editUser', {
        UserId: user.UserId,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Username: user.Username,
        Email: user.Email,
        createdAt: user.createdAt
      });
    });
 })
 
 router.delete('/admin/editUser/:id/delete', auth.verifyUser, (req, res) => {
  let userId = parseInt(req.params.id);
  models.posts
    .update({
      Deleted: 'true'
    }, {
      where: {
        UserId: userId
      }
    })
    .then(post => {
      models.users
        .update({
          Deleted: 'true'
        }, {
          where: {
            UserId: userId
          }
        })
        .then(user => {
          res.redirect('/admin');
        });
    });
 });


module.exports = router;

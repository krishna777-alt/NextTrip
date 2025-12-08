const express = require('express');
const adminController = require('./../controllers/adminController');

const router = express.Router();

router.route('/login')
.get(adminController.getLogin)
.post(adminController.login);

router.get('/logout',adminController.logout);
///////////////////////////////////////////////////////////////////////////////////////
router.route('/manage-admin')
.get(
    adminController.auth,
    adminController.isAdmin,
    adminController.getManageAdmin,
)
.post(adminController.uploadAdminImage,adminController.createAdmin)

router.get('/get',adminController.getAllAdmin);

router.get(('/'),
adminController.auth,
adminController.isAdmin,
adminController.adminHome);


router.get('/update/:id',adminController.updateAdmin)

module.exports = router;